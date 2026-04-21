/**
 * servico_trial_signup — Normalização do plano consumido pela rota pública /trial.
 *
 * Garante que qualquer payload vindo de `subscription_plans` (incluindo formatos
 * ricos usados pela landing comercial, como objetos em `landing_config_json.benefits`)
 * seja convertido para um shape primitivo seguro para renderização em JSX.
 *
 * Evita o React error #31 ("Objects are not valid as a React child") na rota /trial.
 */
import { supabase } from "@/integrations/supabase/client";

export interface PlanoTrialNormalizado {
  slug: string;
  product_name: string;
  trial_days: number;
  price_cents: number;
  price_yearly_cents: number | null;
}

function asTextoSeguro(input: unknown, fallback = ""): string {
  if (typeof input === "string") return input;
  if (typeof input === "number" || typeof input === "boolean") return String(input);
  return fallback;
}

function asNumeroSeguro(input: unknown, fallback: number): number {
  if (typeof input === "number" && Number.isFinite(input)) return input;
  if (typeof input === "string") {
    const n = Number(input);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function asNumeroOpcional(input: unknown): number | null {
  if (input === null || input === undefined || input === "") return null;
  const n = asNumeroSeguro(input, NaN);
  return Number.isFinite(n) ? n : null;
}

/**
 * Normaliza qualquer registro de subscription_plans para o shape mínimo
 * que a tela de trial precisa renderizar com segurança.
 */
export function normalizarPlanoTrial(row: unknown, slugFallback: string): PlanoTrialNormalizado | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;

  const slug = asTextoSeguro(r.slug, slugFallback);
  const product_name =
    asTextoSeguro(r.product_name) ||
    asTextoSeguro(r.label) ||
    asTextoSeguro(r.plan_key) ||
    "Plano";

  return {
    slug,
    product_name,
    trial_days: asNumeroSeguro(r.trial_days, 30),
    price_cents: asNumeroSeguro(r.price_cents, 0),
    price_yearly_cents: asNumeroOpcional(r.price_yearly_cents),
  };
}

/**
 * Busca o plano pelo slug e devolve já normalizado.
 * Retorna `null` se o plano não existir, estiver inativo ou der erro de rede.
 * Nunca lança — a rota /trial deve continuar abrindo mesmo sem plano.
 */
export async function buscarPlanoTrialPorSlug(
  slug: string,
): Promise<PlanoTrialNormalizado | null> {
  if (!slug) return null;
  try {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("slug, plan_key, product_name, label, trial_days, price_cents, price_yearly_cents")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error || !data) return null;
    return normalizarPlanoTrial(data, slug);
  } catch {
    return null;
  }
}