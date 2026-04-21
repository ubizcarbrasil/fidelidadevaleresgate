import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TemporadaCampeonato } from "../types/tipos_campeonato";

interface Props {
  temporadas: TemporadaCampeonato[];
  valor: string | null;
  aoMudar: (id: string) => void;
}

export default function SeletorTemporada({ temporadas, valor, aoMudar }: Props) {
  return (
    <Select value={valor ?? undefined} onValueChange={aoMudar}>
      <SelectTrigger className="w-full md:w-[260px]">
        <SelectValue placeholder="Selecione uma temporada" />
      </SelectTrigger>
      <SelectContent>
        {temporadas.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}