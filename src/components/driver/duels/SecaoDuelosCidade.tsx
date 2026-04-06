import { useState } from "react";
import { Swords } from "lucide-react";
import { useDuelosCidade } from "./hook_duelos_publicos";
import CardDueloPublico from "./CardDueloPublico";
import ArenaAoVivo from "./ArenaAoVivo";
import type { Duel } from "./hook_duelos";

interface Props {
  branchId: string | undefined;
  fontHeading?: string;
  onVerTodos?: () => void;
}

export default function SecaoDuelosCidade({ branchId, fontHeading, onVerTodos }: Props) {
  const { data: duelos, isLoading } = useDuelosCidade(branchId);
  const [arenaDuel, setArenaDuel] = useState<Duel | null>(null);

  if (isLoading || !duelos || duelos.length === 0) return null;

  if (arenaDuel) {
    // Find latest version from query data
    const updated = duelos.find((d) => d.id === arenaDuel.id) || arenaDuel;
    return <ArenaAoVivo duel={updated} onBack={() => setArenaDuel(null)} />;
  }

  return (
    <section className="px-5 pt-5">
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-sm font-bold text-foreground flex items-center gap-1.5"
          style={fontHeading ? { fontFamily: fontHeading } : undefined}
        >
          <Swords className="w-4 h-4 text-green-500" />
          Duelos rolando na cidade
        </h2>
        {onVerTodos && (
          <button
            onClick={onVerTodos}
            className="text-[11px] text-primary font-medium"
          >
            Ver todos
          </button>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
        {duelos.map((d) => (
          <CardDueloPublico key={d.id} duelo={d} onOpenArena={setArenaDuel} />
        ))}
      </div>
    </section>
  );
}
