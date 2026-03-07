/**
 * DataSkeleton — componente reutilizável para loading states consistentes.
 */
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DataSkeletonProps {
  /** Número de linhas skeleton */
  rows?: number;
  /** Tipo de skeleton: "table-row", "card", "stat" */
  variant?: "table-row" | "card" | "stat";
  className?: string;
}

export default function DataSkeleton({ rows = 5, variant = "table-row", className }: DataSkeletonProps) {
  if (variant === "stat") {
    return (
      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  // table-row
  return (
    <div className={cn("space-y-3 p-4", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
