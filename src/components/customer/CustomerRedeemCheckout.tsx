import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCustomer } from "@/contexts/CustomerContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MapPin, Loader2, CheckCircle2, Package } from "lucide-react";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";
import { formatPoints } from "@/lib/formatPoints";

interface RedeemDeal {
  id: string;
  title: string;
  image_url: string | null;
  price: number | null;
  affiliate_url: string;
  redeem_points_cost: number;
}

interface Props {
  deal: RedeemDeal;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CustomerRedeemCheckout({ deal, onClose, onSuccess }: Props) {
  const { customer, refetch } = useCustomer();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: customer?.name || "",
    phone: customer?.phone || "",
    cpf: customer?.cpf || "",
    cep: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const pointsBalance = customer?.points_balance || 0;
  const canAfford = pointsBalance >= deal.redeem_points_cost;

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const buscarCep = async (cep: string) => {
    const cleaned = cep.replace(/\D/g, "");
    if (cleaned.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((prev) => ({
          ...prev,
          address: data.logradouro || prev.address,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      }
    } catch {
      // silent
    }
    setCepLoading(false);
  };

  const handleSubmit = async () => {
    if (!customer) return;
    if (!canAfford) {
      toast.error("Saldo de pontos insuficiente!");
      return;
    }
    if (!form.name || !form.phone || !form.cep || !form.address || !form.number || !form.neighborhood || !form.city || !form.state) {
      toast.error("Preencha todos os campos obrigatórios!");
      return;
    }

    setLoading(true);
    try {
      // 1. Debit points via ledger
      const { error: ledgerError } = await supabase.from("points_ledger").insert({
        customer_id: customer.id,
        brand_id: customer.brand_id,
        branch_id: customer.branch_id,
        entry_type: "DEBIT",
        points_amount: deal.redeem_points_cost,
        reason: `Resgate: ${deal.title}`,
        reference_type: "REDEMPTION",
      } as any);
      if (ledgerError) throw ledgerError;

      // 1b. Decrement customer balance
      await supabase.from("customers").update({
        points_balance: pointsBalance - deal.redeem_points_cost,
      }).eq("id", customer.id);

      // 2. Create redemption order with order_source = 'customer'
      const { error: orderError } = await supabase.from("product_redemption_orders").insert({
        brand_id: customer.brand_id,
        branch_id: customer.branch_id,
        customer_id: customer.id,
        deal_id: deal.id,
        deal_snapshot_json: {
          title: deal.title,
          image_url: deal.image_url,
          price: deal.price,
        },
        affiliate_url: deal.affiliate_url,
        points_spent: deal.redeem_points_cost,
        customer_name: form.name,
        customer_phone: form.phone,
        customer_cpf: form.cpf || null,
        delivery_cep: form.cep,
        delivery_address: form.address,
        delivery_number: form.number,
        delivery_complement: form.complement || null,
        delivery_neighborhood: form.neighborhood,
        delivery_city: form.city,
        delivery_state: form.state,
        order_source: "customer",
      });
      if (orderError) throw orderError;

      // Refresh customer balance
      await refetch();

      setSuccess(true);
      toast.success("Resgate solicitado com sucesso! 🎉");
    } catch (err: any) {
      haptics.error();
      toast.error(err.message || "Erro ao processar resgate");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Resgate Solicitado!</h2>
        <p className="text-sm text-muted-foreground mb-1">
          Seu pedido foi enviado para análise.
        </p>
        <p className="text-xs text-muted-foreground mb-6">
          Você será notificado sobre o andamento.
        </p>
        <Button onClick={() => { onSuccess(); onClose(); }}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="max-w-lg mx-auto px-5 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Checkout de Resgate</h1>
        </div>

        {/* Product summary */}
        <div className="flex items-start gap-3 p-4 rounded-2xl mb-5" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          {deal.image_url && (
            <img src={deal.image_url} alt="" className="h-16 w-16 rounded-xl object-cover flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold line-clamp-2">{deal.title}</p>
            <div className="flex items-center gap-2 mt-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-bold" style={{ color: "hsl(var(--primary))" }}>
                {formatPoints(deal.redeem_points_cost)} pts
              </span>
            </div>
          </div>
        </div>

        {/* Points balance warning */}
        <div className="p-3 rounded-xl mb-5" style={{
          backgroundColor: canAfford ? "hsl(142 71% 45% / 0.08)" : "hsl(0 72% 51% / 0.08)",
          border: `1px solid ${canAfford ? "hsl(142 71% 45% / 0.2)" : "hsl(0 72% 51% / 0.2)"}`,
        }}>
          <p className="text-sm">
            Seu saldo: <strong>{formatPoints(pointsBalance)} pts</strong>
          </p>
          {!canAfford && (
            <p className="text-xs mt-1" style={{ color: "hsl(0 72% 51%)" }}>
              Você precisa de mais {formatPoints(deal.redeem_points_cost - pointsBalance)} pontos para este resgate.
            </p>
          )}
        </div>

        {/* Form */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Dados de Entrega
          </h3>

          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nome completo *</Label>
              <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Telefone *</Label>
                <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">CPF</Label>
                <Input value={form.cpf} onChange={(e) => updateField("cpf", e.target.value)} placeholder="000.000.000-00" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">CEP *</Label>
              <div className="flex gap-2">
                <Input
                  value={form.cep}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateField("cep", v);
                    if (v.replace(/\D/g, "").length === 8) buscarCep(v);
                  }}
                  placeholder="00000-000"
                  className="flex-1"
                />
                {cepLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-2" />}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Endereço *</Label>
              <Input value={form.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Rua, Avenida..." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Número *</Label>
                <Input value={form.number} onChange={(e) => updateField("number", e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Complemento</Label>
                <Input value={form.complement} onChange={(e) => updateField("complement", e.target.value)} placeholder="Apto, Bloco..." />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bairro *</Label>
              <Input value={form.neighborhood} onChange={(e) => updateField("neighborhood", e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Cidade *</Label>
                <Input value={form.city} onChange={(e) => updateField("city", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">UF *</Label>
                <Input value={form.state} onChange={(e) => updateField("state", e.target.value)} maxLength={2} />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="mt-6 pb-8">
          <Button
            className="w-full h-12 text-base font-bold rounded-2xl"
            disabled={!canAfford || loading}
            onClick={handleSubmit}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>Confirmar Resgate — {formatPoints(deal.redeem_points_cost)} pts</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
