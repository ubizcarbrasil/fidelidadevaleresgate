import React from "react";
import { ArrowDown, Loader2 } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  threshold?: number;
  children: React.ReactNode;
  className?: string;
}

export function PullToRefresh({
  onRefresh,
  threshold = 80,
  children,
  className,
}: PullToRefreshProps) {
  const { containerRef, pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh,
    threshold,
  });

  const reachedThreshold = pullDistance >= threshold;
  const indicatorOpacity = Math.min(pullDistance / (threshold * 0.6), 1);

  return (
    <div ref={containerRef} className={className} style={{ overflowY: "auto", position: "relative" }}>
      {/* Indicador visual */}
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: pullDistance > 0 || isRefreshing ? `${Math.max(pullDistance, isRefreshing ? 48 : 0)}px` : "0px" }}
      >
        <div
          className="flex items-center justify-center"
          style={{ opacity: indicatorOpacity }}
        >
          {isRefreshing ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <ArrowDown
              className="h-5 w-5 text-muted-foreground transition-transform duration-200"
              style={{
                transform: reachedThreshold ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
