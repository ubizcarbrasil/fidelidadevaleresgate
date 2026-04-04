import { Skeleton } from "@/components/ui/skeleton";

export function StoreOfferCardSkeleton() {
  return (
    <div className="flex gap-3 p-3 rounded-2xl bg-card" style={{ boxShadow: "0 1px 4px hsl(var(--foreground) / 0.04)" }}>
      <Skeleton className="h-20 w-20 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
        <div className="flex justify-between">
          <Skeleton className="h-5 w-16 rounded" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}
