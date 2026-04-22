import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMotoristasDisponiveis,
  useResumoTemporada,
} from "../../hooks/hook_campeonato_empreendedor";
import {
  useMoverMotorista,
  useRemoverMotorista,
} from "../../hooks/hook_distribuicao_manual";
import { obterDetalheSerie } from "../../services/servico_campeonato_empreendedor";
import ColunaMotoristasDisponiveis from "./ColunaMotoristasDisponiveis";
import ColunaSerie from "./ColunaSerie";
import BarraAcoesEmLote from "./BarraAcoesEmLote";
import ConfirmRemoverMotorista from "./ConfirmRemoverMotorista";

interface Props {
  open: boolean;
  onClose: () => void;
  brandId: string;
  seasonId: string;
  fase: string;
}

export default function DistribuicaoManualView({
  open,
  onClose,
  brandId,
  seasonId,
  fase,
}: Props) {
  const modoLeitura = fase !== "classification";

  const { data: resumo, isLoading: loadingResumo } = useResumoTemporada(
    open ? seasonId : null,
  );
  const { data: motoristas, isLoading: loadingMotoristas } =
    useMotoristasDisponiveis(brandId, open ? seasonId : null);

  const tiers = resumo?.tiers ?? [];

  // Capacidade configurada por tier (lida do resumo)
  const capacidadePorTier = useMemo(() => {
    const m = new Map<string, number | null>();
    tiers.forEach((t) => {
      // Resumo expõe members_count e qualified_count; tamanho configurado vem
      // de tiers_config_json. Usamos o maior valor entre members_count e
      // qualified_count*2 como aproximação caso não haja capacidade explícita.
      m.set(t.tier_id, null);
    });
    return m;
  }, [tiers]);

  // Buscar membros de cada série em paralelo
  const queriesSeries = useQueries({
    queries: tiers.map((t) => ({
      queryKey: ["empreendedor-series-detail", seasonId, t.tier_id],
      queryFn: () => obterDetalheSerie(seasonId, t.tier_id),
      enabled: open && !!seasonId && !!t.tier_id,
      staleTime: 30_000,
    })),
  });

  const seriesAlvo = useMemo(
    () => tiers.map((t) => ({ tier_id: t.tier_id, tier_name: t.tier_name })),
    [tiers],
  );

  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [confirmRemover, setConfirmRemover] = useState<{
    driverId: string;
    driverName: string | null;
  } | null>(null);

  const mover = useMoverMotorista(brandId);
  const remover = useRemoverMotorista(brandId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );

  function alternarSelecao(driverId: string) {
    setSelecionados((prev) => {
      const novo = new Set(prev);
      if (novo.has(driverId)) novo.delete(driverId);
      else novo.add(driverId);
      return novo;
    });
  }

  function limparSelecao() {
    setSelecionados(new Set());
  }

  function fecharERedefinir() {
    setSelecionados(new Set());
    setConfirmRemover(null);
    onClose();
  }

  function moverParaSerie(driverId: string, targetTierId: string) {
    if (modoLeitura) return;
    mover.mutate({ seasonId, driverId, targetTierId });
  }

  function moverEmLote(targetTierId: string) {
    if (modoLeitura || selecionados.size === 0) return;
    const ids = Array.from(selecionados);
    Promise.allSettled(
      ids.map((driverId) =>
        mover.mutateAsync({ seasonId, driverId, targetTierId }),
      ),
    ).then((res) => {
      const ok = res.filter((r) => r.status === "fulfilled").length;
      const fail = res.length - ok;
      if (ok > 0) toast.success(`${ok} motorista(s) movido(s)`);
      if (fail > 0) toast.error(`${fail} falha(s) ao mover`);
      limparSelecao();
    });
  }

  function aoArrastarTermino(e: DragEndEvent) {
    if (modoLeitura) return;
    const { active, over } = e;
    if (!over) return;
    const driverId = (active.data.current as any)?.driverId as string;
    const fromTierId = (active.data.current as any)?.fromTierId as
      | string
      | undefined;
    const targetTierId = (over.data.current as any)?.tierId as string;
    if (!driverId || !targetTierId) return;
    if (fromTierId === targetTierId) return;

    if (targetTierId === "available") {
      // Soltou na coluna disponíveis = remover da temporada
      if (!fromTierId || fromTierId === "available") return;
      // Procura o nome para o diálogo
      const idx = tiers.findIndex((t) => t.tier_id === fromTierId);
      const linha = idx >= 0
        ? queriesSeries[idx].data?.find((m) => m.driver_id === driverId)
        : undefined;
      setConfirmRemover({
        driverId,
        driverName: linha?.driver_name ?? null,
      });
      return;
    }

    moverParaSerie(driverId, targetTierId);
  }

  function confirmarRemocao() {
    if (!confirmRemover) return;
    remover.mutate(
      { seasonId, driverId: confirmRemover.driverId },
      {
        onSuccess: () => setConfirmRemover(null),
      },
    );
  }

  const carregando = loadingResumo || loadingMotoristas;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && fecharERedefinir()}>
        <DialogContent className="flex h-[92vh] max-w-[96vw] flex-col gap-3 p-4 sm:max-w-[96vw]">
          <DialogHeader className="space-y-1">
            <DialogTitle>Distribuir motoristas nas séries</DialogTitle>
            <DialogDescription className="text-xs">
              Arraste os motoristas entre as colunas, ou use o botão "Mover
              para…" em cada cartão. Você também pode marcar vários da coluna
              "Disponíveis" e mover em lote.
            </DialogDescription>
          </DialogHeader>

          {modoLeitura && (
            <div className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 p-2 text-xs text-warning-foreground">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              A distribuição manual só está disponível durante a fase de
              classificação. A temporada está em modo somente leitura.
            </div>
          )}

          {!modoLeitura && (
            <BarraAcoesEmLote
              total={selecionados.size}
              series={seriesAlvo}
              desabilitado={mover.isPending}
              aoMover={moverEmLote}
              aoLimpar={limparSelecao}
            />
          )}

          {carregando ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DndContext sensors={sensors} onDragEnd={aoArrastarTermino}>
              <div className="flex flex-1 gap-3 overflow-x-auto pb-2">
                <div className="w-[280px] shrink-0">
                  <ColunaMotoristasDisponiveis
                    motoristas={motoristas ?? []}
                    selecionados={selecionados}
                    aoAlternarSelecao={alternarSelecao}
                    aoLimparSelecao={limparSelecao}
                    modoLeitura={modoLeitura}
                  />
                </div>

                {tiers.map((t, idx) => {
                  const q = queriesSeries[idx];
                  return (
                    <div key={t.tier_id} className="w-[260px] shrink-0">
                      <ColunaSerie
                        tierId={t.tier_id}
                        tierName={t.tier_name}
                        capacidade={capacidadePorTier.get(t.tier_id) ?? null}
                        membros={q.data ?? []}
                        carregando={q.isLoading}
                        series={seriesAlvo}
                        modoLeitura={modoLeitura}
                        aoMoverPara={(driverId, targetTierId) =>
                          moverParaSerie(driverId, targetTierId)
                        }
                        aoRemover={(driverId, driverName) =>
                          setConfirmRemover({ driverId, driverName })
                        }
                      />
                    </div>
                  );
                })}

                {tiers.length === 0 && (
                  <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                    Esta temporada ainda não tem séries criadas.
                  </div>
                )}
              </div>
            </DndContext>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmRemoverMotorista
        open={!!confirmRemover}
        driverName={confirmRemover?.driverName ?? null}
        onCancel={() => setConfirmRemover(null)}
        onConfirm={confirmarRemocao}
        pendente={remover.isPending}
      />
    </>
  );
}