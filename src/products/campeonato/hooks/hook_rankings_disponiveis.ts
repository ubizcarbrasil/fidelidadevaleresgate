import type { KpisCampeonato } from "../types/tipos_dashboard_kpis";

/**
 * Gate de ativação automática da Seção 3 — Rankings.
 *
 * Regra: a seção só faz sentido quando há disputa real entre as séries de elite.
 * Enquanto os 75 motoristas estiverem todos na Série C (caso atual da Ubiz Resgata),
 * exibir rankings vazios A/B confunde o operador. O gate retorna `true` apenas
 * quando ambas as séries A e B contêm pelo menos 1 motorista.
 *
 * Hook puro (sem react-query) para permitir uso direto em renderização condicional
 * sem refetch extra — os KPIs já são carregados pelo dashboard.
 */
export function useRankingsDisponiveis(kpis: KpisCampeonato | undefined): {
  disponivel: boolean;
  motivo: "sem_kpis" | "series_elite_vazias" | "ok";
} {
  if (!kpis) {
    return { disponivel: false, motivo: "sem_kpis" };
  }

  const temSerieA = kpis.by_tier.A > 0;
  const temSerieB = kpis.by_tier.B > 0;

  if (!temSerieA || !temSerieB) {
    return { disponivel: false, motivo: "series_elite_vazias" };
  }

  return { disponivel: true, motivo: "ok" };
}
