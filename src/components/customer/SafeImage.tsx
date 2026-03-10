import { useState, type ReactNode, type CSSProperties } from "react";

interface SafeImageProps {
  src: string | null | undefined;
  fallbackSrc?: string | null;
  alt: string;
  className?: string;
  style?: CSSProperties;
  fallback: ReactNode;
  loading?: "lazy" | "eager";
}

/**
 * Image component with graceful fallback chain.
 * Tries `src` → `fallbackSrc` → `fallback` ReactNode.
 */
export default function SafeImage({
  src,
  fallbackSrc,
  alt,
  className,
  style,
  fallback,
  loading,
}: SafeImageProps) {
  const [srcFailed, setSrcFailed] = useState(false);
  const [fallbackSrcFailed, setFallbackSrcFailed] = useState(false);

  // No src at all → render fallback
  if (!src || (srcFailed && (!fallbackSrc || fallbackSrcFailed))) {
    return <>{fallback}</>;
  }

  // Primary src failed, try fallbackSrc
  if (srcFailed && fallbackSrc && !fallbackSrcFailed) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
        style={style}
        loading={loading}
        onError={() => setFallbackSrcFailed(true)}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      onError={() => setSrcFailed(true)}
    />
  );
}
