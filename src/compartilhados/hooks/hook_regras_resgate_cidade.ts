import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RegrasResgateEfetivas {
  points_per_real: number;
  points_per_real_driver: number;
  points_per_real_customer: number;
  min_points_to_redeem: number;
  max_redemptions_per_month: number;
  approval_deadline_hours: number;
}

const PADROES: RegrasResgateEfetivas = {
  points_per_real: 40,
  points_per_real_driver: 40,
  points_per_real_customer: 40,
  min_points_to_redeem: 100,
  max_redemptions_per_month: 3,
  approval_deadline_hours: 48,
};

/**
 * Resolve as regras de resgate efetivas seguindo a hierarquia:
 *   Cidade (branch_settings_json.redemption_rules)
 *   > Marca (brand_settings_json.redemption_rules)
 *   > Padrões internos
 *
 * Quando `branchId` for omitido, retorna apenas o nível da marca.
 */
export function useRegrasResgateCidade(brandId?: string | null, branchId?: string | null) {
  return useQuery({
    queryKey: ["regras-resgate-efetivas", brandId, branchId],
    queryFn: async (): Promise<RegrasResgateEfetivas> => {
      const [{ data: brand }, { data: branch }] = await Promise.all([
        supabase.from("brands").select("brand_settings_json").eq("id", brandId!).maybeSingle(),
        branchId
          ? supabase.from("branches").select("branch_settings_json").eq("id", branchId).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      const brandRules =
        ((brand?.brand_settings_json as Record<string, any> | null)?.redemption_rules as Partial<RegrasResgateEfetivas>) ||
        {};
      const cityRules =
        ((branch?.branch_settings_json as Record<string, any> | null)?.redemption_rules as Partial<RegrasResgateEfetivas>) ||
        {};

      const base = (k: keyof RegrasResgateEfetivas) =>
        (cityRules[k] as number | undefined) ?? (brandRules[k] as number | undefined) ?? PADROES[k];

      const pointsPerReal = base("points_per_real");
      const driverFallback =
        (cityRules.points_per_real_driver as number | undefined) ??
        (brandRules.points_per_real_driver as number | undefined) ??
        pointsPerReal;
      const customerFallback =
        (cityRules.points_per_real_customer as number | undefined) ??
        (brandRules.points_per_real_customer as number | undefined) ??
        pointsPerReal;

      return {
        points_per_real: pointsPerReal,
        points_per_real_driver: driverFallback,
        points_per_real_customer: customerFallback,
        min_points_to_redeem: base("min_points_to_redeem"),
        max_redemptions_per_month: base("max_redemptions_per_month"),
        approval_deadline_hours: base("approval_deadline_hours"),
      };
    },
    enabled: !!brandId,
  });
}

export const REGRAS_RESGATE_PADRAO = PADROES;
