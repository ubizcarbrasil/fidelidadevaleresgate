/**
 * Utilitários para gerar links públicos dos produtos comerciais.
 * O domínio é fixo na produção (`app.valeresgate.com.br`) para evitar
 * que links copiados dentro do editor Lovable apontem para o preview.
 */

const PRODUCT_LANDING_ORIGIN = "https://app.valeresgate.com.br";

export interface OpcoesLinkProduto {
  cycle?: "monthly" | "yearly";
}

export function montarLinkLanding(slug: string, opts?: OpcoesLinkProduto): string {
  const params = opts?.cycle === "yearly" ? "?cycle=yearly" : "";
  return `${PRODUCT_LANDING_ORIGIN}/p/produto/${slug}${params}`;
}

export function montarLinkTrial(slug: string, opts?: OpcoesLinkProduto): string {
  const cycleParam = opts?.cycle ? `&cycle=${opts.cycle}` : "";
  return `${PRODUCT_LANDING_ORIGIN}/trial?plan=${slug}${cycleParam}`;
}

export const ORIGEM_LANDING_PRODUTOS = PRODUCT_LANDING_ORIGIN;