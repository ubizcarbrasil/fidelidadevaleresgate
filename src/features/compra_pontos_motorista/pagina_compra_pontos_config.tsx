import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Coins, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatPoints } from "@/lib/formatPoints";

export default function PaginaCompraPontosConfig() {
  const { currentBrandId } = useBrandGuard();
  const queryClient = useQueryClient();

  // Config
  const { data: config, isLoading: loadingConfig } = useQuery({
    queryKey: ["driver-points-config-admin", currentBrandId],
    queryFn: async () => {
      const { data } = await supabase
        .from("driver_points_purchase_config" as any)
        .select("*")
        .eq("brand_id", currentBrandId)
        .maybeSingle();
      return data as any;
    },
    enabled: !!currentBrandId,
  });

  const [priceReais, setPriceReais] = useState("70.00");
  const [minPoints, setMinPoints] = useState("1000");
  const [maxPoints, setMaxPoints] = useState("300000");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (config) {
      setPriceReais(((config.price_per_thousand_cents || 7000) / 100).toFixed(2));
      setMinPoints(String(config.min_points || 1000));
      setMaxPoints(String(config.max_points || 300000));
      setIsActive(config.is_active ?? true);
    }
  }, [config]);

  const saveConfig = useMutation({
    mutationFn: async () => {
      const cents = Math.round(parseFloat(priceReais) * 100);
      if (isNaN(cents) || cents <= 0) throw new Error("Preço inválido");
      const payload: any = {
        brand_id: currentBrandId,
        price_per_thousand_cents: cents,
        min_points: parseInt(minPoints) || 1000,
        max_points: parseInt(maxPoints) || 300000,
        is_active: isActive,
      };
      if (config?.id) {
        const { error } = await supabase.from("driver_points_purchase_config" as any).update(payload).eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("driver_points_purchase_config" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Configuração salva!");
      queryClient.invalidateQueries({ queryKey: ["driver-points-config-admin"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Orders
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["driver-points-orders-admin", currentBrandId],
    queryFn: async () => {
      const { data } = await supabase
        .from("driver_points_orders" as any)
        .select("*, customers!driver_points_orders_customer_id_fkey(name)")
        .eq("brand_id", currentBrandId)
        .order("created_at", { ascending: false })
        .limit(100);
      return (data || []) as any[];
    },
    enabled: !!currentBrandId,
  });

  const confirmOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase.rpc("confirm_driver_points_order" as any, {
        p_order_id: orderId,
        p_confirmed_by: user.id,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Erro ao confirmar");
    },
    onSuccess: () => {
      toast.success("Pedido confirmado! Pontos creditados.");
      queryClient.invalidateQueries({ queryKey: ["driver-points-orders-admin"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const cancelOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from("driver_points_orders" as any)
        .update({ status: "CANCELLED" } as any)
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pedido cancelado.");
      queryClient.invalidateQueries({ queryKey: ["driver-points-orders-admin"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Configuração de Venda de Pontos
          </CardTitle>
          <CardDescription>
            Defina o preço do milheiro e os limites de compra para motoristas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Preço do Milheiro (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={priceReais}
                onChange={(e) => setPriceReais(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Mínimo de pontos</Label>
              <Input
                type="number"
                min="100"
                value={minPoints}
                onChange={(e) => setMinPoints(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Máximo de pontos</Label>
              <Input
                type="number"
                min="1000"
                value={maxPoints}
                onChange={(e) => setMaxPoints(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Ativar venda de pontos para motoristas</Label>
          </div>
          <Button onClick={() => saveConfig.mutate()} disabled={saveConfig.isPending}>
            {saveConfig.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Salvar Configuração
          </Button>
        </CardContent>
      </Card>

      {/* Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos de Compra de Pontos</CardTitle>
          <CardDescription>Gerencie os pedidos feitos pelos motoristas.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingOrders ? (
            <div className="flex justify-center p-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum pedido encontrado.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order: any) => {
                const customerName = order.customers?.name?.replace(/\[MOTORISTA\]\s*/gi, "") || "Motorista";
                const statusIcon = order.status === "CONFIRMED"
                  ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                  : order.status === "CANCELLED"
                    ? <XCircle className="h-4 w-4 text-red-500" />
                    : <Clock className="h-4 w-4 text-yellow-500" />;
                return (
                  <div
                    key={order.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border"
                  >
                    {statusIcon}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPoints(order.points_amount)} pts — {(order.price_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        {" · "}
                        {new Date(order.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    {order.status === "PENDING" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => confirmOrder.mutate(order.id)}
                          disabled={confirmOrder.isPending}
                        >
                          Confirmar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelOrder.mutate(order.id)}
                          disabled={cancelOrder.isPending}
                        >
                          Cancelar
                        </Button>
                      </div>
                    )}
                    {order.status !== "PENDING" && (
                      <span className="text-xs font-medium px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: order.status === "CONFIRMED" ? "#22c55e20" : "#ef444420",
                          color: order.status === "CONFIRMED" ? "#22c55e" : "#ef4444",
                        }}
                      >
                        {order.status === "CONFIRMED" ? "Confirmado" : "Cancelado"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
