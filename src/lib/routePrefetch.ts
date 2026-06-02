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

/**
 * Dispara prefetch da rota se mapeada. Idempotente — promises cacheadas
 * pelo browser (mesmo URL pendente vira o mesmo fetch).
 */
export function prefetchRoute(path: string): void {
  const fn = ROUTE_PREFETCH[path];
  if (!fn) return;
  // Silencioso: falha de prefetch nunca é mostrada (não bloqueia navegação)
  fn().catch(() => { /* noop */ });
}
