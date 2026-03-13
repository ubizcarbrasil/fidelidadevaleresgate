export interface PageElementStyle {
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  borderRadius?: string;
  padding?: string;
  margin?: string;
  textAlign?: string;
  boxShadow?: string;
  width?: string;
  height?: string;
  opacity?: string;
}

export interface PageElementAction {
  type: "external_link" | "internal_route" | "webview" | "none";
  url?: string;
  route?: string;
}

export interface PageElement {
  id: string;
  type: "button" | "icon" | "banner" | "text" | "divider" | "spacer";
  content: string;
  style: PageElementStyle;
  action: PageElementAction;
  imageUrl?: string;
  iconName?: string;
  badgeText?: string;
}

export const DEFAULT_ELEMENT: Omit<PageElement, "id"> = {
  type: "text",
  content: "Texto de exemplo",
  style: {
    fontSize: "16px",
    fontWeight: "normal",
    color: "#000000",
    backgroundColor: "transparent",
    borderRadius: "8px",
    padding: "12px",
    textAlign: "left",
  },
  action: { type: "none" },
};

export const ELEMENT_TYPE_LABELS: Record<PageElement["type"], string> = {
  button: "Botão",
  icon: "Ícone",
  banner: "Banner",
  text: "Texto",
  divider: "Divisor",
  spacer: "Espaçador",
};

// V2 section row type
export interface SectionRow {
  id: string;
  brand_id: string;
  page_id: string | null;
  title: string | null;
  subtitle: string | null;
  cta_text: string | null;
  template_id: string;
  order_index: number;
  is_enabled: boolean;
  display_mode: string;
  filter_mode: string;
  columns_count: number;
  rows_count: number;
  min_stores_visible: number;
  max_stores_visible: number | null;
  icon_size: string;
  banner_height: string;
  coupon_type_filter: string | null;
  city_filter_json: any[];
  visual_json: any;
  section_templates?: { key: string; name: string; type: string };
}

// Unified block for the combined editor
export type UnifiedBlock =
  | { blockType: "static"; id: string; orderIndex: number; element: PageElement }
  | { blockType: "dynamic"; id: string; orderIndex: number; section: SectionRow };

export const SECTION_TYPES = [
  { value: "OFFERS_CAROUSEL", label: "Carrossel de Ofertas" },
  { value: "OFFERS_GRID", label: "Grade de Ofertas" },
  { value: "STORES_GRID", label: "Grade de Parceiros" },
  { value: "STORES_LIST", label: "Lista de Parceiros" },
  { value: "BANNER_CAROUSEL", label: "Carrossel de Banners" },
  { value: "VOUCHERS_CARDS", label: "Cupons em Cartão" },
  { value: "MANUAL_LINKS_CAROUSEL", label: "Carrossel de Links Manuais" },
  { value: "MANUAL_LINKS_GRID", label: "Grade de Links Manuais" },
  { value: "LIST_INFO", label: "Lista com Informações" },
  { value: "GRID_INFO", label: "Grade com Informações" },
  { value: "GRID_LOGOS", label: "Grade de Logos/Atalhos" },
  { value: "HIGHLIGHTS_WEEKLY", label: "Destaques da Semana" },
];
