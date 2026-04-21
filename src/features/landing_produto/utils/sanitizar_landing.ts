/**
 * Sanitização defensiva no ponto de consumo da landing pública.
 *
 * Defesa em profundidade — o hook `useProdutoPorSlug` já normaliza, mas
 * garantimos novamente o shape antes de passar pra qualquer componente
 * filho. Itens fora do contrato são silenciosamente descartados, evitando
 * React error #31 (renderização de objeto cru como filho de JSX).
 */
import type {
  LandingBenefit,
  LandingFaqItem,
  LandingMetric,
  LandingScreenshot,
  LandingTestimonial,
} from "@/features/produtos_comerciais/types/tipos_produto";

function isStr(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/** Strings simples não-vazias. */
export function sanitizarStrings(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter(isStr);
}

/** Benefits: aceita string ou { title, description?, icon? }. */
export function sanitizarBenefits(input: unknown): LandingBenefit[] {
  if (!Array.isArray(input)) return [];
  const out: LandingBenefit[] = [];
  for (const item of input) {
    if (isStr(item)) {
      out.push(item);
      continue;
    }
    if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      if (isStr(o.title)) {
        const safe: { title: string; description?: string; icon?: string } = {
          title: o.title,
        };
        if (typeof o.description === "string") safe.description = o.description;
        if (typeof o.icon === "string") safe.icon = o.icon;
        out.push(safe);
      }
    }
  }
  return out;
}

/** Metrics: { value, label } ambos string não-vazia. */
export function sanitizarMetrics(input: unknown): LandingMetric[] {
  if (!Array.isArray(input)) return [];
  const out: LandingMetric[] = [];
  for (const item of input) {
    if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      if (isStr(o.value) && isStr(o.label)) {
        out.push({ value: o.value, label: o.label });
      }
    }
  }
  return out;
}

/** Testimonials: { name, quote } obrigatórios; role/avatar opcionais. */
export function sanitizarTestimonials(input: unknown): LandingTestimonial[] {
  if (!Array.isArray(input)) return [];
  const out: LandingTestimonial[] = [];
  for (const item of input) {
    if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      if (isStr(o.name) && isStr(o.quote)) {
        const safe: LandingTestimonial = { name: o.name, quote: o.quote };
        if (typeof o.role === "string") safe.role = o.role;
        if (typeof o.avatar_url === "string") safe.avatar_url = o.avatar_url;
        out.push(safe);
      }
    }
  }
  return out;
}

/** FAQ: { question, answer } ambos string não-vazia. */
export function sanitizarFaq(input: unknown): LandingFaqItem[] {
  if (!Array.isArray(input)) return [];
  const out: LandingFaqItem[] = [];
  for (const item of input) {
    if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      if (isStr(o.question) && isStr(o.answer)) {
        out.push({ question: o.question, answer: o.answer });
      }
    }
  }
  return out;
}

/** Screenshots: { url } obrigatório; caption opcional. */
export function sanitizarScreenshots(input: unknown): LandingScreenshot[] {
  if (!Array.isArray(input)) return [];
  const out: LandingScreenshot[] = [];
  for (const item of input) {
    if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      if (isStr(o.url)) {
        const safe: LandingScreenshot = { url: o.url };
        if (typeof o.caption === "string") safe.caption = o.caption;
        out.push(safe);
      }
    }
  }
  return out;
}