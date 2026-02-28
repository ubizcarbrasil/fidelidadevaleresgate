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
