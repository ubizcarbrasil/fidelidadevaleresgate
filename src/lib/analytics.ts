/**
 * analytics.ts — wrapper minimal pra PostHog (event tracking de produto).
 *
 * Princípios:
 * 1. Graceful degradation: se VITE_POSTHOG_KEY não estiver setado,
 *    todas as funções viram no-op. Não quebra dev sem env config.
 * 2. Lazy init: PostHog SDK só carrega no client (window check), evitando
 *    bundle SSR e bloqueando primeira render.
 * 3. Schema tipado: cada evento tem assinatura explícita pra evitar
 *    `track("redemption_started", { typo_field: ... })` indo silencioso.
 * 4. PII conservadora: por padrão NÃO mandamos email/CPF/nome pra
 *    PostHog. Só IDs internos e métricas. Override explícito se precisar.
 *
 * Eventos definidos (Fase 1 do roadmap de observability):
 * - page_view (auto via useTrackPageView hook)
 * - customer_signup
 * - earning_event_created
 * - redemption_started
 * - redemption_completed
 * - brand_module_toggled
 *
 * Adicionar evento novo: declarar em EventMap + atualizar `track()`.
 */

// Type opaco — posthog-js é dynamically imported via import().
// Type-only import faria tsc exigir o pacote estar instalado mesmo em
// envs onde a lib nem é usada (CI sem npm install). Mantemos shape
// minimal porque a API que usamos é `.init/.identify/.capture/.reset`.
type PostHogLike = {
  init: (key: string, opts: Record<string, unknown>) => void;
  identify: (id: string, props?: Record<string, unknown>) => void;
  reset: () => void;
  capture: (event: string, props?: Record<string, unknown>) => void;
};


// ── Schema de eventos ────────────────────────────────────────────────

export interface EventMap {
  /** Cliente novo cadastrado no sistema (1ª vez) */
  customer_signup: {
    brand_id: string;
    branch_id: string;
    source: "storefront" | "admin" | "csv_import" | "api";
  };

  /** Evento de ganho de pontos criado (compra registrada com sucesso) */
  earning_event_created: {
    brand_id: string;
    branch_id: string;
    customer_id: string;
    store_id: string;
    points_earned: number;
    purchase_value: number;
    source: "STORE" | "PDV" | "ADMIN" | "IMPORT" | "API";
  };

  /** Cliente iniciou fluxo de resgate (clicou em "Resgatar") */
  redemption_started: {
    brand_id: string;
    offer_id: string;
    customer_id: string;
    points_required: number;
  };

  /** Resgate concluído (OTP verificado, QR code gerado) */
  redemption_completed: {
    brand_id: string;
    offer_id: string;
    redemption_id: string;
    customer_id: string;
    duration_ms: number;
  };

  /** Brand admin habilitou/desabilitou um módulo */
  brand_module_toggled: {
    brand_id: string;
    module_key: string;
    enabled: boolean;
  };
}

export type EventName = keyof EventMap;

// ── Estado interno ───────────────────────────────────────────────────

let posthogInstance: PostHogLike | null = null;
let initPromise: Promise<PostHogLike | null> | null = null;

function getEnv(): { key: string | null; host: string } {
  const key = (import.meta.env.VITE_POSTHOG_KEY as string | undefined) ?? null;
  const host =
    (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ??
    "https://us.i.posthog.com";
  return { key, host };
}

/**
 * Inicializa PostHog uma vez. Lazy — só roda no client. Idempotente.
 * Não bloqueia: retorna Promise que resolve mesmo se PostHog não carregar.
 */
export function initAnalytics(): Promise<PostHogLike | null> {
  if (initPromise) return initPromise;
  if (typeof window === "undefined") return Promise.resolve(null);

  const { key, host } = getEnv();
  if (!key) {
    // Sem key, modo silencioso. Não inicializa.
    initPromise = Promise.resolve(null);
    return initPromise;
  }

  // Dynamic import só quando init é chamado. Carrega o SDK fora do
  // crítico do boot (~70KB). Runtime check em getEnv() garante que
  // só chama se a key existe.
  initPromise = import("posthog-js")
    .then((mod: { default: PostHogLike }) => {
      const ph = mod.default;
      ph.init(key, {
        api_host: host,
        // Captura page_view manualmente via useTrackPageView (SPA navega
        // sem reload, então autocapture nativo precisa do hook).
        capture_pageview: false,
        // Web vitals automático (já temos web-vitals lib).
        capture_pageleave: true,
        // Conservador com PII: sem masking automático de inputs (admin
        // page-internal). Não enviamos email/CPF nos eventos custom.
        autocapture: false,
        // Persistence: localStorage + cookie (suporta iOS PWA).
        persistence: "localStorage+cookie",
        // Em dev, loga no console pra debug local.
        loaded: () => {
          if (import.meta.env.DEV) {
            console.info("[analytics] PostHog ready");
          }
        },
      });
      posthogInstance = ph;
      return ph;
    })
    .catch((err) => {
      // Falha de load NÃO deve quebrar app.
      if (import.meta.env.DEV) {
        console.warn("[analytics] PostHog load failed:", err);
      }
      return null;
    });

  return initPromise;
}

/**
 * Identifica user (chamado após login admin OU resolução de customer).
 * `id` deve ser identificador estável (auth.users.id pra admin,
 * customers.id pra customer).
 */
export function identify(id: string, props?: Record<string, unknown>): void {
  if (!posthogInstance) {
    // Não inicializou ainda — agenda pra após init
    initAnalytics().then((ph) => {
      if (ph) ph.identify(id, props);
    });
    return;
  }
  posthogInstance.identify(id, props);
}

/** Reset de identidade (após logout). */
export function resetIdentity(): void {
  if (!posthogInstance) return;
  posthogInstance.reset();
}

/**
 * Track de evento. Type-safe via EventMap. Falha silenciosamente em
 * dev/prod se PostHog não inicializou.
 */
export function track<E extends EventName>(
  event: E,
  properties: EventMap[E],
): void {
  if (!posthogInstance) {
    // Agenda pra após init pra não perder eventos do boot
    initAnalytics().then((ph) => {
      if (ph) ph.capture(event, properties);
    });
    return;
  }
  posthogInstance.capture(event, properties);
}

/**
 * Track de page_view manual (chamado por useTrackPageView no
 * RouterContext). Mantém analytics fluindo em SPA sem reload.
 */
export function trackPageView(path: string): void {
  if (!posthogInstance) return;
  posthogInstance.capture("$pageview", { $current_url: path });
}
