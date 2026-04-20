import { z } from "zod";

export const schemaCampanhaPremio = z.object({
  name: z.string().min(2, "Nome obrigatório").max(120),
  description: z.string().max(2000).optional().nullable(),
  image_url: z.string().url("URL inválida").optional().or(z.literal("")).nullable(),
  points_cost: z.number().int().positive("Custo precisa ser maior que zero"),
  quantity_total: z.number().int().positive("Quantidade precisa ser maior que zero"),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  status: z.enum(["active", "paused", "ended"]),
}).refine(
  (v) => new Date(v.ends_at) > new Date(v.starts_at),
  { message: "Data fim deve ser depois da data início", path: ["ends_at"] },
);

export type CampanhaPremioInput = z.infer<typeof schemaCampanhaPremio>;