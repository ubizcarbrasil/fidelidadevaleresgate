/**
 * Metadados das 8 categorias de módulos da plataforma.
 * Fonte única — usado por BrandModulesPage, Central de Módulos, etc.
 */
export interface MetaCategoriaModulo {
  label: string;
  emoji: string;
  description: string;
}

export const CATEGORY_META: Record<string, MetaCategoriaModulo> = {
  essencial:          { label: "Essencial",            emoji: "🔧", description: "Base da plataforma" },
  comercial:          { label: "Comercial",            emoji: "🏪", description: "Parceiros, ofertas e catálogo" },
  fidelidade_pontos:  { label: "Fidelidade & Pontos",  emoji: "⭐", description: "Programa de pontos e cashback" },
  engajamento:        { label: "Engajamento",          emoji: "📣", description: "CRM, gamificação e comunicação" },
  personalizacao:     { label: "Personalização",       emoji: "🎨", description: "Aparência, tema e identidade visual" },
  governanca:         { label: "Governança",           emoji: "🛡️", description: "Acessos, auditoria, plano e configs" },
  inteligencia_dados: { label: "Inteligência & Dados", emoji: "📊", description: "Relatórios, importação e análise" },
  integracoes:        { label: "Integrações & API",    emoji: "🔌", description: "APIs e sistemas externos" },
  general:            { label: "Geral",                emoji: "📦", description: "Outros módulos" },
};

export const ORDEM_CATEGORIAS: string[] = [
  "essencial",
  "comercial",
  "fidelidade_pontos",
  "engajamento",
  "personalizacao",
  "governanca",
  "inteligencia_dados",
  "integracoes",
  "general",
];
