import {
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Gauge,
  Filter,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { VelocidadeReproducao } from "../hooks/hook_reproducao";
import { formatarDataHoraEvento } from "../utils/utilitarios_log_eventos";

export type TipoEventoReproducao = "ride_completed" | "ride_reverted";

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
  tiposSelecionados: TipoEventoReproducao[];
  aoMudarTipos: (tipos: TipoEventoReproducao[]) => void;
  totalGeral?: number;
}

const VELOCIDADES: VelocidadeReproducao[] = [0.5, 1, 2, 4];

const TIPOS_DISPONIVEIS: { valor: TipoEventoReproducao; rotulo: string; descricao: string }[] = [
  {
    valor: "ride_completed",
    rotulo: "Corridas finalizadas",
    descricao: "Eventos que somam pontos",
  },
  {
    valor: "ride_reverted",
    rotulo: "Corridas estornadas",
    descricao: "Eventos que removem pontos",
  },
];

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
  tiposSelecionados,
  aoMudarTipos,
  totalGeral,
}: Props) {
  const desabilitado = total === 0;
  // O slider opera no intervalo [0..total], onde 0 = estado inicial (indice -1)
  // e total = todos os eventos aplicados (indice = total-1).
  const valorSlider = indice + 1;
  const eventosAplicados = Math.max(0, indice + 1);
  const todosTipos = TIPOS_DISPONIVEIS.length;
  const tiposAtivos = tiposSelecionados.length;
  const filtroAtivo = tiposAtivos < todosTipos;

  const alternarTipo = (tipo: TipoEventoReproducao, marcado: boolean) => {
    if (marcado) {
      const novo = Array.from(new Set([...tiposSelecionados, tipo]));
      aoMudarTipos(novo);
      return;
    }
    // Mantemos pelo menos 1 tipo selecionado para evitar timeline vazia.
    const novo = tiposSelecionados.filter((t) => t !== tipo);
    if (novo.length === 0) return;
    aoMudarTipos(novo);
  };

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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                aria-label="Filtrar tipos de evento"
              >
                <Filter className="h-3.5 w-3.5" />
                Tipos
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {tiposAtivos}/{todosTipos}
                </Badge>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold">Eventos na timeline</p>
                <button
                  type="button"
                  onClick={() => aoMudarTipos(TIPOS_DISPONIVEIS.map((t) => t.valor))}
                  className="text-[10px] text-primary hover:underline disabled:opacity-50"
                  disabled={!filtroAtivo}
                >
                  Selecionar todos
                </button>
              </div>
              <div className="space-y-2">
                {TIPOS_DISPONIVEIS.map((tipo) => {
                  const marcado = tiposSelecionados.includes(tipo.valor);
                  const unico = marcado && tiposAtivos === 1;
                  return (
                    <label
                      key={tipo.valor}
                      htmlFor={`tipo-${tipo.valor}`}
                      className="flex cursor-pointer items-start gap-2 rounded-md p-1.5 hover:bg-muted/60"
                    >
                      <Checkbox
                        id={`tipo-${tipo.valor}`}
                        checked={marcado}
                        disabled={unico}
                        onCheckedChange={(v) => alternarTipo(tipo.valor, v === true)}
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={`tipo-${tipo.valor}`}
                          className="cursor-pointer text-xs font-medium"
                        >
                          {tipo.rotulo}
                        </Label>
                        <p className="text-[10px] text-muted-foreground">{tipo.descricao}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Pelo menos um tipo deve permanecer selecionado.
              </p>
            </PopoverContent>
          </Popover>

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
            {filtroAtivo && totalGeral != null && totalGeral !== total ? (
              <span className="ml-1 text-muted-foreground">(de {totalGeral})</span>
            ) : null}
          </Badge>
          <span className="tabular-nums">
            {timestamp ? formatarDataHoraEvento(timestamp) : "Estado inicial (sem corridas)"}
          </span>
        </div>
      </div>
    </div>
  );
}