import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function usePacotesDisponiveis() {
  const { currentBrandId } = useBrandGuard();

  const query = useQuery({
    queryKey: ["points-packages-store", currentBrandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("points_packages")
        .select("*")
        .eq("brand_id", currentBrandId!)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!currentBrandId,
  });

  return { packages: query.data ?? [], isLoading: query.isLoading };
}

export function useMeusPedidos() {
  const { currentBrandId, currentBranchId } = useBrandGuard();

  const query = useQuery({
    queryKey: ["my-package-orders", currentBranchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("points_package_orders")
        .select("*, points_packages(name)")
        .eq("branch_id", currentBranchId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentBranchId,
  });

  return { orders: query.data ?? [], isLoading: query.isLoading };
}

export function useComprarPacote() {
  const queryClient = useQueryClient();
  const { currentBrandId, currentBranchId } = useBrandGuard();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (pkg: { id: string; points_amount: number; price_cents: number }) => {
      const { error } = await supabase.from("points_package_orders").insert({
        package_id: pkg.id,
        branch_id: currentBranchId!,
        brand_id: currentBrandId!,
        points_amount: pkg.points_amount,
        price_cents: pkg.price_cents,
        status: "PENDING",
        purchased_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pedido enviado! Aguardando confirmação do empreendedor.");
      queryClient.invalidateQueries({ queryKey: ["my-package-orders"] });
    },
    onError: () => toast.error("Erro ao enviar pedido"),
  });
}
