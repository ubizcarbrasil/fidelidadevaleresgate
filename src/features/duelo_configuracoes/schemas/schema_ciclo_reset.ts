import { z } from "zod";

export const schemaCicloReset = z.object({
  duel_cycle_reset_enabled: z.boolean(),
  duel_cycle_frequency: z.enum(["daily", "weekly", "monthly", "quarterly"]),
  duel_cycle_day: z.number().int().min(1).max(31),
  duel_cycle_action: z.enum(["no_zero", "zero_duel", "zero_rides", "zero_both"]),
  duel_cycle_initial_points: z.number().int().min(0).max(1_000_000),
  duel_cycle_eligibility_json: z.object({
    min_rides_prev_period: z.number().int().min(0).max(10_000),
    only_active: z.boolean(),
  }),
});

export type CicloResetInput = z.infer<typeof schemaCicloReset>;