import { z } from "zod";

export const schemaEdicaoLead = z.object({
  full_name: z.string().trim().min(2, "Nome muito curto").max(150),
  work_email: z.string().trim().email("E-mail inválido").max(255),
  phone: z.string().trim().min(8, "Telefone inválido").max(20),
  company_name: z.string().trim().min(2, "Empresa obrigatória").max(150),
  company_role: z.string().trim().max(100).optional().or(z.literal("")),
  company_size: z.string().trim().max(50).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  current_solution: z.string().trim().max(50).optional().or(z.literal("")),
  interest_message: z.string().trim().max(2000).optional().or(z.literal("")),
  preferred_contact: z.string().trim().max(20).optional().or(z.literal("")),
  preferred_window: z.string().trim().max(20).optional().or(z.literal("")),
  product_name: z.string().trim().max(150).optional().or(z.literal("")),
  product_slug: z.string().trim().max(150).optional().or(z.literal("")),
  source: z.string().trim().max(100).optional().or(z.literal("")),
  utm_source: z.string().trim().max(100).optional().or(z.literal("")),
  utm_medium: z.string().trim().max(100).optional().or(z.literal("")),
  utm_campaign: z.string().trim().max(100).optional().or(z.literal("")),
});

export type DadosEdicaoLead = z.infer<typeof schemaEdicaoLead>;