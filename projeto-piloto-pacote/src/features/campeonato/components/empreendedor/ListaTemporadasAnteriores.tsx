import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { History, XCircle } from "lucide-react";
import { useTemporadasMarca } from "../../hooks/hook_campeonato_empreendedor";
import { useCancelarTemporada } from "../../hooks/hook_mutations_campeonato";
import {
  CORES_FASE,
  ROTULOS_FASE,
} from "../../constants/constantes_campeonato";
import { formatarData } from "../../utils/utilitarios_campeonato";
import type { StatusFiltroSeason } from "../../types/tipos_empreendedor";

interface Props {
  brandId: string;
  /** Quando passado, filtra histórico pra mostrar APENAS temporadas desta cidade.
      Sem ele (admin root), mostra todas as cidades da marca. */
  branchId?: string | null;
}

// Fases em que ainda é possível cancelar a temporada (antes de finished/cancelled).
const FASES_CANCELAVEIS = new Set([
  "draft",
  "classification",
  "knockout_r16",
  "knockout_qf",
  "knockout_sf",
  "knockout_final",
]);

export default function ListaTemporadasAnteriores({ brandId, branchId }: Props) {
  const [filtro, setFiltro] = useState<StatusFiltroSeason>("all");
  const { data, isLoading } = useTemporadasMarca(brandId, filtro, branchId);
  const cancelarMutation = useCancelarTemporada(brandId);

  // Modal de confirmação pra cancelamento (incluindo temporadas zumbi).
  const [cancelTarget, setCancelTarget] = useState<{
    id: string;
    name: string;
    phase: string;
  } | null>(null);

  const ids = useMemo(() => (data ?? []).map((s) => s.id), [data]);
  const { data: publicadoMap } = useQuery({
    queryKey: ["duelo-seasons-published-map", brandId, ids.join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("campeonato_seasons")
        .select("id, published_at")
        .in("id", ids);
      if (error) throw error;
      const map: Record<string, string | null> = {};
      (rows ?? []).forEach((r: any) => {
        map[r.id] = r.published_at;
      });
      return map;
    },
  });

  function confirmarCancelar() {
    if (!cancelTarget) return;
    cancelarMutation.mutate(
      {
        seasonId: cancelTarget.id,
        reason: `Cancelada via histórico: ${cancelTarget.name}`,
      },
      {
        onSuccess: () => setCancelTarget(null),
      },
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" /> Histórico de temporadas
            </CardTitle>
          </div>
          {branchId && (
            <p className="text-[11px] text-muted-foreground">
              Mostrando apenas temporadas desta cidade.
            </p>
          )}
          <Tabs value={filtro} onValueChange={(v) => setFiltro(v as StatusFiltroSeason)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="text-xs">Todas</TabsTrigger>
              <TabsTrigger value="active" className="text-xs">Ativas</TabsTrigger>
              <TabsTrigger value="finished" className="text-xs">Finalizadas</TabsTrigger>
              <TabsTrigger value="cancelled" className="text-xs">Canceladas</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !data || data.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma temporada encontrada.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.map((s) => {
                const fase = (s.phase ?? "classification") as keyof typeof ROTULOS_FASE;
                const corClass = CORES_FASE[fase] ?? "bg-muted text-muted-foreground";
                const podeCancel = FASES_CANCELAVEIS.has(String(s.phase ?? ""));
                return (
                  <li
                    key={s.id}
                    className="flex flex-col gap-2 rounded-md border border-border bg-muted/20 p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.branch_name ?? "—"} ·{" "}
                        {formatarData(s.classification_starts_at)} →{" "}
                        {formatarData(s.knockout_ends_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`text-xs ${corClass}`} variant="outline">
                        {ROTULOS_FASE[fase] ?? fase}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {s.tiers_count} série{s.tiers_count === 1 ? "" : "s"}
                      </Badge>
                      {publicadoMap?.[s.id] ? (
                        <Badge
                          variant="outline"
                          className="text-xs bg-emerald-500/10 text-emerald-700 border-emerald-500/40 dark:text-emerald-300"
                        >
                          Publicada
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs bg-muted text-muted-foreground"
                        >
                          Não publicada
                        </Badge>
                      )}
                      {/* Botão de cancelar pra temporadas em fase ativa
                          (incluindo zumbis que não aparecem no dashboard).
                          Resolve o caso onde o usuário não conseguia cancelar
                          temporadas órfãs criadas via wizard mas nunca distribuídas. */}
                      {podeCancel && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() =>
                            setCancelTarget({
                              id: s.id,
                              name: s.name,
                              phase: String(s.phase ?? ""),
                            })
                          }
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar temporada?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a cancelar a temporada <strong>"{cancelTarget?.name}"</strong>.
              Esta ação não pode ser desfeita. A temporada será marcada como cancelada
              e liberará o mês/ano pra criar uma nova.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelarMutation.isPending}>
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmarCancelar();
              }}
              disabled={cancelarMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelarMutation.isPending ? "Cancelando..." : "Sim, cancelar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
