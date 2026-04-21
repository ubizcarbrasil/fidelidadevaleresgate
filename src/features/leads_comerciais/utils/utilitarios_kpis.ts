import type { LeadComercialRow } from "@/features/agendar_demonstracao/types/tipos_lead";

export interface KpisLeads {
  totalNoMes: number;
  totalGeral: number;
  convertidos: number;
  taxaConversao: number;
  novos: number;
  porProduto: Array<{ produto: string; total: number }>;
}

export function calcularKpis(leads: LeadComercialRow[]): KpisLeads {
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

  const totalNoMes = leads.filter((l) => new Date(l.created_at) >= inicioMes).length;
  const totalGeral = leads.length;
  const convertidos = leads.filter((l) => l.status === "convertido").length;
  const novos = leads.filter((l) => l.status === "novo").length;
  const taxaConversao = totalGeral > 0 ? (convertidos / totalGeral) * 100 : 0;

  const mapaProduto = new Map<string, number>();
  for (const lead of leads) {
    const nome = lead.product_name || lead.product_slug || "Sem produto";
    mapaProduto.set(nome, (mapaProduto.get(nome) ?? 0) + 1);
  }
  const porProduto = Array.from(mapaProduto.entries())
    .map(([produto, total]) => ({ produto, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return { totalNoMes, totalGeral, convertidos, taxaConversao, novos, porProduto };
}
