import { useState } from "react";
import { cn } from "@/lib/utils";
import { Ticket } from "lucide-react";

interface PlatformLogoProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackLabel?: string;
  loading?: "lazy" | "eager";
}

/**
 * Resilient logo component with graceful fallback.
 * Tries image src → falls back to styled badge with initials.
 */
export default function PlatformLogo({
  src = "/logo-vale-resgate.jpeg",
  alt = "Vale Resgate",
  className = "h-9 w-9",
  fallbackLabel = "VR",
  loading,
}: PlatformLogoProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm shrink-0",
          className,
        )}
        aria-label={alt}
      >
        {fallbackLabel || <Ticket className="h-1/2 w-1/2" />}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn("object-contain shrink-0", className)}
      loading={loading}
      onError={() => setFailed(true)}
    />
  );
}
