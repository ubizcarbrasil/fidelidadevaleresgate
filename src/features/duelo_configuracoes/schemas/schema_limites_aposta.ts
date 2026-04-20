import { z } from "zod";

export const schemaLimitesAposta = z.object({
  duel_bet_min_individual: z.number().int().min(0).nullable(),
  duel_bet_max_individual: z.number().int().min(0).nullable(),
  duel_bet_max_total: z.number().int().min(0).nullable(),
}).refine(
  (v) => !v.duel_bet_min_individual || !v.duel_bet_max_individual || v.duel_bet_min_individual <= v.duel_bet_max_individual,
  { message: "Mínimo individual não pode ser maior que o máximo individual", path: ["duel_bet_min_individual"] },
).refine(
  (v) => !v.duel_bet_max_individual || !v.duel_bet_max_total || v.duel_bet_max_individual * 2 <= v.duel_bet_max_total + 0,
  { message: "Máximo total deve comportar 2x o máximo individual", path: ["duel_bet_max_total"] },
);

export type LimitesApostaInput = z.infer<typeof schemaLimitesAposta>;