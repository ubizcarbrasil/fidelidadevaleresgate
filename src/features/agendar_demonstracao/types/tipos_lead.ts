export type CanalContato = "whatsapp" | "email" | "ligacao";
export type JanelaContato = "manha" | "tarde" | "noite";
export type FaixaMotoristas = "1-50" | "50-200" | "200-500" | "500-1000" | "1000+";
export type SolucaoAtual = "nenhuma" | "app_proprio" | "terceiro" | "planilha" | "outro";

export interface LeadComercialPayload {
  product_id?: string | null;
  product_slug?: string | null;
  product_name?: string | null;
  full_name: string;
  work_email: string;
  phone: string;
  company_name: string;
  company_role?: string | null;
  company_size?: FaixaMotoristas | null;
  city?: string | null;
  current_solution?: SolucaoAtual | null;
  interest_message?: string | null;
  preferred_contact?: CanalContato;
  preferred_window?: JanelaContato | null;
  source?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
}

export interface LeadComercialResponse {
  success: boolean;
  lead_id?: string;
  error?: string;
}

export type StatusLead = "novo" | "contatado" | "qualificado" | "convertido" | "descartado";

export interface LeadComercialRow {
  id: string;
  product_id: string | null;
  product_slug: string | null;
  product_name: string | null;
  full_name: string;
  work_email: string;
  phone: string;
  company_name: string;
  company_role: string | null;
  company_size: string | null;
  city: string | null;
  current_solution: string | null;
  interest_message: string | null;
  preferred_contact: string | null;
  preferred_window: string | null;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  status: StatusLead;
  assigned_to: string | null;
  notes: string | null;
  contacted_at: string | null;
  qualified_at: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
}