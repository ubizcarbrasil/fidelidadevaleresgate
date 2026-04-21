import { supabase } from "@/integrations/supabase/client";
import type { LeadComercialRow, StatusLead } from "@/features/agendar_demonstracao/types/tipos_lead";

export interface FiltrosLeadsComerciais {
  busca?: string;
  productSlug?: string | null;
  status?: StatusLead | null;
  cidade?: string | null;
  faixaMotoristas?: string | null;
  periodoDe?: string | null;
  periodoAte?: string | null;
  empresa?: string | null;
  produtoTexto?: string | null;
  source?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

export async function listarLeadsComerciais(
  filtros: FiltrosLeadsComerciais
): Promise<LeadComercialRow[]> {
  let query = supabase
    .from("commercial_leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (filtros.productSlug) {
    query = query.eq("product_slug", filtros.productSlug);
  }
  if (filtros.status) {
    query = query.eq("status", filtros.status);
  }
  if (filtros.cidade) {
    query = query.ilike("city", `%${filtros.cidade}%`);
  }
  if (filtros.faixaMotoristas) {
    query = query.eq("company_size", filtros.faixaMotoristas);
  }
  if (filtros.periodoDe) {
    query = query.gte("created_at", filtros.periodoDe);
  }
  if (filtros.periodoAte) {
    query = query.lte("created_at", filtros.periodoAte);
  }
  if (filtros.empresa && filtros.empresa.trim().length >= 2) {
    query = query.ilike("company_name", `%${filtros.empresa.trim()}%`);
  }
  if (filtros.produtoTexto && filtros.produtoTexto.trim().length >= 2) {
    const termo = filtros.produtoTexto.trim();
    query = query.or(`product_name.ilike.%${termo}%,product_slug.ilike.%${termo}%`);
  }
  if (filtros.source && filtros.source.trim().length >= 1) {
    query = query.ilike("source", `%${filtros.source.trim()}%`);
  }
  if (filtros.utmSource && filtros.utmSource.trim().length >= 1) {
    query = query.ilike("utm_source", `%${filtros.utmSource.trim()}%`);
  }
  if (filtros.utmMedium && filtros.utmMedium.trim().length >= 1) {
    query = query.ilike("utm_medium", `%${filtros.utmMedium.trim()}%`);
  }
  if (filtros.utmCampaign && filtros.utmCampaign.trim().length >= 1) {
    query = query.ilike("utm_campaign", `%${filtros.utmCampaign.trim()}%`);
  }
  if (filtros.busca && filtros.busca.trim().length >= 2) {
    const termo = filtros.busca.trim();
    query = query.or(
      `full_name.ilike.%${termo}%,work_email.ilike.%${termo}%,company_name.ilike.%${termo}%,phone.ilike.%${termo}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as LeadComercialRow[];
}
