import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCustomer } from "@/contexts/CustomerContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MapPin, Loader2, CheckCircle2, Package, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";
import { formatPoints } from "@/lib/formatPoints";
import { sendRedemptionTelegramNotification } from "@/lib/sendRedemptionTelegram";

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

// Generate a random 6-digit code
const generateOtpCode = () => String(Math.floor(100000 + Math.random() * 900000));

export default function CustomerRedeemCheckout({ deal, onClose, onSuccess }: Props) {
  const { customer, refetch } = useCustomer();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // OTP verification state
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otpCode, setOtpCode] = useState("");
  const [otpInput, setOtpInput] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const handleProceedToOtp = () => {
    if (!customer) return;
    if (!canAfford) {
      toast.error("Saldo de pontos insuficiente!");
      return;
    }
    if (!form.name || !form.phone || !form.cep || !form.address || !form.number || !form.neighborhood || !form.city || !form.state) {
      toast.error("Preencha todos os campos obrigatórios!");
      return;
    }
    // Generate OTP code and show verification screen
    const code = generateOtpCode();
    setOtpCode(code);
    setOtpInput(["", "", "", "", "", ""]);
    setOtpError(false);
    setStep("otp");
    // Show code in toast (in production, send via SMS/email)
    toast.info(`Seu código de verificação: ${code}`, { duration: 15000 });
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;
    
    const newOtp = [...otpInput];
    newOtp[index] = value;
    setOtpInput(newOtp);
    setOtpError(false);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled
    if (value && index === 5 && newOtp.every((d) => d !== "")) {
      verifyAndSubmit(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpInput[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyAndSubmit = async (code: string) => {
    if (code !== otpCode) {
      setOtpError(true);
      haptics.error();
      toast.error("Código incorreto. Tente novamente.");
      return;
    }
    await processRedemption();
  };

  const processRedemption = async () => {
    if (loading) return;
    if (!customer) return;

    setOtpLoading(true);
    setLoading(true);
    try {
      const { data: orderId, error: rpcError } = await supabase.rpc(
        "process_product_redemption" as any,
        {
          p_customer_id: customer.id,
          p_brand_id: customer.brand_id,
          p_branch_id: customer.branch_id,
          p_deal_id: deal.id,
          p_deal_snapshot: {
            title: deal.title,
            image_url: deal.image_url,
            price: deal.price,
          },
          p_affiliate_url: deal.affiliate_url,
          p_points_cost: deal.redeem_points_cost,
          p_name: form.name,
          p_phone: form.phone,
          p_cpf: form.cpf || "",
          p_cep: form.cep,
          p_address: form.address,
          p_number: form.number,
          p_complement: form.complement || "",
          p_neighborhood: form.neighborhood,
          p_city: form.city,
          p_state: form.state,
          p_order_source: "customer",
        }
      );
      if (rpcError) throw rpcError;

      await refetch();
      queryClient.invalidateQueries({ queryKey: ["customer-product-orders"] });

      sendRedemptionTelegramNotification({
        brandId: customer.brand_id,
        branchId: customer.branch_id,
        customerName: form.name,
        customerPhone: form.phone,
        customerCpf: form.cpf || undefined,
        productTitle: deal.title,
        pointsSpent: deal.redeem_points_cost,
        deliveryAddress: `${form.address}, ${form.number}${form.complement ? ` - ${form.complement}` : ""} - ${form.neighborhood}, ${form.city}/${form.state} - CEP ${form.cep}`,
        productUrl: deal.affiliate_url,
        orderSource: "customer",
      });

      setSuccess(true);
      toast.success("Resgate solicitado com sucesso! 🎉");
    } catch (err: any) {
      haptics.error();
      toast.error(err.message || "Erro ao processar resgate");
    }
    setLoading(false);
    setOtpLoading(false);
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

  // OTP Verification Screen
  if (step === "otp") {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-sm w-full space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="h-16 w-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsl(var(--primary) / 0.1)" }}>
              <ShieldCheck className="h-8 w-8" style={{ color: "hsl(var(--primary))" }} />
            </div>
            <h2 className="text-xl font-bold">Verificação de Identidade</h2>
            <p className="text-sm text-muted-foreground">
              Digite o código de 6 dígitos para confirmar seu resgate
            </p>
          </div>

          <div className="flex justify-center gap-2">
            {otpInput.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className={`h-14 w-11 text-center text-xl font-bold rounded-xl border-2 bg-card outline-none transition-colors ${
                  otpError
                    ? "border-destructive"
                    : digit
                    ? "border-primary"
                    : "border-border"
                } focus:border-primary`}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {otpError && (
            <p className="text-sm text-destructive font-medium">Código incorreto</p>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Button
              className="w-full h-12 text-base font-bold rounded-2xl"
              disabled={otpInput.some((d) => !d) || otpLoading}
              onClick={() => verifyAndSubmit(otpInput.join(""))}
            >
              {otpLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Confirmar Resgate"
              )}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => { setStep("form"); setOtpError(false); }}
              disabled={otpLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
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
            onClick={handleProceedToOtp}
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