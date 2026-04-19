/**
 * SecaoPricingGanhaGanha — Sub-fase 5.4
 * Wrapper da sub-tab "Pricing" da aba Modelos de Negócio.
 * Composição:
 *  1) Cards de preço por ponto (1 por plano)
 *  2) Simulador financeiro
 *  3) Tabela de empreendedores com GG ativo
 */
import { Skeleton } from "@/components/ui/skeleton";
import { useGanhaGanhaPricing } from "@/compartilhados/hooks/hook_ganha_ganha_pricing";
import { PLANS, type PlanKey } from "../constants/constantes_planos";
import CardPricingPlano from "./card_pricing_plano";
import SimuladorFinanceiroGG from "./simulador_financeiro_gg";
import TabelaBrandsGanhaGanha from "./tabela_brands_ganha_ganha";

export default function SecaoPricingGanhaGanha() {
  const { data: pricing, isLoading } = useGanhaGanhaPricing();

  const byPlan = new Map((pricing ?? []).map((p) => [p.plan_key, p]));

  return (
    <div className="space-y-6">
      {/* Seção 1 — Preço por ponto */}
      <section>
        <header className="mb-3">
          <h3 className="text-sm font-semibold">Preço por ponto</h3>
          <p className="text-xs text-muted-foreground">
            Definido pelo Raiz por plano. Cada salvamento gera nova versão (histórico preservado).
          </p>
        </header>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-52 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PLANS.map((p) => (
              <CardPricingPlano
                key={p.key}
                planKey={p.key as PlanKey}
                current={byPlan.get(p.key)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Seção 2 — Simulador financeiro */}
      <section>
        <SimuladorFinanceiroGG pricing={pricing ?? []} />
      </section>

      {/* Seção 3 — Empreendedores com GG ativo */}
      <section>
        <TabelaBrandsGanhaGanha />
      </section>
    </div>
  );
}
