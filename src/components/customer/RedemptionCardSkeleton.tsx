import { Skeleton } from "@/components/ui/skeleton";

export function RedemptionCardSkeleton() {
  return (
    <div className="rounded-2xl bg-card p-4 flex gap-3" style={{ boxShadow: "0 1px 4px hsl(var(--foreground) / 0.04)" }}>
      <Skeleton className="h-16 w-16 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-5 w-32 rounded mt-1" />
      </div>
    </div>
  );
}
