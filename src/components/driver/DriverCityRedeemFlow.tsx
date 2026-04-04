import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, CheckCircle2, Coins, ShoppingCart, Store, Copy } from "lucide-react";
import { toast } from "sonner";
import { useRedeemCelebration } from "@/hooks/useRedeemCelebration";
import { haptics } from "@/lib/haptics";
import { formatPoints } from "@/lib/formatPoints";
import DriverVerifyCodeStep from "./DriverVerifyCodeStep";
import type { OfertaCidade } from "./SecaoResgateCidade";

interface Props {
  oferta: OfertaCidade;
  fontHeading?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DriverCityRedeemFlow({ oferta, fontHeading, onClose, onSuccess }: Props) {
  const { driver, refreshDriver } = useDriverSession();
  const { celebrate: celebrateRedeem } = useRedeemCelebration();
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ token: string; pointsDebited: number } | null>(null);

  const pointsBalance = driver?.points_balance || 0;
  const canAfford = pointsBalance >= oferta.pointsCost;

  const handleConfirm = async () => {
    if (!driver || !canAfford) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("redeem_city_offer_driver", {
        p_customer_id: driver.id,
        p_offer_id: oferta.id,
        p_brand_id: driver.brand_id,
        p_branch_id: driver.branch_id,
        p_customer_cpf: driver.cpf || null,
      } as any);

      if (error) throw error;

      const res = data as any;
      if (!res?.success) {
        throw new Error(res?.error || "Erro ao processar resgate");
      }

      await refreshDriver();
      setResult({ token: res.token, pointsDebited: res.points_debited });
      celebrateRedeem({ title: "Resgate realizado! 🎉", description: "Aproveite seu benefício." });
    } catch (err: any) {
      haptics.error();
      toast.error(err.message || "Erro ao processar resgate");
    }
    setLoading(false);
  };

  const copyPin = () => {
    if (result?.token) {
      navigator.clipboard.writeText(result.token);
      toast.success("PIN copiado!");
    }
  };

  // Step 1: Verification
  if (!verified) {
    return (
      <DriverVerifyCodeStep
        onVerified={() => setVerified(true)}
        onBack={onClose}
      />
    );
  }

  // Step 3: Success with PIN
  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center" style={{ backgroundColor: "hsl(var(--background))" }}>
        <CheckCircle2 className="h-16 w-16 mb-4" style={{ color: "hsl(142 71% 45%)" }} />
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: fontHeading }}>
          Resgate Confirmado!
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Apresente o PIN abaixo na loja para utilizar seu crédito
        </p>

        {/* PIN display */}
        <button
          onClick={copyPin}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl mb-4 transition-transform active:scale-[0.97]"
          style={{
            backgroundColor: "hsl(var(--primary) / 0.1)",
            border: "2px dashed hsl(var(--primary) / 0.3)",
          }}
        >
          <span
            className="text-3xl font-extrabold tracking-[0.3em]"
            style={{ color: "hsl(var(--primary))" }}
          >
            {result.token}
          </span>
          <Copy className="h-5 w-5 text-muted-foreground" />
        </button>
        <p className="text-xs text-muted-foreground mb-1">Toque para copiar</p>

        {/* Info */}
        <div
          className="w-full max-w-sm rounded-2xl p-4 mt-4 space-y-2 text-left"
          style={{ backgroundColor: "hsl(var(--muted) / 0.4)" }}
        >
          {oferta.store_name && (
            <div className="flex items-center gap-2 text-sm">
              <Store className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground font-medium">{oferta.store_name}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Coins className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />
            <span className="text-muted-foreground">
              Crédito de{" "}
              <strong className="text-foreground">
                R$ {Number(oferta.value_rescue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </strong>
            </span>
          </div>
          {oferta.min_purchase != null && oferta.min_purchase > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <ShoppingCart className="h-4 w-4" style={{ color: "hsl(45 93% 47%)" }} />
              <span className="text-muted-foreground">
                Compra mínima:{" "}
                <strong className="text-foreground">
                  R$ {Number(oferta.min_purchase).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </strong>
              </span>
            </div>
          )}
        </div>

        <Button className="mt-6 w-full max-w-sm h-12 rounded-2xl font-bold" onClick={() => { onSuccess(); onClose(); }}>
          Voltar ao Marketplace
        </Button>
      </div>
    );
  }

  // Step 2: Confirmation
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: "hsl(var(--background))" }}>
      <div className="max-w-lg mx-auto pb-10">
        {/* Header */}
        <header className="sticky top-0 z-10 px-5 pt-4 pb-3" style={{ backgroundColor: "hsl(var(--background))" }}>
          <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </header>

        <div className="px-5 space-y-4">
          <h1 className="text-xl font-extrabold text-center" style={{ fontFamily: fontHeading }}>
            Confirmar Resgate
          </h1>

          {/* Offer summary */}
          <div
            className="flex items-center gap-4 p-4 rounded-2xl"
            style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
          >
            <div
              className="h-16 w-16 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ backgroundColor: "hsl(var(--muted) / 0.3)" }}
            >
              {oferta.store_logo_url ? (
                <img src={oferta.store_logo_url} alt="" className="h-full w-full object-contain p-2" />
              ) : oferta.image_url ? (
                <img src={oferta.image_url} alt="" className="h-full w-full object-contain p-2" />
              ) : (
                <Store className="h-8 w-8 text-muted-foreground/30" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              {oferta.store_name && (
                <p className="text-[10px] text-muted-foreground truncate">{oferta.store_name}</p>
              )}
              <p className="text-sm font-semibold line-clamp-2">{oferta.title}</p>
            </div>
          </div>

          {/* Credit value */}
          <div
            className="flex items-center justify-between px-4 py-3 rounded-2xl"
            style={{ backgroundColor: "hsl(var(--primary) / 0.1)" }}
          >
            <span className="text-sm text-muted-foreground">Crédito na loja</span>
            <span className="text-lg font-bold text-foreground">
              R$ {Number(oferta.value_rescue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Points cost */}
          <div
            className="flex items-center justify-between px-4 py-3 rounded-2xl"
            style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
          >
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />
              <span className="text-sm text-muted-foreground">Custo</span>
            </div>
            <span className="text-lg font-bold" style={{ color: "hsl(var(--primary))" }}>
              {formatPoints(oferta.pointsCost)} pontos
            </span>
          </div>

          {/* Min purchase */}
          {oferta.min_purchase != null && oferta.min_purchase > 0 && (
            <div
              className="px-4 py-3 rounded-2xl space-y-1"
              style={{ backgroundColor: "hsl(45 93% 47% / 0.08)", border: "1px solid hsl(45 93% 47% / 0.25)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" style={{ color: "hsl(45 93% 47%)" }} />
                  <span className="text-sm font-medium text-foreground">Compra mínima</span>
                </div>
                <span className="text-base font-bold text-foreground">
                  R$ {Number(oferta.min_purchase).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground pl-6">
                O crédito só pode ser utilizado em compras a partir deste valor
              </p>
            </div>
          )}

          {/* Balance */}
          <div
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: canAfford ? "hsl(142 71% 45% / 0.08)" : "hsl(0 72% 51% / 0.08)",
              border: `1px solid ${canAfford ? "hsl(142 71% 45% / 0.2)" : "hsl(0 72% 51% / 0.2)"}`,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm">Seu saldo</span>
              <span className="text-base font-bold">{formatPoints(pointsBalance)} pontos</span>
            </div>
            {!canAfford && (
              <p className="text-xs mt-1" style={{ color: "hsl(0 72% 51%)" }}>
                Você precisa de mais {formatPoints(oferta.pointsCost - pointsBalance)} pontos
              </p>
            )}
          </div>

          {/* CTA */}
          <Button
            className="w-full h-12 text-base font-bold rounded-2xl mt-2"
            disabled={!canAfford || loading}
            onClick={handleConfirm}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>Confirmar Resgate — {formatPoints(oferta.pointsCost)} pts</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
