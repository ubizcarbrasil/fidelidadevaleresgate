import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Package, ExternalLink, Check, X, Truck, MapPin, Clock, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pendente", variant: "outline" },
  APPROVED: { label: "Aprovado", variant: "default" },
  SHIPPED: { label: "Enviado", variant: "secondary" },
  DELIVERED: { label: "Entregue", variant: "default" },
  REJECTED: { label: "Rejeitado", variant: "destructive" },
};

export default function ProductRedemptionOrdersPage() {
  const qc = useQueryClient();
  const { currentBrandId, currentBranchId, consoleScope } = useBrandGuard();
  const isMobile = useIsMobile();
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [trackingCode, setTrackingCode] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const isBranchScope = consoleScope === "BRANCH" && !!currentBranchId;

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["product-redemption-orders", currentBrandId, currentBranchId],
    enabled: !!currentBrandId,
    queryFn: async () => {
      let q = supabase
        .from("product_redemption_orders")
        .select("*")
        .eq("brand_id", currentBrandId!)
        .order("created_at", { ascending: false })
        .limit(200);

      // Isolamento por cidade para branch_admin
      if (isBranchScope) {
        q = q.eq("branch_id", currentBranchId!);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, extras }: { id: string; status: string; extras?: Record<string, any> }) => {
      const updateData: any = { status, ...extras };
      if (status !== "PENDING") {
        updateData.reviewed_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from("product_redemption_orders")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;

      const order = orders.find((o: any) => o.id === id);

      // If rejecting, refund points
      if (status === "REJECTED" && order) {
        const userId = (await supabase.auth.getUser()).data.user!.id;
        await supabase.from("points_ledger").insert({
          customer_id: order.customer_id,
          brand_id: order.brand_id,
          branch_id: order.branch_id,
          entry_type: "CREDIT",
          points_amount: order.points_spent,
          reason: `Reembolso: pedido de resgate rejeitado`,
          reference_type: "MANUAL_ADJUSTMENT",
          created_by_user_id: userId,
        } as any);
        const { data: cust } = await supabase
          .from("customers")
          .select("points_balance")
          .eq("id", order.customer_id)
          .single();
        if (cust) {
          await supabase.from("customers").update({
            points_balance: (cust.points_balance || 0) + order.points_spent,
          }).eq("id", order.customer_id);
        }
      }

      // Send push notification
      if (order) {
        const snap = snapshot(order);
        const title = snap.title || "Produto";
        const notificationMap: Record<string, { title: string; body: string }> = {
          APPROVED: {
            title: "Seu pedido de resgate foi aprovado! 🎉",
            body: `O produto ${title} foi aprovado e será enviado em breve.`,
          },
          SHIPPED: {
            title: "Seu pedido foi enviado! 📦",
            body: extras?.tracking_code
              ? `Rastreio: ${extras.tracking_code}`
              : `O produto ${title} está a caminho.`,
          },
          DELIVERED: {
            title: "Pedido entregue! ✅",
            body: `O produto ${title} foi entregue.`,
          },
          REJECTED: {
            title: "Pedido de resgate não aprovado",
            body: `Seus ${order.points_spent} pontos foram devolvidos.`,
          },
        };
        const msg = notificationMap[status];
        if (msg) {
          await supabase.functions.invoke("send-push-notification", {
            body: {
              customer_ids: [order.customer_id],
              title: msg.title,
              body: msg.body,
              reference_type: "product_redemption",
              reference_id: order.id,
            },
          });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-redemption-orders"] });
      toast.success("Pedido atualizado!");
      setSelectedOrder(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openDetail = (order: any) => {
    setSelectedOrder(order);
    setTrackingCode(order.tracking_code || "");
    setAdminNotes(order.admin_notes || "");
  };

  const snapshot = (order: any) => {
    try {
      return typeof order.deal_snapshot_json === "string"
        ? JSON.parse(order.deal_snapshot_json)
        : order.deal_snapshot_json || {};
    } catch {
      return {};
    }
  };

  const filteredOrders = statusFilter === "ALL"
    ? orders
    : orders.filter((o: any) => o.status === statusFilter);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <Package className="h-6 w-6" />
          Pedidos de Resgate
        </h2>
        <p className="text-sm text-muted-foreground">Gerencie pedidos de resgate de produtos com pontos</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[{ key: "ALL", label: "Todos" }, ...Object.entries(STATUS_MAP).map(([key, val]) => ({ key, label: val.label }))].map((item) => (
          <Button
            key={item.key}
            variant={statusFilter === item.key ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(item.key)}
          >
            {item.label}
            {item.key !== "ALL" && (
              <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                {orders.filter((o: any) => o.status === item.key).length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-center py-8 text-muted-foreground">Carregando...</p>
      ) : !orders.length ? (
        <p className="text-center py-8 text-muted-foreground">Nenhum pedido de resgate encontrado</p>
      ) : isMobile ? (
        /* ── Mobile Card View ── */
        <div className="space-y-3">
          {filteredOrders.map((order: any) => {
            const snap = snapshot(order);
            const st = STATUS_MAP[order.status] || STATUS_MAP.PENDING;
            return (
              <Card key={order.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {snap.image_url && (
                      <img src={snap.image_url} alt="" className="h-14 w-14 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-2">{snap.title || "Produto"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{order.customer_name}</p>
                      {order.customer_phone && (
                        <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{order.points_spent} pts</span>
                      <Badge variant={st.variant} className="text-[10px]">{st.label}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(order.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(order)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {order.affiliate_url && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={order.affiliate_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* ── Desktop Table View ── */
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Pontos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order: any) => {
                  const snap = snapshot(order);
                  const st = STATUS_MAP[order.status] || STATUS_MAP.PENDING;
                  return (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {snap.image_url && (
                            <img src={snap.image_url} alt="" className="h-8 w-8 rounded object-cover" />
                          )}
                          <span className="font-medium text-sm line-clamp-1">{snap.title || "Produto"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-sm">{order.points_spent} pts</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openDetail(order)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {order.affiliate_url && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={order.affiliate_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detalhe do Pedido
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (() => {
            const snap = snapshot(selectedOrder);
            const st = STATUS_MAP[selectedOrder.status] || STATUS_MAP.PENDING;
            return (
              <div className="space-y-4">
                {/* Product info */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  {snap.image_url && (
                    <img src={snap.image_url} alt="" className="h-16 w-16 rounded object-cover flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{snap.title}</p>
                    {snap.price && <p className="text-xs text-muted-foreground">Preço: R$ {Number(snap.price).toFixed(2).replace(".", ",")}</p>}
                    <p className="text-sm font-bold mt-1">{selectedOrder.points_spent} pts</p>
                  </div>
                </div>

                {/* Link ML */}
                {selectedOrder.affiliate_url && (
                  <div className="space-y-1">
                    <Label className="text-xs">Link Marketplace</Label>
                    <a
                      href={selectedOrder.affiliate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary underline break-all"
                    >
                      {selectedOrder.affiliate_url}
                    </a>
                  </div>
                )}

                {/* Customer info */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> Dados do Motorista
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs">Nome</span>
                      <p>{selectedOrder.customer_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Telefone</span>
                      <p>{selectedOrder.customer_phone}</p>
                    </div>
                    {selectedOrder.customer_cpf && (
                      <div>
                        <span className="text-muted-foreground text-xs">CPF</span>
                        <p>{selectedOrder.customer_cpf}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Endereço de Entrega</h4>
                  <div className="text-sm bg-muted/30 p-3 rounded-lg">
                    <p>{selectedOrder.delivery_address}, {selectedOrder.delivery_number}</p>
                    {selectedOrder.delivery_complement && <p>{selectedOrder.delivery_complement}</p>}
                    <p>{selectedOrder.delivery_neighborhood} - {selectedOrder.delivery_city}/{selectedOrder.delivery_state}</p>
                    <p>CEP: {selectedOrder.delivery_cep}</p>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Status:</span>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>

                  {selectedOrder.tracking_code && (
                    <div>
                      <span className="text-xs text-muted-foreground">Rastreio:</span>
                      <p className="text-sm font-medium">{selectedOrder.tracking_code}</p>
                    </div>
                  )}
                </div>

                {/* Admin notes */}
                <div className="space-y-1">
                  <Label className="text-xs">Notas internas</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={2}
                    placeholder="Observações sobre o pedido..."
                  />
                </div>

                {/* Tracking code input for shipping */}
                {(selectedOrder.status === "APPROVED" || selectedOrder.status === "PENDING") && (
                  <div className="space-y-1">
                    <Label className="text-xs">Código de Rastreio</Label>
                    <Input
                      value={trackingCode}
                      onChange={(e) => setTrackingCode(e.target.value)}
                      placeholder="Ex: BR123456789..."
                    />
                  </div>
                )}

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  {selectedOrder.status === "PENDING" && (
                    <>
                      <Button
                        variant="default"
                        onClick={() =>
                          updateStatus.mutate({
                            id: selectedOrder.id,
                            status: "APPROVED",
                            extras: { admin_notes: adminNotes },
                          })
                        }
                        disabled={updateStatus.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" /> Aprovar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() =>
                          updateStatus.mutate({
                            id: selectedOrder.id,
                            status: "REJECTED",
                            extras: { admin_notes: adminNotes },
                          })
                        }
                        disabled={updateStatus.isPending}
                      >
                        <X className="h-4 w-4 mr-1" /> Rejeitar (devolver pts)
                      </Button>
                    </>
                  )}
                  {selectedOrder.status === "APPROVED" && (
                    <Button
                      onClick={() =>
                        updateStatus.mutate({
                          id: selectedOrder.id,
                          status: "SHIPPED",
                          extras: { tracking_code: trackingCode, admin_notes: adminNotes },
                        })
                      }
                      disabled={updateStatus.isPending}
                    >
                      <Truck className="h-4 w-4 mr-1" /> Marcar Enviado
                    </Button>
                  )}
                  {selectedOrder.status === "SHIPPED" && (
                    <Button
                      onClick={() =>
                        updateStatus.mutate({
                          id: selectedOrder.id,
                          status: "DELIVERED",
                          extras: { admin_notes: adminNotes },
                        })
                      }
                      disabled={updateStatus.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" /> Marcar Entregue
                    </Button>
                  )}
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
