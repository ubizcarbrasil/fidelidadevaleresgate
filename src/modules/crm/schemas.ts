/**
 * CRM Module — Zod validation schemas.
 */
import { z } from "zod";

export const contactCreateSchema = z.object({
  brand_id: z.string().uuid("brand_id deve ser UUID válido"),
  name: z.string().trim().max(200).nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  email: z.string().trim().email("Email inválido").max(255).nullable().optional(),
  cpf: z.string().trim().max(14).nullable().optional(),
  gender: z.enum(["M", "F", "O"]).nullable().optional(),
  os_platform: z.string().max(20).nullable().optional(),
  source: z.enum(["MOBILITY_APP", "LOYALTY", "STORE_UPLOAD", "MANUAL"]).default("MANUAL"),
  external_id: z.string().max(100).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export const eventCreateSchema = z.object({
  brand_id: z.string().uuid(),
  contact_id: z.string().uuid(),
  event_type: z.string().trim().min(1).max(50),
  event_subtype: z.string().max(50).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  payload_json: z.record(z.unknown()).default({}),
});

export const audienceCreateSchema = z.object({
  brand_id: z.string().uuid(),
  name: z.string().trim().min(1, "Nome obrigatório").max(100),
  description: z.string().max(500).nullable().optional(),
  filters_json: z.record(z.unknown()).default({}),
  estimated_count: z.number().int().min(0).default(0),
});

export const campaignCreateSchema = z.object({
  brand_id: z.string().uuid(),
  title: z.string().trim().min(1, "Título obrigatório").max(200),
  channel: z.enum(["WHATSAPP", "PUSH", "EMAIL", "IN_APP"]).default("PUSH"),
  audience_id: z.string().uuid().nullable().optional(),
  store_id: z.string().uuid().nullable().optional(),
  message_template: z.string().max(2000).nullable().optional(),
  image_url: z.string().url().max(500).nullable().optional(),
  scheduled_at: z.string().datetime().nullable().optional(),
});

export type ContactCreate = z.infer<typeof contactCreateSchema>;
export type EventCreate = z.infer<typeof eventCreateSchema>;
export type AudienceCreate = z.infer<typeof audienceCreateSchema>;
export type CampaignCreate = z.infer<typeof campaignCreateSchema>;
