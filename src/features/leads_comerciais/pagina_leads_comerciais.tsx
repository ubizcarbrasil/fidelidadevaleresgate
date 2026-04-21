import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import BlocoKpisLeads from "./components/bloco_kpis_leads";
import BlocoFiltrosLeads from "./components/bloco_filtros_leads";
import BlocoTabelaLeads from "./components/bloco_tabela_leads";
import { useLeadsComerciais } from "./hooks/hook_leads_comerciais";
import { calcularKpis } from "./utils/utilitarios_kpis";
import type { FiltrosLeadsComerciais } from "./services/servico_leads_comerciais";

export default function PaginaLeadsComerciais() {
  const [filtros, setFiltros] = useState<FiltrosLeadsComerciais>({});
  const { data: leads = [], isLoading } = useLeadsComerciais(filtros);

  const kpis = useMemo(() => calcularKpis(leads), [leads]);

  const produtosDisponiveis = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const lead of leads) {
      if (lead.product_slug) {
        mapa.set(lead.product_slug, lead.product_name ?? lead.product_slug);
      }
    }
    return Array.from(mapa.entries()).map(([slug, nome]) => ({ slug, nome }));
  }, [leads]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads Comerciais"
        description="Pipeline B2B de solicitações de demonstração capturadas nas landing pages dos produtos."
      />

      <BlocoKpisLeads kpis={kpis} />

      <BlocoFiltrosLeads
        filtros={filtros}
        onChange={setFiltros}
        produtosDisponiveis={produtosDisponiveis}
      />

      <BlocoTabelaLeads leads={leads} isLoading={isLoading} />
    </div>
  );
}
