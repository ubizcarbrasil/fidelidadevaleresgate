import {
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VelocidadeReproducao } from "../hooks/hook_reproducao";
import { formatarDataHoraEvento } from "../utils/utilitarios_log_eventos";

interface Props {
  total: number;
  indice: number;
  tocando: boolean;
  velocidade: VelocidadeReproducao;
  timestamp: string | null;
  aoTocar: () => void;
  aoPausar: () => void;
  aoInicio: () => void;
  aoFim: () => void;
  aoPassoAtras: () => void;
  aoPassoFrente: () => void;
  aoMudarIndice: (n: number) => void;
  aoMudarVelocidade: (v: VelocidadeReproducao) => void;
}

const VELOCIDADES: VelocidadeReproducao[] = [0.5, 1, 2, 4];

export default function ControlesReproducao({
  total,
  indice,
  tocando,
  velocidade,
  timestamp,
  aoTocar,
  aoPausar,
  aoInicio,
  aoFim,
  aoPassoAtras,
  aoPassoFrente,
  aoMudarIndice,
  aoMudarVelocidade,
}: Props) {
  const desabilitado = total === 0;
  // O slider opera no intervalo [0..total], onde 0 = estado inicial (indice -1)
  // e total = todos os eventos aplicados (indice = total-1).
  const valorSlider = indice + 1;
  const eventosAplicados = Math.max(0, indice + 1);

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={aoInicio}
            disabled={desabilitado || indice <= -1}
            aria-label="Voltar ao início"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={aoPassoAtras}
            disabled={desabilitado || indice <= -1}
            aria-label="Evento anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {tocando ? (
            <Button
              size="icon"
              className="h-9 w-9"
              onClick={aoPausar}
              disabled={desabilitado}
              aria-label="Pausar"
            >
              <Pause className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              className="h-9 w-9"
              onClick={aoTocar}
              disabled={desabilitado}
              aria-label="Reproduzir"
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={aoPassoFrente}
            disabled={desabilitado || indice >= total - 1}
            aria-label="Próximo evento"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={aoFim}
            disabled={desabilitado || indice >= total - 1}
            aria-label="Ir para o fim"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
          <Select
            value={String(velocidade)}
            onValueChange={(v) => aoMudarVelocidade(Number(v) as VelocidadeReproducao)}
          >
            <SelectTrigger className="h-8 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VELOCIDADES.map((v) => (
                <SelectItem key={v} value={String(v)}>
                  {v}x
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Slider
          value={[valorSlider]}
          min={0}
          max={Math.max(0, total)}
          step={1}
          disabled={desabilitado}
          onValueChange={(vals) => aoMudarIndice(vals[0] - 1)}
        />
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
            {eventosAplicados}/{total} eventos
          </Badge>
          <span className="tabular-nums">
            {timestamp ? formatarDataHoraEvento(timestamp) : "Estado inicial (sem corridas)"}
          </span>
        </div>
      </div>
    </div>
  );
}