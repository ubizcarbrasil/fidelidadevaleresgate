import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Integration = {
  id: string;
  brand_id: string;
  branch_id: string | null;
  api_key: string;
  basic_auth_user: string;
  basic_auth_password: string;
  webhook_registered: boolean;
  is_active: boolean;
  last_webhook_at: string | null;
  last_ride_processed_at: string | null;
  total_rides: number;
  total_points: number;
  callback_url: string | null;
  created_at: string;
  updated_at: string;
  preferred_endpoint?: string;
  matrix_api_key?: string | null;
  matrix_basic_auth_user?: string | null;
  matrix_basic_auth_password?: string | null;
  telegram_chat_id?: string | null;
  driver_points_enabled?: boolean;
  driver_points_percent?: number;
  driver_points_mode?: string;
  driver_points_per_real?: number;
  driver_message_enabled?: boolean;
};

export type Branch = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
};

export type BrandMatrix = {
  matrix_api_key: string | null;
  matrix_basic_auth_user: string | null;
  matrix_basic_auth_password: string | null;
} | null;

export function useIntegracoes(brandId: string | null) {
  const branchesQuery = useQuery({
    queryKey: ["branches", brandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name, city, state")
        .eq("brand_id", brandId!)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Branch[];
    },
    enabled: !!brandId,
  });

  const integrationsQuery = useQuery({
    queryKey: ["machine-integrations", brandId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("machine_integrations")
        .select("*")
        .eq("brand_id", brandId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as Integration[];
    },
    enabled: !!brandId,
  });

  const brandMatrixQuery = useQuery({
    queryKey: ["brand-matrix", brandId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("brands")
        .select("matrix_api_key, matrix_basic_auth_user, matrix_basic_auth_password")
        .eq("id", brandId!)
        .maybeSingle();
      if (error) throw error;
      return data as BrandMatrix;
    },
    enabled: !!brandId,
  });

  const branches = branchesQuery.data ?? [];
  const integrations = integrationsQuery.data ?? [];
  const activeIntegrations = integrations.filter((i) => i.is_active);
  const integratedBranchIds = new Set(activeIntegrations.map((i) => i.branch_id));
  const availableBranches = branches.filter((b) => !integratedBranchIds.has(b.id));

  const getBranchName = (branchId: string | null) => {
    if (!branchId) return "Sem cidade";
    const b = branches.find((br) => br.id === branchId);
    return b ? b.name : branchId;
  };

  return {
    branches,
    integrations,
    activeIntegrations,
    availableBranches,
    brandMatrix: brandMatrixQuery.data ?? null,
    isLoading: integrationsQuery.isLoading,
    getBranchName,
  };
}
