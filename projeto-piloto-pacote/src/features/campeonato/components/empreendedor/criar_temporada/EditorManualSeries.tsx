import { useMemo } from "react";
import {
  UserRound,
  X,
  ArrowRightLeft,
  Plus,
  UserPlus,
  ChevronUp,
  ChevronDown,
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowDownAZ,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { MotoristaRanqueado } from "../../../hooks/hook_motoristas_ranqueados";

interface SerieEntrada {
  name: string;
  size: number;
}

interface Props {
  series: SerieEntrada[];
  distribuicao: Record<string, string[]>;
  selecionados: Set<string>;
  motoristas: MotoristaRanqueado[];
  aoMover: (driverId: string, de: string | null, para: string | null) => void;
  aoReordenar: (
    serie: string,
    driverId: string,
    acao: "subir" | "descer" | "topo" | "fundo",
  ) => void;
  aoOrdenarPorRanking: (serie: string) => void;
}

function corCapacidade(atual: number, max: number): string {
  if (atual === 0) return "text-muted-foreground";
  if (atual > max) return "text-destructive";
  if (atual === max) return "text-amber-500";
  return "text-emerald-500";
}

export default function EditorManualSeries({
  series,
  distribuicao,
  selecionados,
  motoristas,
  aoMover,
  aoReordenar,
  aoOrdenarPorRanking,
}: Props) {
  const indiceMotoristas = useMemo(() => {
    const m = new Map<string, MotoristaRanqueado>();
    for (const x of motoristas) m.set(x.customer_id, x);
    return m;
  }, [motoristas]);

  const idsAlocados = useMemo(() => {
    const s = new Set<string>();
    for (const arr of Object.values(distribuicao))
      for (const id of arr) s.add(id);
    return s;
  }, [distribuicao]);

  const naoAlocados = useMemo(
    () =>
      motoristas
        .filter(
          (m) => selecionados.has(m.customer_id) && !idsAlocados.has(m.customer_id),
        )
        .sort((a, b) => a.rank_position - b.rank_position),
    [motoristas, selecionados, idsAlocados],
  );

  if (series.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4 text-center text-xs text-muted-foreground">
        Defina ao menos uma série para ajustar manualmente.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Edição manual por série</h3>
        <p className="text-[10px] text-muted-foreground">
          Ajuste cada série e veja o impacto no painel.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {series.map((s) => {
          const ids = distribuicao[s.name] ?? [];
          // Preserva a ordem manual da distribuição.
          const linhas = ids
            .map((id) => indiceMotoristas.get(id))
            .filter((x): x is MotoristaRanqueado => !!x);
          const destinos = series.filter((o) => o.name !== s.name);

          return (
            <div
              key={s.name}
              className="flex h-64 flex-col rounded-lg border bg-card"
            >
              <div className="flex items-center justify-between gap-1 border-b px-2 py-1.5">
                <span className="text-xs font-semibold">Série {s.name}</span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    title="Ordenar por ranking (corridas)"
                    onClick={() => aoOrdenarPorRanking(s.name)}
                    disabled={linhas.length < 2}
                  >
                    <ArrowDownAZ className="h-3 w-3" />
                  </Button>
                  <span
                    className={cn(
                      "font-mono text-[11px] tabular-nums",
                      corCapacidade(linhas.length, s.size),
                    )}
                  >
                    {linhas.length}/{s.size}
                  </span>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="space-y-1 p-1.5">
                  {linhas.length === 0 ? (
                    <p className="p-3 text-center text-[11px] text-muted-foreground">
                      Vazia. Adicione abaixo.
                    </p>
                  ) : (
                    linhas.map((m, idx) => (
                      <div
                        key={m.customer_id}
                        className="group flex items-center gap-1.5 rounded border bg-background px-1.5 py-1 text-[11px]"
                      >
                        <span className="w-5 shrink-0 text-center font-mono text-[10px] font-semibold tabular-nums text-muted-foreground">
                          {idx + 1}
                        </span>
                        <UserRound className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">
                            {m.driver_name ?? "Sem nome"}
                          </p>
                          <p className="truncate text-[9px] text-muted-foreground">
                            rank #{m.rank_position} · {m.rides_count} corridas
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            title="Subir"
                            disabled={idx === 0}
                            onClick={() =>
                              aoReordenar(s.name, m.customer_id, "subir")
                            }
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            title="Descer"
                            disabled={idx === linhas.length - 1}
                            onClick={() =>
                              aoReordenar(s.name, m.customer_id, "descer")
                            }
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                        {destinos.length > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                aria-label="Mover"
                              >
                                <ArrowRightLeft className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuLabel className="text-[10px]">
                                Posição
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                disabled={idx === 0}
                                onClick={() =>
                                  aoReordenar(s.name, m.customer_id, "topo")
                                }
                              >
                                <ArrowUpToLine className="mr-1.5 h-3 w-3" />
                                Mover para o topo
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={idx === linhas.length - 1}
                                onClick={() =>
                                  aoReordenar(s.name, m.customer_id, "fundo")
                                }
                              >
                                <ArrowDownToLine className="mr-1.5 h-3 w-3" />
                                Mover para o fim
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className="text-[10px]">
                                Mover para…
                              </DropdownMenuLabel>
                              {destinos.map((d) => (
                                <DropdownMenuItem
                                  key={d.name}
                                  onClick={() =>
                                    aoMover(m.customer_id, s.name, d.name)
                                  }
                                >
                                  Série {d.name}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  aoMover(m.customer_id, s.name, null)
                                }
                                className="text-destructive focus:text-destructive"
                              >
                                <X className="mr-1.5 h-3 w-3" />
                                Remover da série
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {naoAlocados.length > 0 && (
                <div className="border-t p-1.5">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-full text-[11px]"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Adicionar ({naoAlocados.length})
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="max-h-64 w-56 overflow-auto">
                      <DropdownMenuLabel className="text-[10px]">
                        Selecionados sem série
                      </DropdownMenuLabel>
                      {naoAlocados.map((m) => (
                        <DropdownMenuItem
                          key={m.customer_id}
                          onClick={() => aoMover(m.customer_id, null, s.name)}
                        >
                          <UserPlus className="mr-1.5 h-3 w-3" />
                          <span className="truncate">
                            #{m.rank_position} {m.driver_name ?? "Sem nome"}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {naoAlocados.length > 0 && (
        <div className="rounded-md border border-dashed bg-muted/20 p-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Selecionados sem série ({naoAlocados.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {naoAlocados.map((m) => (
              <Badge
                key={m.customer_id}
                variant="outline"
                className="h-5 gap-1 px-1.5 text-[10px]"
              >
                #{m.rank_position} {m.driver_name ?? "Sem nome"}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}