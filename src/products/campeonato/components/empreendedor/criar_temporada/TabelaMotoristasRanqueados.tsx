import { useMemo, useState } from "react";
import { Search, Loader2, Trophy } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  useMotoristasRanqueados,
  type MotoristaRanqueado,
} from "../../../hooks/hook_motoristas_ranqueados";

interface Props {
  branchId: string;
  sinceDays?: number;
  selecionados: Set<string>;
  serieDe: Map<string, string>; // customer_id → tier name
  aoAlternar: (id: string) => void;
  aoSelecionarTodos: (ids: string[]) => void;
  aoLimparSelecao: () => void;
  somenteLeitura?: boolean;
}

export default function TabelaMotoristasRanqueados({
  branchId,
  sinceDays = 30,
  selecionados,
  serieDe,
  aoAlternar,
  aoSelecionarTodos,
  aoLimparSelecao,
  somenteLeitura = false,
}: Props) {
  const { data, isLoading } = useMotoristasRanqueados(branchId, sinceDays);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "selecionados">("todos");

  const motoristas = data ?? [];

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return motoristas.filter((m) => {
      if (filtro === "selecionados" && !selecionados.has(m.customer_id))
        return false;
      if (!termo) return true;
      return (
        (m.driver_name ?? "").toLowerCase().includes(termo) ||
        (m.phone ?? "").toLowerCase().includes(termo)
      );
    });
  }, [motoristas, busca, filtro, selecionados]);

  const todosVisiveisSelecionados =
    filtrados.length > 0 &&
    filtrados.every((m) => selecionados.has(m.customer_id));

  return (
    <div className="flex h-full flex-col rounded-lg border bg-card">
      <div className="space-y-2 border-b p-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Trophy className="h-4 w-4 text-primary" />
            Motoristas ranqueados
          </h3>
          <Badge variant="outline" className="text-[10px]">
            {selecionados.size}/{motoristas.length} selecionados
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou telefone…"
            className="h-9 pl-7 text-xs"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={filtro === "todos" ? "default" : "outline"}
            className="h-7 px-2 text-xs"
            onClick={() => setFiltro("todos")}
          >
            Todos ({motoristas.length})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={filtro === "selecionados" ? "default" : "outline"}
            className="h-7 px-2 text-xs"
            onClick={() => setFiltro("selecionados")}
          >
            Selecionados ({selecionados.size})
          </Button>
          <div className="ml-auto flex items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() =>
                aoSelecionarTodos(filtrados.map((m) => m.customer_id))
              }
              disabled={filtrados.length === 0 || somenteLeitura}
            >
              Marcar visíveis
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
              onClick={aoLimparSelecao}
              disabled={selecionados.size === 0 || somenteLeitura}
            >
              Limpar
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center p-8 text-xs text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando
            motoristas…
          </div>
        ) : filtrados.length === 0 ? (
          <p className="p-6 text-center text-xs text-muted-foreground">
            Nenhum motorista encontrado nesta cidade.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={todosVisiveisSelecionados}
                    disabled={somenteLeitura}
                    onCheckedChange={(v) => {
                      if (somenteLeitura) return;
                      if (v) aoSelecionarTodos(filtrados.map((m) => m.customer_id));
                      else aoLimparSelecao();
                    }}
                    aria-label="Selecionar todos visíveis"
                  />
                </TableHead>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Motorista</TableHead>
                <TableHead className="text-right">Corridas</TableHead>
                <TableHead className="text-right">Pontos</TableHead>
                <TableHead className="w-24 text-center">Série</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((m: MotoristaRanqueado) => {
                const sel = selecionados.has(m.customer_id);
                const serie = serieDe.get(m.customer_id);
                return (
                  <TableRow
                    key={m.customer_id}
                    className={cn(
                      somenteLeitura ? "cursor-default" : "cursor-pointer",
                      sel && "bg-primary/5",
                    )}
                    onClick={() => {
                      if (somenteLeitura) return;
                      aoAlternar(m.customer_id);
                    }}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={sel}
                        disabled={somenteLeitura}
                        onCheckedChange={() => aoAlternar(m.customer_id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                      {m.rank_position}
                    </TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {m.driver_name ?? "Sem nome"}
                        </p>
                        {m.phone && (
                          <p className="truncate text-[10px] text-muted-foreground">
                            {m.phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {m.rides_count}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {m.points_balance.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-center">
                      {serie ? (
                        <Badge className="h-5 px-1.5 text-[10px]">
                          {serie}
                        </Badge>
                      ) : sel ? (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                          —
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">
                          fora
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </ScrollArea>
    </div>
  );
}