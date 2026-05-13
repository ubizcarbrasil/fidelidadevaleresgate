import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import type { KpisCampeonato } from "../../../types/tipos_dashboard_kpis";

interface Props {
  kpis: KpisCampeonato;
}

/**
 * Seção 3 — Rankings (placeholder de reativação automática).
 *
 * Renderiza apenas quando `useRankingsDisponiveis` libera (Séries A e B com dados).
 * Conteúdo definitivo (top motoristas por série, badges de promoção/rebaixamento)
 * será implementado em sprint futuro. Por ora, exibe um cartão neutro confirmando
 * que o gate abriu — assim a transição A/B vazias → A/B com dados é visível.
 */
export default function SecaoRankings({ kpis }: Props) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <Trophy className="h-5 w-5 shrink-0 text-primary" />
        <div className="space-y-1">
          <p className="text-sm font-semibold">Rankings disponíveis</p>
          <p className="text-xs text-muted-foreground">
            Série A: {kpis.by_tier.A} motoristas · Série B: {kpis.by_tier.B} motoristas.
            Em breve, o ranking detalhado será exibido aqui.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
