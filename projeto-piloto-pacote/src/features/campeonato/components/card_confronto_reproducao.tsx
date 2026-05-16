import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { SnapshotConfronto } from "../types/tipos_reproducao";

interface Props {
  snapshot: SnapshotConfronto;
  destacado?: boolean;
  ladoAfetado?: "A" | "B" | null;
}

export default function CardConfrontoReproducao({
  snapshot,
  destacado,
  ladoAfetado,
}: Props) {
  const total = snapshot.driver_a_rides + snapshot.driver_b_rides;
  const pctA = total === 0 ? 50 : Math.round((snapshot.driver_a_rides / total) * 100);
  const pctB = 100 - pctA;
  const neutro = total === 0;

  return (
    <div
      className={`rounded-md border bg-card p-3 text-xs transition-all ${
        destacado ? "border-primary shadow-md ring-1 ring-primary/40" : "border-border"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Slot {snapshot.slot}
        </span>
        <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
          {snapshot.driver_a_rides + snapshot.driver_b_rides} corridas
        </Badge>
      </div>

      <div
        className={`flex items-center justify-between rounded px-2 py-1 transition-colors ${
          ladoAfetado === "A" ? "bg-primary/15 ring-1 ring-primary/40" : ""
        }`}
      >
        <span className="truncate">
          {snapshot.driver_a_name ?? (snapshot.driver_a_id ? "—" : "A definir")}
        </span>
        <span
          className={`tabular-nums ${
            ladoAfetado === "A" ? "font-semibold text-primary" : "text-muted-foreground"
          }`}
        >
          {snapshot.driver_a_rides}
        </span>
      </div>

      <div className="my-1.5">
        <Progress value={neutro ? 50 : pctA} className="h-1" />
      </div>

      <div
        className={`flex items-center justify-between rounded px-2 py-1 transition-colors ${
          ladoAfetado === "B" ? "bg-primary/15 ring-1 ring-primary/40" : ""
        }`}
      >
        <span className="truncate">
          {snapshot.driver_b_name ?? (snapshot.driver_b_id ? "—" : "A definir")}
        </span>
        <span
          className={`tabular-nums ${
            ladoAfetado === "B" ? "font-semibold text-primary" : "text-muted-foreground"
          }`}
        >
          {snapshot.driver_b_rides}
        </span>
      </div>

      {!neutro && (
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>{pctA}%</span>
          <span>{pctB}%</span>
        </div>
      )}
    </div>
  );
}