import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowRight, X } from "lucide-react";
import { useState } from "react";

interface SerieAlvo {
  tier_id: string;
  tier_name: string;
}

interface Props {
  total: number;
  series: SerieAlvo[];
  desabilitado?: boolean;
  aoMover: (tierId: string) => void;
  aoLimpar: () => void;
}

export default function BarraAcoesEmLote({
  total,
  series,
  desabilitado,
  aoMover,
  aoLimpar,
}: Props) {
  const [destino, setDestino] = useState("");

  if (total === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-primary/5 p-2 text-xs">
      <span className="font-medium">
        {total} selecionado{total > 1 ? "s" : ""}
      </span>
      <Select value={destino} onValueChange={setDestino}>
        <SelectTrigger className="h-8 w-44 text-xs">
          <SelectValue placeholder="Mover para…" />
        </SelectTrigger>
        <SelectContent>
          {series.map((s) => (
            <SelectItem key={s.tier_id} value={s.tier_id}>
              Série {s.tier_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        className="h-8"
        disabled={!destino || desabilitado}
        onClick={() => destino && aoMover(destino)}
      >
        <ArrowRight className="mr-1 h-3.5 w-3.5" /> Mover
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8"
        onClick={aoLimpar}
      >
        <X className="mr-1 h-3.5 w-3.5" /> Limpar
      </Button>
    </div>
  );
}