import { supabase } from "@/integrations/supabase/client";
import type {
  LeadComercialRow,
  StatusLead,
} from "@/features/agendar_demonstracao/types/tipos_lead";
import type { NotaLeadRow } from "../types/tipos_nota_lead";

export async function buscarLeadPorId(leadId: string): Promise<LeadComercialRow | null> {
  const { data, error } = await supabase
    .from("commercial_leads")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();
  if (error) throw error;
  return (data as LeadComercialRow | null) ?? null;
}

export async function atualizarStatusLead(
  leadId: string,
  novoStatus: StatusLead
): Promise<void> {
  const agora = new Date().toISOString();
  const updates: Record<string, unknown> = { status: novoStatus };
  if (novoStatus === "contatado") updates.contacted_at = agora;
  if (novoStatus === "qualificado") updates.qualified_at = agora;
  if (novoStatus === "convertido") updates.converted_at = agora;

  const { error } = await supabase
    .from("commercial_leads")
    .update(updates)
    .eq("id", leadId);
  if (error) throw error;
}

export interface AtualizacaoCamposLead {
  full_name?: string;
  work_email?: string;
  phone?: string;
  company_name?: string;
  company_role?: string | null;
  company_size?: string | null;
  city?: string | null;
  current_solution?: string | null;
  interest_message?: string | null;
  preferred_contact?: string | null;
  preferred_window?: string | null;
  product_name?: string | null;
  product_slug?: string | null;
  source?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
}

export async function atualizarCamposLead(
  leadId: string,
  campos: AtualizacaoCamposLead
): Promise<void> {
  const { error } = await supabase
    .from("commercial_leads")
    .update(campos)
    .eq("id", leadId);
  if (error) throw error;
}

export async function listarNotasLead(leadId: string): Promise<NotaLeadRow[]> {
  const { data, error } = await supabase
    .from("commercial_lead_notes")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as NotaLeadRow[];
}

export async function criarNotaLead(params: {
  leadId: string;
  conteudo: string;
  authorName?: string | null;
}): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.from("commercial_lead_notes").insert({
    lead_id: params.leadId,
    content: params.conteudo,
    note_type: "manual",
    author_user_id: userData.user?.id ?? null,
    author_name: params.authorName ?? userData.user?.email ?? null,
  });
  if (error) throw error;
}