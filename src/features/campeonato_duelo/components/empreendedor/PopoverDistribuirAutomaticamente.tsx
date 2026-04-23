import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, Loader2 } from "lucide-react";
import type { EstrategiaDistribuicaoAutomatica } from "../../types/tipos_empreendedor";

interface Props {
  totalDisponiveis: number;
  totalSeries: number;
  desabilitado?: boolean;
  pendente?: boolean;
  aoConfirmar: (estrategia: EstrategiaDistribuicaoAutomatica) => void;
}

const OPCOES: Array<{
  valor: EstrategiaDistribuicaoAutomatica;
  titulo: string;
  descricao: string;
}> = [
  {
    valor: "equilibrado",
    titulo: "Equilibrado",
    descricao: "Divide igualmente entre todas as séries",
  },
  {
    valor: "alfabetico",
    titulo: "Alfabético",
    descricao: "Série A primeiro até lotar, depois B, C…",
  },
  {
    valor: "aleatorio",
    titulo: "Aleatório",
    descricao: "Embaralha e distribui equilibrado",
  },
];

export default function PopoverDistribuirAutomaticamente({
  totalDisponiveis,
  totalSeries,
  desabilitado,
  pendente,
  aoConfirmar,
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [estrategia, setEstrategia] =
    useState<EstrategiaDistribuicaoAutomatica>("equilibrado");

  const semDados = totalDisponiveis === 0 || totalSeries === 0;

  function confirmar() {
    aoConfirmar(estrategia);
    setAberto(false);
  }

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="default"
          className="h-8 w-full text-xs"
          disabled={desabilitado || semDados}
        >
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          Distribuir automaticamente
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold">Distribuir automaticamente</p>
            <p className="text-xs text-muted-foreground">
              {totalDisponiveis} motorista{totalDisponiveis > 1 ? "s" : ""}{" "}
              disponíveis em {totalSeries} série{totalSeries > 1 ? "s" : ""}
            </p>
          </div>

          <RadioGroup
            value={estrategia}
            onValueChange={(v) =>
              setEstrategia(v as EstrategiaDistribuicaoAutomatica)
            }
            className="gap-2"
          >
            {OPCOES.map((op) => (
              <label
                key={op.valor}
                htmlFor={`auto-${op.valor}`}
                className="flex cursor-pointer items-start gap-2 rounded-md border bg-card p-2 hover:bg-accent"
              >
                <RadioGroupItem
                  id={`auto-${op.valor}`}
                  value={op.valor}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <Label
                    htmlFor={`auto-${op.valor}`}
                    className="cursor-pointer text-xs font-medium"
                  >
                    {op.titulo}
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    {op.descricao}
                  </p>
                </div>
              </label>
            ))}
          </RadioGroup>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 h-8 text-xs"
              onClick={() => setAberto(false)}
              disabled={pendente}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={confirmar}
              disabled={pendente}
            >
              {pendente ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Distribuir"
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}