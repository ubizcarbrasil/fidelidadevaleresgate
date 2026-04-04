import React, { useState, type ReactNode, type CSSProperties } from "react";
import { getOptimizedImageUrl, IMAGE_PRESETS } from "@/lib/imageUtils";

type ImagePreset = keyof typeof IMAGE_PRESETS;

interface SafeImageProps {
  src: string | null | undefined;
  fallbackSrc?: string | null;
  alt: string;
  className?: string;
  style?: CSSProperties;
  fallback: ReactNode;
  loading?: "lazy" | "eager";
  /** Preset de otimização — aplica width/quality automaticamente para URLs Supabase */
  preset?: ImagePreset;
  /** Opções manuais de otimização (sobrescreve preset) */
  optimize?: { width?: number; height?: number; quality?: number };
}

function resolveUrl(
  url: string | null | undefined,
  preset?: ImagePreset,
  optimize?: SafeImageProps["optimize"]
): string | null | undefined {
  if (!url) return url;
  const opts = optimize ?? (preset ? IMAGE_PRESETS[preset] : IMAGE_PRESETS.card);
  return getOptimizedImageUrl(url, opts);
}

/**
 * Image component with graceful fallback chain and Supabase image optimization.
 * Tries `src` → `fallbackSrc` → `fallback` ReactNode.
 */
const SafeImage = React.memo(function SafeImage({
  src,
  fallbackSrc,
  alt,
  className,
  style,
  fallback,
  loading = "lazy",
  preset,
  optimize,
}: SafeImageProps) {
  const [srcFailed, setSrcFailed] = useState(false);
  const [fallbackSrcFailed, setFallbackSrcFailed] = useState(false);

  const optimizedSrc = resolveUrl(src, preset, optimize);
  const optimizedFallbackSrc = resolveUrl(fallbackSrc, preset, optimize);

  if (!src || (srcFailed && (!fallbackSrc || fallbackSrcFailed))) {
    return <>{fallback}</>;
  }

  if (srcFailed && fallbackSrc && !fallbackSrcFailed) {
    return (
      <img
        src={optimizedFallbackSrc!}
        alt={alt}
        className={className}
        style={style}
        loading={loading}
        decoding="async"
        onError={() => setFallbackSrcFailed(true)}
      />
    );
  }

  return (
    <img
      src={optimizedSrc!}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      decoding="async"
      onError={() => setSrcFailed(true)}
    />
  );
});

export default SafeImage;
