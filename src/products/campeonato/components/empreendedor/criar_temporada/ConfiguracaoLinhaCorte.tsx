import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Props {
  diasPeriodo: number;
  minimoCorridas: number;
  totalElegiveis: number;
  totalNecessario: number;
  aoMudarDias: (d: number) => void;
  aoMudarMinimo: (n: number) => void;
}

const PRESETS_DIAS = [7, 15, 30, 60, 90];

export default function ConfiguracaoLinhaCorte({
  diasPeriodo,
  minimoCorridas,
  totalElegiveis,
  totalNecessario,
  aoMudarDias,
  aoMudarMinimo,
}: Props) {
  const insuficiente = totalElegiveis < totalNecessario;

  return (
    <div className="space-y-3 rounded-md border border-primary/20 bg-primary/5 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-medium">
          <Filter className="h-3.5 w-3.5 text-primary" />
          Linha de corte por atividade
        </p>
        <Badge
          variant={insuficiente ? "destructive" : "secondary"}
          className="text-[10px]"
        >
          {totalElegiveis} elegíveis / {totalNecessario} vagas
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="corte-dias" className="text-[11px]">
            Período (dias)
          </Label>
          <Input
            id="corte-dias"
            type="number"
            min={1}
            max={365}
            className="h-9"
            value={diasPeriodo}
            onChange={(e) =>
              aoMudarDias(
                Math.max(1, Math.min(365, Math.floor(Number(e.target.value) || 1))),
              )
            }
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="corte-min" className="text-[11px]">
            Mínimo de corridas
          </Label>
          <Input
            id="corte-min"
            type="number"
            min={0}
            max={10000}
            className="h-9"
            value={minimoCorridas}
            onChange={(e) =>
              aoMudarMinimo(
                Math.max(0, Math.min(10000, Math.floor(Number(e.target.value) || 0))),
              )
            }
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS_DIAS.map((d) => (
          <Button
            key={d}
            type="button"
            size="sm"
            variant={diasPeriodo === d ? "default" : "outline"}
            className="h-7 px-2 text-[11px]"
            onClick={() => aoMudarDias(d)}
          >
            {d}d
          </Button>
        ))}
      </div>

      {insuficiente && (
        <p className="text-[11px] text-destructive">
          Critério retorna menos motoristas do que o total de vagas. Reduza o
          mínimo ou aumente o período.
        </p>
      )}
    </div>
  );
}