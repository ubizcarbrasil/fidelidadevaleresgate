import { z } from "zod";
import { POSICOES_PREMIAVEIS } from "../constants/constantes_templates";

const NOME_SERIE_REGEX = /^[A-Za-z0-9 ]{1,10}$/;

export const schemaSerie = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome obrigatório")
    .max(10, "Máx. 10 caracteres")
    .regex(NOME_SERIE_REGEX, "Apenas letras, números e espaços"),
  size: z
    .coerce.number()
    .int("Inteiro")
    .min(2, "Mínimo 2 motoristas")
    .max(64, "Máximo 64"),
  promote_count: z.coerce.number().int().min(0, "≥ 0").max(64),
  relegate_count: z.coerce.number().int().min(0, "≥ 0").max(64),
});

export const schemaPremio = z.object({
  position: z.enum(
    POSICOES_PREMIAVEIS as [string, ...string[]],
  ),
  points: z.coerce.number().int("Inteiro").min(0, "≥ 0").max(100000, "≤ 100000"),
});

export const schemaPremiosTier = z.object({
  tier_name: z.string(),
  prizes: z.array(schemaPremio).length(POSICOES_PREMIAVEIS.length),
});

export const schemaCriarTemporada = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Mínimo 3 caracteres")
      .max(80, "Máximo 80 caracteres"),
    year: z.coerce.number().int().min(2020).max(2100),
    month: z.coerce.number().int().min(1).max(12),
    classificationStartsAt: z.string().min(1, "Obrigatório"),
    classificationEndsAt: z.string().min(1, "Obrigatório"),
    knockoutStartsAt: z.string().min(1, "Obrigatório"),
    knockoutEndsAt: z.string().min(1, "Obrigatório"),
    series: z.array(schemaSerie).min(2, "Mínimo 2 séries").max(8, "Máximo 8 séries"),
    prizesPerTier: z.array(schemaPremiosTier).min(1),
  })
  .superRefine((val, ctx) => {
    // 1. Datas: classificação antes do mata-mata
    const cs = new Date(val.classificationStartsAt);
    const ce = new Date(val.classificationEndsAt);
    const ks = new Date(val.knockoutStartsAt);
    const ke = new Date(val.knockoutEndsAt);
    if (cs >= ce) {
      ctx.addIssue({
        code: "custom",
        message: "Início da classificação deve ser antes do fim",
        path: ["classificationStartsAt"],
      });
    }
    if (ce >= ks) {
      ctx.addIssue({
        code: "custom",
        message: "Mata-mata precisa começar depois da classificação",
        path: ["knockoutStartsAt"],
      });
    }
    if (ks >= ke) {
      ctx.addIssue({
        code: "custom",
        message: "Início do mata-mata deve ser antes do fim",
        path: ["knockoutStartsAt"],
      });
    }

    // 2. Nomes de séries únicos (case-insensitive)
    const seen = new Set<string>();
    val.series.forEach((s, idx) => {
      const k = s.name.trim().toLowerCase();
      if (seen.has(k)) {
        ctx.addIssue({
          code: "custom",
          message: "Nome de série duplicado",
          path: ["series", idx, "name"],
        });
      }
      seen.add(k);
    });

    // 3. Coerência de promoção/rebaixamento
    val.series.forEach((s, idx) => {
      if (s.promote_count + s.relegate_count > s.size) {
        ctx.addIssue({
          code: "custom",
          message: "Sobem + Descem não pode exceder o tamanho da série",
          path: ["series", idx, "promote_count"],
        });
      }
    });
  });

export type FormCriarTemporadaInput = z.infer<typeof schemaCriarTemporada>;
