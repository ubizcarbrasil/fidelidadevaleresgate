import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DriverProfile } from "@/types/driver_profile";

/**
 * Busca o perfil estendido do motorista (driver_profiles).
 * Retorna null se ainda não houver perfil (motorista nunca foi importado).
 */
export function useDriverProfile(customerId: string | null | undefined) {
  return useQuery({
    queryKey: ["driver-profile", customerId],
    enabled: !!customerId,
    queryFn: async (): Promise<DriverProfile | null> => {
      if (!customerId) return null;
      const { data, error } = await (supabase as any)
        .from("driver_profiles")
        .select("*")
        .eq("customer_id", customerId)
        .maybeSingle();
      if (error) throw error;
      return (data as DriverProfile) ?? null;
    },
  });
}
