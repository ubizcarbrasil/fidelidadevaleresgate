import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";
import { useBrandCampeonatoKPIs } from "../../../hooks/hook_kpis_campeonato";
import { useRankingsDisponiveis } from "../../../hooks/hook_rankings_disponiveis";
import SecaoStatusTemporada from "./SecaoStatusTemporada";
import SecaoKpisCampeonato from "./SecaoKpisCampeonato";
import SecaoCtaAdaptativo from "./SecaoCtaAdaptativo";
import SecaoRankings from "./SecaoRankings";

interface Props {
  brandId: string;
  /** Callback executado quando o admin clica no CTA adaptativo. */
  onAcaoCta?: () => void;
}

/**
 * Dashboard de Operação do Campeonato (MVP — Sprint Dashboard).
 * 3 seções verticais: Status, KPIs (2x2) e CTA adaptativo.
 * Rankings detalhados (Seção 3) ficam fora deste MVP.
 */
export default function DashboardOperacaoCampeonato({ brandId, onAcaoCta }: Props) {
  const { data, isLoading } = useBrandCampeonatoKPIs(brandId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-[156px] w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[88px] rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[80px] w-full rounded-lg" />
      </div>
    );
  }

  if (!data?.has_active_season || !data.season) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
          <Trophy className="h-7 w-7 text-muted-foreground" />
          <p className="text-sm font-medium">Sem temporada ativa</p>
          <p className="text-xs text-muted-foreground">
            Crie uma temporada para ver o painel operacional do campeonato.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { season, kpis } = data;
  const { disponivel: rankingsDisponiveis } = useRankingsDisponiveis(kpis);

  return (
    <div className="space-y-3">
      <SecaoStatusTemporada
        seasonName={season.name}
        phase={season.phase}
        classificationStartsAt={season.classification_starts_at}
        classificationEndsAt={season.classification_ends_at}
        knockoutStartsAt={season.knockout_starts_at}
        knockoutEndsAt={season.knockout_ends_at}
      />
      <SecaoKpisCampeonato kpis={kpis} isLoading={false} />
      {rankingsDisponiveis && <SecaoRankings kpis={kpis} />}
      <SecaoCtaAdaptativo
        phase={season.phase}
        kpis={kpis}
        knockoutStartsAt={season.knockout_starts_at}
        knockoutEndsAt={season.knockout_ends_at}
        onAcaoPrincipal={onAcaoCta}
      />
    </div>
  );
}