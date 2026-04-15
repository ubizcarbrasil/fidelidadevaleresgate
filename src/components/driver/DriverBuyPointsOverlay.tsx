import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { ArrowLeft, Coins, Minus, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPoints } from "@/lib/formatPoints";
import { toast } from "sonner";

interface Props {
  brandId: string;
  branchId?: string;
  fontHeading?: string;
  onBack: () => void;
}

const QUICK_ADD = [1000, 5000, 10000, 50000];

export default function DriverBuyPointsOverlay({ brandId, branchId, fontHeading, onBack }: Props) {
  const { driver, refreshDriver } = useDriverSession();
  const [points, setPoints] = useState(1000);
  const [submitting, setSubmitting] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ["driver-points-purchase-config", brandId],
    queryFn: async () => {
      const { data } = await supabase
        .from("driver_points_purchase_config" as any)
        .select("*")
        .eq("brand_id", brandId)
        .eq("is_active", true)
        .maybeSingle();
      return data as any;
    },
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <header className="flex items-center gap-3 p-4">
          <button onClick={onBack}><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-lg font-bold" style={{ fontFamily: fontHeading }}>Comprar Pontos</h1>
        </header>
        <div className="flex-1 flex items-center justify-center px-6 text-center text-muted-foreground">
          A compra de pontos não está disponível no momento.
        </div>
      </div>
    );
  }

  const minPoints = config.min_points || 1000;
  const maxPoints = config.max_points || 300000;
  const priceCents = config.price_per_thousand_cents || 7000;
  const totalCents = Math.round((points / 1000) * priceCents);
  const totalBRL = (totalCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const adjustPoints = (delta: number) => {
    setPoints((p) => Math.max(minPoints, Math.min(maxPoints, p + delta)));
  };

  const handleSubmit = async () => {
    if (!driver) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("driver_points_orders" as any).insert({
        brand_id: brandId,
        branch_id: branchId || null,
        customer_id: driver.id,
        points_amount: points,
        price_cents: totalCents,
        status: "PENDING",
      } as any);
      if (error) throw error;
      toast.success("Pedido enviado! Aguarde confirmação do empreendedor.");
      onBack();
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar pedido");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-auto">
      {/* Header */}
      <header className="flex items-center gap-3 p-4 border-b border-border">
        <button onClick={onBack} className="p-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold" style={{ fontFamily: fontHeading }}>Comprar Pontos</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 space-y-8">
        {/* Destinatário */}
        <div className="w-full max-w-sm text-center space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Pra quem?</p>
          <div
            className="rounded-xl p-3 flex items-center gap-3"
            style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
          >
            <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}>
              {driver?.name?.charAt(0) || "M"}
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{driver?.name?.replace(/\[MOTORISTA\]\s*/gi, "")}</p>
              <p className="text-xs text-muted-foreground">Pra mim</p>
            </div>
          </div>
        </div>

        {/* Seletor de pontos */}
        <div className="w-full max-w-sm text-center space-y-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Quantidade de pontos</p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => adjustPoints(-1000)}
              disabled={points <= minPoints}
              className="h-12 w-12 rounded-full flex items-center justify-center border border-border disabled:opacity-30 transition-colors hover:bg-muted"
            >
              <Minus className="h-5 w-5" />
            </button>
            <div className="text-center min-w-[140px]">
              <p className="text-4xl font-extrabold" style={{ fontFamily: fontHeading, color: "hsl(var(--primary))" }}>
                {formatPoints(points)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">pontos</p>
            </div>
            <button
              onClick={() => adjustPoints(1000)}
              disabled={points >= maxPoints}
              className="h-12 w-12 rounded-full flex items-center justify-center border border-border disabled:opacity-30 transition-colors hover:bg-muted"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Botões rápidos */}
          <div className="flex flex-wrap justify-center gap-2">
            {QUICK_ADD.map((q) => (
              <button
                key={q}
                onClick={() => setPoints(Math.min(maxPoints, Math.max(minPoints, q)))}
                className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                style={{
                  borderColor: points === q ? "hsl(var(--primary))" : "hsl(var(--border))",
                  backgroundColor: points === q ? "hsl(var(--primary) / 0.1)" : "transparent",
                  color: points === q ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                }}
              >
                +{formatPoints(q)}
              </button>
            ))}
          </div>
        </div>

        {/* Resumo do valor */}
        <div
          className="w-full max-w-sm rounded-xl p-4 text-center space-y-1"
          style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <p className="text-xs text-muted-foreground">Valor a pagar</p>
          <p className="text-2xl font-bold" style={{ fontFamily: fontHeading }}>{totalBRL}</p>
          <p className="text-[11px] text-muted-foreground">
            Milheiro: {(priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
      </div>

      {/* Botão fixo */}
      <div className="p-4 border-t border-border">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-12 text-base font-bold rounded-xl"
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Coins className="h-5 w-5 mr-2" />}
          Continuar compra — {totalBRL}
        </Button>
      </div>
    </div>
  );
}
