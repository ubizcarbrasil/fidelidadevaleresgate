import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trophy, Calendar, AlertTriangle, Loader2 } from "lucide-react";
import { useDashboardCampeonato } from "./hooks/hook_campeonato_empreendedor";
import { useFormatoEngajamento } from "./hooks/hook_formato_engajamento";
import { useDueloCampeonatoHabilitado } from "@/compartilhados/hooks/hook_duelo_campeonato_habilitado";
import { useExecutarSeedingTemporada } from "./hooks/hook_mutations_campeonato";
import { CORES_FASE, ROTULOS_FASE } from "./constants/constantes_campeonato";
import { formatarPeriodo } from "./utils/utilitarios_campeonato";
import SeletorFormatoEngajamento from "./components/empreendedor/SeletorFormatoEngajamento";
import FormCriarTemporada from "./components/empreendedor/FormCriarTemporada";
import CardResumoSerie from "./components/empreendedor/CardResumoSerie";
import AcoesTemporadaAtiva from "./components/empreendedor/AcoesTemporadaAtiva";
import BannerStatusTemporada from "./components/empreendedor/BannerStatusTemporada";
import ListaTemporadasAnteriores from "./components/empreendedor/ListaTemporadasAnteriores";
import DetalheSerieView from "./components/empreendedor/DetalheSerieView";
import CardPremiosADistribuir from "./components/empreendedor/CardPremiosADistribuir";
import CardAtivarCampeonato from "./components/empreendedor/CardAtivarCampeonato";

interface Props {
  brandId: string;
  branchId: string;
}

export default function PaginaCampeonatoEmpreendedor({ brandId, branchId }: Props) {
  const { campeonatoHabilitado, isLoading: loadingHabilitacao } =
    useDueloCampeonatoHabilitado(brandId);
  const { isCampeonato, isLoading: loadingFormato } = useFormatoEngajamento(brandId);
  const { data: dashboard, isLoading } = useDashboardCampeonato(brandId);
  const seedingMutation = useExecutarSeedingTemporada(brandId);
  const [modalCriar, setModalCriar] = useState(false);
  const [serieAberta, setSerieAberta] = useState<{
    tier_id: string;
    tier_name: string;
  } | null>(null);

  if (loadingHabilitacao || loadingFormato || isLoading) {
    return <Skeleton className="h-64 w-full rounded-lg" />;
  }

  // Camada 2 OFF: marca ainda não ativou o campeonato. Mostra só o card de ativação.
  if (!campeonatoHabilitado) {
    return (
      <div className="space-y-4 p-1">
        <CardAtivarCampeonato brandId={brandId} />
      </div>
    );
  }

  const ativa = dashboard?.active_season ?? null;
  const tiers = dashboard?.tiers ?? [];
  const tiersResumo = tiers.map((t) => ({
    tier_id: t.tier_id,
    tier_name: t.tier_name,
  }));

  return (
    <div className="space-y-4 p-1">
      <CardAtivarCampeonato brandId={brandId} />
      <SeletorFormatoEngajamento brandId={brandId} />

      {!isCampeonato ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Trophy className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              Formato atual diferente de Campeonato
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Selecione "Campeonato" no seletor acima para criar e gerenciar
              temporadas mensais com séries hierárquicas.
            </p>
          </CardContent>
        </Card>
      ) : !ativa ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h3 className="text-base font-semibold">Nenhuma temporada ativa</h3>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">
              Crie a primeira temporada do campeonato para iniciar a operação.
            </p>
            <Button onClick={() => setModalCriar(true)}>
              <Plus className="mr-2 h-4 w-4" /> Criar temporada
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold">{ativa.name}</h2>
                    <Badge
                      variant="outline"
                      className={`text-xs ${CORES_FASE[ativa.phase as keyof typeof CORES_FASE] ?? ""}`}
                    >
                      {ROTULOS_FASE[ativa.phase as keyof typeof ROTULOS_FASE] ?? ativa.phase}
                    </Badge>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Classificação:{" "}
                    {formatarPeriodo(
                      ativa.classification_starts_at,
                      ativa.classification_ends_at,
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Mata-mata:{" "}
                    {formatarPeriodo(
                      ativa.knockout_starts_at,
                      ativa.knockout_ends_at,
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <AcoesTemporadaAtiva
                    brandId={brandId}
                    seasonId={ativa.id}
                    seasonName={ativa.name}
                    pausada={!!ativa.paused_at}
                    fase={ativa.phase}
                    tiers={tiersResumo}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setModalCriar(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Nova
                  </Button>
                </div>
              </div>
              <BannerStatusTemporada
                brandId={brandId}
                seasonId={ativa.id}
                pausedAt={ativa.paused_at}
                cancelledAt={ativa.cancelled_at}
                cancellationReason={ativa.cancellation_reason}
                isFinished={ativa.phase === "finished"}
              />
            </CardContent>
          </Card>

          <CardPremiosADistribuir
            brandId={brandId}
            seasonId={ativa.id}
            seasonName={ativa.name}
            isFinished={ativa.phase === "finished"}
          />

          {tiers.length === 0 ? (
            <Card className="border-amber-300 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-700 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                      Temporada criada, mas os motoristas ainda não foram distribuídos
                    </p>
                    <p className="text-xs text-amber-800/90 dark:text-amber-200/80">
                      Clique em <strong>Distribuir motoristas agora</strong> para
                      criar as séries e alocar os motoristas elegíveis da cidade.
                      Sem este passo, o app do motorista mostra "nenhum
                      campeonato ativo".
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => seedingMutation.mutate(ativa.id)}
                    disabled={seedingMutation.isPending}
                  >
                    {seedingMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Distribuindo...
                      </>
                    ) : (
                      "Distribuir motoristas agora"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {tiers.map((s) => (
                <CardResumoSerie
                  key={s.tier_id}
                  serie={s}
                  aoVerDetalhes={() =>
                    setSerieAberta({
                      tier_id: s.tier_id,
                      tier_name: s.tier_name,
                    })
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      {isCampeonato && <ListaTemporadasAnteriores brandId={brandId} />}

      <FormCriarTemporada
        open={modalCriar}
        onClose={() => setModalCriar(false)}
        brandId={brandId}
        branchId={branchId}
      />

      <DetalheSerieView
        open={!!serieAberta}
        onClose={() => setSerieAberta(null)}
        seasonId={ativa?.id ?? ""}
        tierId={serieAberta?.tier_id ?? null}
        tierName={serieAberta?.tier_name ?? null}
      />
    </div>
  );
}
