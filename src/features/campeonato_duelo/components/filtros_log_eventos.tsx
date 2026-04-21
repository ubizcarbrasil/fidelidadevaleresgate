import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ORDEM_RODADAS, ROTULOS_RODADA } from "../constants/constantes_campeonato";
import type { RodadaMataMata } from "../types/tipos_campeonato";

interface OpcaoMotorista {
  id: string;
  nome: string;
}

interface Props {
  rodada: RodadaMataMata | "todas";
  aoMudarRodada: (v: RodadaMataMata | "todas") => void;
  driverId: string | "todos";
  aoMudarDriver: (v: string) => void;
  motoristas: OpcaoMotorista[];
  dataInicio: string;
  aoMudarDataInicio: (v: string) => void;
  dataFim: string;
  aoMudarDataFim: (v: string) => void;
}

export default function FiltrosLogEventos({
  rodada,
  aoMudarRodada,
  driverId,
  aoMudarDriver,
  motoristas,
  dataInicio,
  aoMudarDataInicio,
  dataFim,
  aoMudarDataFim,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={rodada} onValueChange={(v) => aoMudarRodada(v as RodadaMataMata | "todas")}>
        <SelectTrigger className="h-8 w-40 text-xs">
          <SelectValue placeholder="Rodada" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as rodadas</SelectItem>
          {ORDEM_RODADAS.map((r) => (
            <SelectItem key={r} value={r}>
              {ROTULOS_RODADA[r]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={driverId} onValueChange={aoMudarDriver}>
        <SelectTrigger className="h-8 w-56 text-xs">
          <SelectValue placeholder="Motorista" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os motoristas</SelectItem>
          {motoristas.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1">
        <Label htmlFor="data-inicio" className="text-[10px] text-muted-foreground">
          De
        </Label>
        <Input
          id="data-inicio"
          type="datetime-local"
          value={dataInicio}
          onChange={(e) => aoMudarDataInicio(e.target.value)}
          className="h-8 w-44 text-xs"
        />
      </div>
      <div className="flex items-center gap-1">
        <Label htmlFor="data-fim" className="text-[10px] text-muted-foreground">
          Até
        </Label>
        <Input
          id="data-fim"
          type="datetime-local"
          value={dataFim}
          onChange={(e) => aoMudarDataFim(e.target.value)}
          className="h-8 w-44 text-xs"
        />
      </div>
    </div>
  );
}