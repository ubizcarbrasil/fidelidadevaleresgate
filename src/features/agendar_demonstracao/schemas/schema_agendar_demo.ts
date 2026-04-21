import { z } from "zod";

export const schemaAgendarDemo = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, "Informe seu nome completo")
    .max(120, "Máximo 120 caracteres"),
  work_email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Informe um e-mail corporativo válido")
    .max(180, "Máximo 180 caracteres"),
  phone: z
    .string()
    .trim()
    .min(10, "Informe um telefone com DDD")
    .max(20, "Máximo 20 caracteres")
    .regex(/^[\d\s()+\-]+$/, "Use apenas números, espaços, +, ( ou )"),
  company_name: z
    .string()
    .trim()
    .min(2, "Informe o nome da empresa")
    .max(120, "Máximo 120 caracteres"),
  company_role: z.string().trim().max(80).optional().or(z.literal("")),
  company_size: z.enum(["1-50", "50-200", "200-500", "500-1000", "1000+"]).optional(),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  current_solution: z
    .enum(["nenhuma", "app_proprio", "terceiro", "planilha", "outro"])
    .optional(),
  interest_message: z.string().trim().max(800, "Máximo 800 caracteres").optional().or(z.literal("")),
  preferred_contact: z.enum(["whatsapp", "email", "ligacao"]).default("whatsapp"),
  preferred_window: z.enum(["manha", "tarde", "noite"]).optional(),
});

export type FormularioAgendarDemo = z.infer<typeof schemaAgendarDemo>;