/**
 * Feedback háptico para dispositivos móveis.
 * Usa optional chaining — seguro em dispositivos sem suporte.
 */
export const haptics = {
  /** Toque leve — confirmações, seleções, toque em cards */
  light: () => navigator.vibrate?.(50),

  /** Toque médio — ações importantes */
  medium: () => navigator.vibrate?.(100),

  /** Toque forte — erros, alertas, ações destrutivas */
  heavy: () => navigator.vibrate?.([100, 50, 100]),

  /** Celebração — resgate com sucesso */
  success: () => navigator.vibrate?.([50, 30, 80, 30, 120]),

  /** Erro */
  error: () => navigator.vibrate?.([200, 100, 200]),
};

/**
 * Atalho legado — mantido para compatibilidade com chamadas existentes.
 */
export function haptic(style: "light" | "medium" | "heavy" = "light") {
  if (style === "heavy") haptics.heavy();
  else if (style === "medium") haptics.medium();
  else haptics.light();
}
