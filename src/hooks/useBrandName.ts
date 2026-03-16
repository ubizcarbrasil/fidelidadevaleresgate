import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useBrandName(): string {
  const { name } = useBrandInfo();
  return name;
}

export function useBrandInfo(): { name: string; logoUrl: string | null; brandId: string | null; subscriptionPlan: string | null } {
  const { roles } = useAuth();
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);

  const brandId = roles.find((r) => r.brand_id)?.brand_id ?? null;

  useEffect(() => {
    if (!brandId) return;
    supabase
      .from("brands")
      .select("name, brand_settings_json, subscription_plan")
      .eq("id", brandId)
      .single()
      .then(({ data }) => {
        if (data?.name) setName(data.name);
        if (data?.subscription_plan) setSubscriptionPlan(data.subscription_plan);
        if (data?.brand_settings_json && typeof data.brand_settings_json === "object" && !Array.isArray(data.brand_settings_json)) {
          const settings = data.brand_settings_json as Record<string, any>;
          if (settings.logo_url) setLogoUrl(settings.logo_url);
        }
      });
  }, [brandId]);

  return { name, logoUrl, brandId, subscriptionPlan };
}
