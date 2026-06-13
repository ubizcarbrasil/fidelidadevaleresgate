/**
 * Mapa de path → dynamic import para prefetch on hover de rotas.
 *
 * Funcionamento: `NavLink` chama `prefetchRoute(to)` em onMouseEnter/onFocus.
 * Se houver entry no mapa, dispara o `import()` em background. Quando o
 * usuário clica, o chunk já está no cache do navegador → navegação fica
 * instantânea (sem flash de Suspense fallback).
 *
 * Custo: 1 fetch HTTP por rota visitada com hover. Cache do browser/SW
 * deduplica chamadas subsequentes.
 *
 * Cobre as ~25 rotas mais visitadas do admin. Não precisa ser exaustivo —
 * rotas não mapeadas seguem o caminho normal (download no clique).
 */

type Prefetch = () => Promise<unknown>;

const ROUTE_PREFETCH: Record<string, Prefetch> = {
  // Core admin
  "/": () => import("@/pages/Dashboard"),
  "/customers": () => import("@/pages/CustomersPage"),
  "/offers": () => import("@/pages/OffersPage"),
  "/stores": () => import("@/pages/StoresPage"),
  "/vouchers": () => import("@/pages/Vouchers"),
  "/redemptions": () => import("@/pages/RedemptionsPage"),
  "/branch-wallet": () => import("@/pages/BranchWalletPage"),
  "/reports": () => import("@/pages/ReportsPage"),
  "/branch-reports": () => import("@/pages/BranchReportsPage"),

  // Pontos
  "/earn-points": () => import("@/pages/EarnPointsPage"),
  "/points-rules": () => import("@/pages/PointsRulesPage"),
  "/points-ledger": () => import("@/pages/PointsLedgerPage"),
  "/pdv": () => import("@/pages/OperatorRedeemPage"),

  // Affiliate / catálogo
  "/affiliate-deals": () => import("@/pages/AffiliateDealsPage"),
  "/affiliate-categories": () => import("@/pages/AffiliateCategoriesPage"),
  "/product-redemption-orders": () => import("@/pages/ProductRedemptionOrdersPage"),
  "/produtos-resgate": () => import("@/pages/ProdutosResgatePage"),

  // Brand / branch
  "/brand-branches": () => import("@/pages/BrandBranchesPage"),
  "/brand-settings": () => import("@/pages/BrandSettingsPage"),
  "/brand-modules": () => import("@/pages/BrandModulesPage"),

  // Audit / users
  "/users": () => import("@/pages/UsersPage"),
  "/audit": () => import("@/pages/AuditLogsPage"),

  // Notificações
  "/send-notification": () => import("@/pages/SendNotificationPage"),
};

// Dedupe: cada rota só é importada UMA vez por sessão. Browser cacheia
// o módulo no SystemJS internal, mas evitar chamar `import()` 2x já corta
// overhead de promise + revalidation.
const PREFETCHED = new Set<string>();

// Debounce: agenda o prefetch só DEPOIS de o mouse ficar 150ms parado
// sobre o link. Mouse só passando rapidamente não dispara. Cancelado se
// outro hover/blur acontecer antes.
let pendingTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPath: string | null = null;

function shouldSkipPrefetch(): boolean {
  // Não prefetch em conexão lenta ou data saver ativo. A nav vai baixar
  // o chunk no clique mesmo (suspense fallback aparece) — preferível a
  // hammers de hover.
  const nav = (navigator as any).connection;
  if (!nav) return false;
  if (nav.saveData) return true;
  if (nav.effectiveType === "slow-2g" || nav.effectiveType === "2g") return true;
  return false;
}

/**
 * Agenda prefetch da rota com debounce (150ms). Mouse só passando
 * rapidamente sobre links NÃO dispara — só com intent de pousar.
 * Idempotente — cada rota baixa no máximo 1x por sessão.
 */
export function prefetchRoute(path: string): void {
  const fn = ROUTE_PREFETCH[path];
  if (!fn) return;
  if (PREFETCHED.has(path)) return;
  if (shouldSkipPrefetch()) return;

  // Se outro path estava agendado, cancela
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }
  pendingPath = path;
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    if (pendingPath !== path) return; // outro hover sobrescreveu
    pendingPath = null;
    PREFETCHED.add(path);
    fn().catch(() => {
      // Falha silenciosa mas remove do dedupe pra permitir retry no clique
      PREFETCHED.delete(path);
    });
  }, 150);
}

/** Cancela prefetch pendente quando mouse sai antes do timeout. */
export function cancelPrefetch(): void {
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
    pendingPath = null;
  }
}
