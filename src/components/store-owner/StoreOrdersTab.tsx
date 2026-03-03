import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CheckCircle2, Clock, ShoppingBag, User, FileText, Loader2 } from "lucide-react";

interface Props {
  store: any;
}

export default function StoreOrdersTab({ store }: Props) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"PENDING" | "CONFIRMED" | "all">("PENDING");

  const fetchOrders = async () => {
    setLoading(true);
    let query = supabase
      .from("catalog_cart_orders")
      .select("*")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data } = await query;
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [store.id, filter]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("store-orders")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "catalog_cart_orders",
        filter: `store_id=eq.${store.id}`,
      }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [store.id, filter]);

  const confirmPoints = async (order: any) => {
    if (!user) return;
    setConfirmingId(order.id);

    try {
      // 1. Update order status
      const { error: updateErr } = await supabase
        .from("catalog_cart_orders")
        .update({
          status: "CONFIRMED",
          points_confirmed_at: new Date().toISOString(),
          confirmed_by_user_id: user.id,
        })
        .eq("id", order.id);

      if (updateErr) throw updateErr;

      // 2. Find customer
      const customerId = order.customer_id;
      if (!customerId) {
        toast.success("Pedido confirmado! (cliente sem cadastro, pontos não creditados)");
        fetchOrders();
        setConfirmingId(null);
        return;
      }

      const points = order.points_earned_estimate || 0;
      const totalAmount = Number(order.total_amount) || 0;

      if (points > 0) {
        // 3. Insert earning_event
        await supabase.from("earning_events").insert({
          brand_id: store.brand_id,
          branch_id: store.branch_id,
          store_id: store.id,
          customer_id: customerId,
          created_by_user_id: user.id,
          points_earned: points,
          purchase_value: totalAmount,
          source: "STORE",
          status: "APPROVED",
          receipt_code: `PED-${order.id.slice(0, 8).toUpperCase()}`,
        });

        // 4. Insert points_ledger
        await supabase.from("points_ledger").insert({
          brand_id: store.brand_id,
          branch_id: store.branch_id,
          customer_id: customerId,
          created_by_user_id: user.id,
          entry_type: "CREDIT",
          reference_type: "EARNING_EVENT",
          reference_id: order.id,
          points_amount: points,
          money_amount: 0,
          reason: `Pedido catálogo - R$ ${totalAmount.toFixed(2)}`,
        });

        // 5. Update customer balance
        const { data: cust } = await supabase.from("customers").select("points_balance").eq("id", customerId).single();
        if (cust) {
          await supabase.from("customers").update({
            points_balance: Number(cust.points_balance) + points,
          }).eq("id", customerId);
        }
      }

      toast.success(`Pontuação confirmada! ${points} pontos creditados.`);
    } catch (err: any) {
      toast.error("Erro ao confirmar: " + (err.message || "Tente novamente"));
    }

    setConfirmingId(null);
    fetchOrders();
  };

  const filters = [
    { key: "PENDING" as const, label: "Pendentes", icon: Clock },
    { key: "CONFIRMED" as const, label: "Confirmados", icon: CheckCircle2 },
    { key: "all" as const, label: "Todos", icon: ShoppingBag },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Pedidos</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Gerencie pedidos e confirme pontuação</p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 bg-muted/60 rounded-xl p-1">
        {filters.map(f => {
          const Icon = f.icon;
          const count = f.key === "all" ? null : orders.length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                filter === f.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {f.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Nenhum pedido {filter === "PENDING" ? "pendente" : filter === "CONFIRMED" ? "confirmado" : ""}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const items = (order.items_json || []) as any[];
            const isPending = order.status === "PENDING";
            return (
              <Card key={order.id} className="rounded-2xl border-0 shadow-sm overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isPending ? "bg-amber-100" : "bg-green-100"}`}>
                        {isPending ? <Clock className="h-4 w-4 text-amber-600" /> : <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold">{order.customer_name || "Cliente"}</p>
                        {order.customer_cpf && (
                          <p className="text-[10px] text-muted-foreground">
                            CPF: {order.customer_cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={isPending ? "outline" : "secondary"} className="text-[9px]">
                      {isPending ? "Pendente" : "Confirmado"}
                    </Badge>
                  </div>

                  {/* Items summary */}
                  <div className="bg-muted/30 rounded-xl p-2.5 space-y-1">
                    {items.slice(0, 5).map((it: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="truncate flex-1">
                          {it.name}{it.is_half ? " (Meia)" : ""} ×{it.qty}
                        </span>
                        <span className="font-semibold ml-2">R$ {(it.price * it.qty).toFixed(2)}</span>
                      </div>
                    ))}
                    {items.length > 5 && (
                      <p className="text-[10px] text-muted-foreground">+ {items.length - 5} itens</p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("pt-BR")} {new Date(order.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-sm font-bold">R$ {Number(order.total_amount).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground">{order.points_earned_estimate} pts estimados</p>
                      {isPending && (
                        <Button
                          size="sm"
                          onClick={() => confirmPoints(order)}
                          disabled={confirmingId === order.id}
                          className="mt-1 h-8 rounded-xl text-xs gap-1"
                        >
                          {confirmingId === order.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          Confirmar Pontuação
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
