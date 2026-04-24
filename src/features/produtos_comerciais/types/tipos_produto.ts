/**
 * Tipos de Produtos Comerciais (Bundles vendáveis).
 * Sub-fase 6.3 — estende `subscription_plans` para virar fábrica de produtos.
 */

export interface LandingScreenshot {
  url: string;
  caption?: string;
}

export interface LandingTestimonial {
  name: string;
  role?: string;
  quote: string;
  avatar_url?: string;
}

export interface LandingFaqItem {
  question: string;
  answer: string;
}

export interface LandingBenefitObject {
  title: string;
  description?: string;
  icon?: string;
}

export type LandingBenefit = string | LandingBenefitObject;

export interface LandingMetric {
  value: string;
  label: string;
}

/**
 * Sub-fase 6.6 — Layout customizado do sidebar do produto.
 * Permite ao Root reordenar grupos e itens, e remover itens
 * (que dispara desativação do módulo correspondente).
 */
export interface SidebarLayoutGrupo {
  label: string;
  itens_keys: string[];
}
export interface SidebarLayoutOverride {
  grupos: SidebarLayoutGrupo[];
}

export interface LandingConfig {
  headline?: string;
  subheadline?: string;
  benefits?: LandingBenefit[];
  primary_color?: string;
  hero_image_url?: string;
  cta_label?: string;
  // Sub-fase 6.5 — landing rica
  screenshots?: LandingScreenshot[];
  testimonials?: LandingTestimonial[];
  faq?: LandingFaqItem[];
  comparison_highlights?: string[];
  // Landing 2.0 — venda
  eyebrow?: string;
  metrics?: LandingMetric[];
  problems?: string[];
  solutions?: string[];
  // Sub-fase 6.6 — sidebar customizado por produto
  sidebar_layout?: SidebarLayoutOverride;
}

export interface ProdutoComercial {
  id: string;
  plan_key: string;
  label: string;
  product_name: string;
  slug: string;
  price_cents: number;
  price_yearly_cents: number | null;
  features: string[];
  excluded_features: string[];
  is_popular: boolean;
  is_active: boolean;
  is_public_listed: boolean;
  trial_days: number;
  sort_order: number;
  landing_config_json: LandingConfig;
}

export interface ProdutoComercialDraft {
  id?: string;
  plan_key: string;
  label: string;
  product_name: string;
  slug: string;
  price_cents: number;
  price_yearly_cents: number | null;
  trial_days: number;
  is_popular: boolean;
  is_active: boolean;
  is_public_listed: boolean;
  sort_order: number;
  features: string[];
  excluded_features: string[];
  landing_config_json: LandingConfig;
  // Relacionamentos sincronizados na gravação
  business_model_ids: string[];
  module_definition_ids: string[];
}

export const EMPTY_DRAFT: ProdutoComercialDraft = {
  plan_key: "",
  label: "",
  product_name: "",
  slug: "",
  price_cents: 0,
  price_yearly_cents: null,
  trial_days: 30,
  is_popular: false,
  is_active: true,
  is_public_listed: false,
  sort_order: 100,
  features: [],
  excluded_features: [],
  landing_config_json: {
    headline: "",
    subheadline: "",
    benefits: [],
    primary_color: "#6366f1",
    hero_image_url: "",
    cta_label: "Começar trial 30 dias grátis",
    screenshots: [],
    testimonials: [],
    faq: [],
    comparison_highlights: [],
  },
  business_model_ids: [],
  module_definition_ids: [],
};
