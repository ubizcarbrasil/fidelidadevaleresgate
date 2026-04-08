/**
 * Feed de atividades de duelos da cidade para o painel admin.
 */
import { Swords } from "lucide-react";
import { useDuelosCidade } from "@/components/driver/duels/hook_duelos_publicos";
import FeedAtividadeCidade from "@/components/driver/duels/FeedAtividadeCidade";
import type { Duel } from "@/components/driver/duels/hook_duelos";

interface Props {
  branchId: string;
}

export default function BranchFeedDuelos({ branchId }: Props) {
  const { data: duelos = [] } = useDuelosCidade(branchId);

  // Últimos 20 eventos ordenados por data
  const feedDuelos = duelos.slice(0, 20);

  if (feedDuelos.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
        <Swords className="h-3.5 w-3.5" style={{ color: "hsl(var(--primary))" }} />
        Feed de Atividades
      </h3>
      <FeedAtividadeCidade duelos={feedDuelos} />
    </div>
  );
}
