import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useBrandName(): string {
  const { roles } = useAuth();
  const [brandName, setBrandName] = useState("");

  const brandId = roles.find((r) => r.brand_id)?.brand_id ?? null;

  useEffect(() => {
    if (!brandId) return;
    supabase
      .from("brands")
      .select("name")
      .eq("id", brandId)
      .single()
      .then(({ data }) => {
        if (data?.name) setBrandName(data.name);
      });
  }, [brandId]);

  return brandName;
}
