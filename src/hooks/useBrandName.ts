import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/contexts/BrandContext";
import { supabase } from "@/integrations/supabase/client";

export function useBrandName(): string {
  return useBrandInfo().name;
}

export function useBrandInfo(): {
  name: string;
  logoUrl: string | null;
  brandId: string | null;
  subscriptionPlan: string | null;
} {
  const { roles } = useAuth();
  const { brand: ctxBrand } = useBrand();

  const brandId = ctxBrand?.id ?? roles.find((r) => r.brand_id)?.brand_id ?? null;

  const { data } = useQuery({
    queryKey: ["brand-info", brandId],
    enabled: !!brandId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      // Reaproveita do contexto se for o mesmo brand (evita ida ao banco)
      if (ctxBrand && ctxBrand.id === brandId) {
        return {
          name: ctxBrand.name,
          brand_settings_json: ctxBrand.brand_settings_json,
          subscription_plan: ctxBrand.subscription_plan,
        };
      }
      const { data } = await supabase
        .from("brands")
        .select("name, brand_settings_json, subscription_plan")
        .eq("id", brandId!)
        .single();
      return data;
    },
  });

  const settingsRaw = data?.brand_settings_json;
  const settings =
    settingsRaw && typeof settingsRaw === "object" && !Array.isArray(settingsRaw)
      ? (settingsRaw as Record<string, any>)
      : {};

  return {
    name: data?.name ?? "",
    logoUrl: settings.logo_url ?? null,
    brandId,
    subscriptionPlan: data?.subscription_plan ?? null,
  };
}
