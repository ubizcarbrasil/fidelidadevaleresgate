import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TemporadaCampeonato } from "../types/tipos_campeonato";

interface Props {
  temporadas: TemporadaCampeonato[];
  seasonId: string | null;
  outcome: "all" | "success" | "blocked";
  aoMudarTemporada: (id: string | null) => void;
  aoMudarOutcome: (v: "all" | "success" | "blocked") => void;
}

export default function FiltrosAuditoria({
  temporadas,
  seasonId,
  outcome,
  aoMudarTemporada,
  aoMudarOutcome,
}: Props) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center">
      <Select
        value={seasonId ?? "all"}
        onValueChange={(v) => aoMudarTemporada(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-full md:w-[220px]">
          <SelectValue placeholder="Todas as temporadas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as temporadas</SelectItem>
          {temporadas.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={outcome} onValueChange={(v) => aoMudarOutcome(v as any)}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os resultados</SelectItem>
          <SelectItem value="blocked">Apenas bloqueados</SelectItem>
          <SelectItem value="success">Apenas sucessos</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
