import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function usePacotesPontos() {
  const { currentBrandId } = useBrandGuard();

  const packagesQuery = useQuery({
    queryKey: ["points-packages", currentBrandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("points_packages")
        .select("*")
        .eq("brand_id", currentBrandId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!currentBrandId,
  });

  return { packages: packagesQuery.data ?? [], isLoading: packagesQuery.isLoading, currentBrandId };
}

export function usePacotesPontosOrders() {
  const { currentBrandId } = useBrandGuard();

  const ordersQuery = useQuery({
    queryKey: ["points-package-orders", currentBrandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("points_package_orders")
        .select("*, points_packages(name), branches(name)")
        .eq("brand_id", currentBrandId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentBrandId,
  });

  return { orders: ordersQuery.data ?? [], isLoading: ordersQuery.isLoading };
}

export function useCriarPacote() {
  const queryClient = useQueryClient();
  const { currentBrandId } = useBrandGuard();

  return useMutation({
    mutationFn: async (pkg: { name: string; points_amount: number; price_cents: number; description?: string }) => {
      const { error } = await supabase.from("points_packages").insert({
        brand_id: currentBrandId!,
        name: pkg.name,
        points_amount: pkg.points_amount,
        price_cents: pkg.price_cents,
        description: pkg.description || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pacote criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["points-packages"] });
    },
    onError: () => toast.error("Erro ao criar pacote"),
  });
}

export function useAtualizarPacote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pkg: { id: string; name?: string; points_amount?: number; price_cents?: number; description?: string; is_active?: boolean; sort_order?: number }) => {
      const { id, ...updates } = pkg;
      const { error } = await supabase.from("points_packages").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pacote atualizado!");
      queryClient.invalidateQueries({ queryKey: ["points-packages"] });
    },
    onError: () => toast.error("Erro ao atualizar pacote"),
  });
}

export function useConfirmarPedido() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.rpc("confirm_package_order", {
        p_order_id: orderId,
        p_confirmed_by: user!.id,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Erro desconhecido");
      return result;
    },
    onSuccess: () => {
      toast.success("Pedido confirmado! Pontos creditados.");
      queryClient.invalidateQueries({ queryKey: ["points-package-orders"] });
      queryClient.invalidateQueries({ queryKey: ["branch-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["branch-dashboard-stats-v2"] });
    },
    onError: (err: any) => toast.error(err.message || "Erro ao confirmar pedido"),
  });
}

export function useCancelarPedido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from("points_package_orders")
        .update({ status: "CANCELLED" })
        .eq("id", orderId)
        .eq("status", "PENDING");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pedido cancelado.");
      queryClient.invalidateQueries({ queryKey: ["points-package-orders"] });
    },
    onError: () => toast.error("Erro ao cancelar pedido"),
  });
}
