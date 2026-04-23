import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckSquare, Search, Square, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import CardMotoristaArrastavel from "./CardMotoristaArrastavel";
import PopoverDistribuirAutomaticamente from "./PopoverDistribuirAutomaticamente";
import type { MotoristaDisponivel } from "../../types/tipos_empreendedor";
import type { EstrategiaDistribuicaoAutomatica } from "../../types/tipos_empreendedor";

interface Props {
  motoristas: MotoristaDisponivel[];
  selecionados: Set<string>;
  aoAlternarSelecao: (id: string) => void;
  aoLimparSelecao: () => void;
  aoSelecionarVarios?: (ids: string[]) => void;
  totalSeries?: number;
  pendenteDistribuicao?: boolean;
  aoDistribuirAutomaticamente?: (
    estrategia: EstrategiaDistribuicaoAutomatica,
  ) => void;
  modoLeitura?: boolean;
}

export interface ColunaMotoristasDisponiveisHandle {
  selecionarTodosVisiveis: () => void;
  totalVisiveis: () => number;
}

const ColunaMotoristasDisponiveis = forwardRef<
  ColunaMotoristasDisponiveisHandle,
  Props
>(function ColunaMotoristasDisponiveis({
  motoristas,
  selecionados,
  aoAlternarSelecao,
  aoLimparSelecao,
  aoSelecionarVarios,
  totalSeries = 0,
  pendenteDistribuicao,
  aoDistribuirAutomaticamente,
  modoLeitura,
}, ref) {
  const [busca, setBusca] = useState("");
  const { setNodeRef, isOver } = useDroppable({
    id: "available",
    data: { tierId: "available" },
  });

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return motoristas;
    return motoristas.filter(
      (m) =>
        (m.driver_name ?? "").toLowerCase().includes(t) ||
        (m.driver_phone ?? "").toLowerCase().includes(t),
    );
  }, [motoristas, busca]);

  function selecionarTodosVisiveis() {
    if (!aoSelecionarVarios) return;
    aoSelecionarVarios(filtrados.map((m) => m.driver_id));
  }

  useImperativeHandle(
    ref,
    () => ({
      selecionarTodosVisiveis,
      totalVisiveis: () => filtrados.length,
    }),
    [filtrados, aoSelecionarVarios],
  );

  const todosVisiveisSelecionados =
    filtrados.length > 0 &&
    filtrados.every((m) => selecionados.has(m.driver_id));

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full min-w-[260px] flex-col rounded-lg border bg-muted/30 transition",
        isOver && "border-primary bg-primary/5",
      )}
    >
      <div className="space-y-2 border-b p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Users className="h-4 w-4" />
            Disponíveis
            <span className="text-xs text-muted-foreground">
              ({motoristas.length})
            </span>
          </div>
          {selecionados.size > 0 && (
            <button
              type="button"
              onClick={aoLimparSelecao}
              className="text-[10px] uppercase tracking-wide text-muted-foreground hover:text-foreground"
            >
              Limpar ({selecionados.size})
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar nome ou telefone…"
            className="h-8 pl-7 text-xs"
          />
        </div>

        {!modoLeitura && filtrados.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (todosVisiveisSelecionados) aoLimparSelecao();
              else selecionarTodosVisiveis();
            }}
            className="flex w-full items-center gap-1.5 rounded-md border bg-card px-2 py-1.5 text-xs font-medium hover:bg-accent"
          >
            {todosVisiveisSelecionados ? (
              <>
                <Square className="h-3.5 w-3.5" />
                Desmarcar todos visíveis
              </>
            ) : (
              <>
                <CheckSquare className="h-3.5 w-3.5" />
                Selecionar todos visíveis ({filtrados.length})
              </>
            )}
          </button>
        )}

        {!modoLeitura && aoDistribuirAutomaticamente && (
          <PopoverDistribuirAutomaticamente
            totalDisponiveis={motoristas.length}
            totalSeries={totalSeries}
            pendente={pendenteDistribuicao}
            aoConfirmar={aoDistribuirAutomaticamente}
          />
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1.5 p-2">
          {filtrados.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">
              {busca
                ? "Nenhum motorista encontrado."
                : "Todos os motoristas já estão distribuídos."}
            </p>
          ) : (
            filtrados.map((m) => (
              <CardMotoristaArrastavel
                key={m.driver_id}
                driverId={m.driver_id}
                driverName={m.driver_name}
                driverPhone={m.driver_phone}
                origem="available"
                selecionavel
                selecionado={selecionados.has(m.driver_id)}
                aoAlternarSelecao={aoAlternarSelecao}
                series={[]}
                modoLeitura={modoLeitura}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
});

export default ColunaMotoristasDisponiveis;