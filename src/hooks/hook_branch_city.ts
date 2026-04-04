import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useBranchCityName(): string {
  const { roles } = useAuth();
  const [cityName, setCityName] = useState("");

  const branchId = roles.find((r) => r.branch_id)?.branch_id ?? null;

  useEffect(() => {
    if (!branchId) return;
    supabase
      .from("branches")
      .select("city, name")
      .eq("id", branchId)
      .single()
      .then(({ data }) => {
        if (data?.city) setCityName(data.city);
        else if (data?.name) setCityName(data.name);
      });
  }, [branchId]);

  return cityName;
}
