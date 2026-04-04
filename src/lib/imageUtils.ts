/**
 * Otimiza URLs de imagens do Supabase Storage usando query params de transformação.
 * Para URLs não-Supabase, retorna a URL original sem modificação.
 */
export function getOptimizedImageUrl(
  url: string,
  options: { width?: number; height?: number; quality?: number } = {}
): string {
  if (!url || !url.includes("supabase")) return url;
  const { width = 400, quality = 75 } = options;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}width=${width}&quality=${quality}`;
}

/** Presets reutilizáveis para contextos comuns */
export const IMAGE_PRESETS = {
  card: { width: 400, quality: 75 },
  banner: { width: 800, quality: 85 },
  thumbnail: { width: 100, quality: 80 },
  detail: { width: 800, quality: 85 },
} as const;
