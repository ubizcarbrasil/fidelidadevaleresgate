import { useRef, useState, useCallback, useEffect } from "react";

interface UsePullToRefreshOptions {
  /** Função async chamada ao soltar após atingir o threshold */
  onRefresh: () => Promise<void>;
  /** Distância mínima em px para acionar o refresh (padrão 80) */
  threshold?: number;
}

interface UsePullToRefreshReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  isPulling: boolean;
  pullDistance: number;
  isRefreshing: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const containerRef = useRef<HTMLDivElement>(null!);
  const startYRef = useRef(0);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Só ativa se o scroll estiver no topo
    const el = containerRef.current;
    if (!el || isRefreshing) return;

    const scrollTop = el.scrollTop ?? 0;
    if (scrollTop > 0) return;

    startYRef.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    const diff = e.touches[0].clientY - startYRef.current;
    if (diff < 0) {
      setPullDistance(0);
      return;
    }
    // Aplica resistência (diminui à medida que puxa mais)
    const dampened = Math.min(diff * 0.5, threshold * 1.8);
    setPullDistance(dampened);
  }, [isPulling, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold * 0.6); // mantém indicador visível durante refresh
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd);

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { containerRef, isPulling, pullDistance, isRefreshing };
}
