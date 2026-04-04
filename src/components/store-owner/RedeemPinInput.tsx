/**
 * Manual PIN + CPF lookup form for store owner redemption.
 */
import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScanLine, CheckCircle2, XCircle, KeyRound, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useRedeemMutation } from "@/hooks/useRedeemMutation";

export interface RedemptionResult {
  id: string;
  token: string;
  status: string;
  offer_title: string;
  customer_name: string;
  customer_cpf: string;
  branch_name: string;
  value_rescue: number;
  min_purchase: number;
  expires_at: string | null;
}

const formatCpf = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

export const maskCpf = (cpf: string) => {
  if (!cpf || cpf.length < 11) return cpf || "—";
  return `***.***.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
};

interface RedeemPinInputProps {
  storeId: string;
  onConfirmed: () => void;
}

export default function RedeemPinInput({ storeId, onConfirmed }: RedeemPinInputProps) {
  const [showManual, setShowManual] = useState(false);
  const [pin, setPin] = useState("");
  const [cpf, setCpf] = useState("");
  const [purchaseValue, setPurchaseValue] = useState("");
  const [result, setResult] = useState<RedemptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lookup = useMutation({
    mutationFn: async ({ pinInput, cpfInput }: { pinInput: string; cpfInput: string }) => {
      const cpfDigits = cpfInput.replace(/\D/g, "");
      if (pinInput.length !== 6) throw new Error("PIN deve ter 6 dígitos");
      if (cpfDigits.length !== 11) throw new Error("CPF deve ter 11 dígitos");

      const { data, error } = await supabase
        .from("redemptions")
        .select("*, offers!inner(title, value_rescue, min_purchase, store_id), customers(name), branches(name)")
        .eq("token", pinInput)
        .eq("customer_cpf", cpfDigits)
        .eq("status", "PENDING")
        .eq("offers.store_id", storeId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("PIN + CPF inválidos, resgate já utilizado ou não pertence a esta loja");

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        await supabase.from("redemptions").update({ status: "EXPIRED" as string } as Record<string, unknown>).eq("id", data.id);
        throw new Error("PIN expirado. Este resgate não pode mais ser utilizado.");
      }

      const offers = data.offers as { title?: string; value_rescue?: number; min_purchase?: number } | null;
      const customers = data.customers as { name?: string } | null;
      const branches = data.branches as { name?: string } | null;

      return {
        id: data.id,
        token: data.token,
        status: data.status,
        offer_title: offers?.title || "",
        customer_name: customers?.name || "",
        customer_cpf: data.customer_cpf || "",
        branch_name: branches?.name || "",
        value_rescue: Number(offers?.value_rescue || 0),
        min_purchase: Number(offers?.min_purchase || 0),
        expires_at: data.expires_at,
      } as RedemptionResult;
    },
    onSuccess: (data) => { setResult(data); setError(null); },
    onError: (e: Error) => { setResult(null); setError(e.message); },
  });

  const confirmMutation = useRedeemMutation(() => {
    setResult(null); setPin(""); setCpf(""); setPurchaseValue(""); setError(null);
    onConfirmed();
  });

  const canSearch = pin.length === 6 && cpf.replace(/\D/g, "").length === 11;

  // OTP-style visual boxes for PIN
  const pinDigits = pin.padEnd(6, " ").split("");

  return (
    <Card className="rounded-2xl border-0 shadow-sm kpi-card-gradient">
      <CardHeader className="pb-2">
        <button
          onClick={() => setShowManual(!showManual)}
          className="w-full flex items-center justify-between"
        >
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg kpi-icon-violet flex items-center justify-center text-white">
              <KeyRound className="h-4 w-4" />
            </div>
            Buscar por PIN + CPF
          </CardTitle>
          {showManual ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
      </CardHeader>
      {showManual && (
        <CardContent className="space-y-4 animate-fade-in">
          {/* OTP-style PIN input */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-2 block">PIN (6 dígitos)</Label>
            <div className="relative">
              <div className="flex gap-2 justify-center mb-1">
                {pinDigits.map((d, i) => (
                  <div
                    key={i}
                    className={`h-12 w-10 rounded-xl border-2 flex items-center justify-center text-xl font-mono font-bold transition-all ${
                      d.trim()
                        ? "border-primary/40 bg-primary/5 text-foreground"
                        : i === pin.length
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                          : "border-border/50 bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    {d.trim() || ""}
                  </div>
                ))}
              </div>
              <Input
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={e => e.key === "Enter" && canSearch && lookup.mutate({ pinInput: pin, cpfInput: cpf })}
                className="absolute inset-0 opacity-0 h-12"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </div>
          </div>

          <div>
            <Label className="text-[10px] text-muted-foreground mb-1.5 block">CPF do cliente</Label>
            <Input
              placeholder="000.000.000-00"
              value={cpf}
              onChange={e => setCpf(formatCpf(e.target.value))}
              onKeyDown={e => e.key === "Enter" && canSearch && lookup.mutate({ pinInput: pin, cpfInput: cpf })}
              className="font-mono text-lg tracking-wider text-center h-12 rounded-xl"
              maxLength={14}
              inputMode="numeric"
            />
          </div>

          <LoadingButton
            onClick={() => lookup.mutate({ pinInput: pin, cpfInput: cpf })}
            disabled={!canSearch}
            isLoading={lookup.isPending}
            loadingText="Buscando..."
            className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <ScanLine className="h-4 w-4 mr-2" />
            Buscar Resgate
          </LoadingButton>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/5 rounded-xl p-3">
              <XCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {result && (
            <Card className="rounded-2xl border-0 shadow-md glow-primary bg-gradient-to-br from-primary/5 to-transparent animate-scale-in">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg kpi-icon-blue flex items-center justify-center text-white">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  Resgate Encontrado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    { label: "Oferta", value: result.offer_title },
                    { label: "Cliente", value: result.customer_name },
                    { label: "CPF", value: maskCpf(result.customer_cpf) },
                    { label: "Filial", value: result.branch_name },
                    { label: "Crédito", value: `R$ ${result.value_rescue.toFixed(2)}` },
                    { label: "Compra Mín.", value: `R$ ${result.min_purchase.toFixed(2)}` },
                    { label: "PIN", value: result.token, mono: true },
                  ].map(item => (
                    <div key={item.label} className="bg-background/60 rounded-lg p-2.5">
                      <span className="text-[10px] text-muted-foreground block">{item.label}</span>
                      <strong className={`text-xs ${item.mono ? "font-mono tracking-wider" : ""}`}>{item.value}</strong>
                    </div>
                  ))}
                  <div className="bg-background/60 rounded-lg p-2.5">
                    <span className="text-[10px] text-muted-foreground block">Status</span>
                    <Badge variant="outline" className="text-[10px] mt-0.5 rounded-full">{result.status}</Badge>
                  </div>
                  {result.expires_at && (
                    <div className="col-span-2 bg-background/60 rounded-lg p-2.5">
                      <span className="text-[10px] text-muted-foreground block">Expira em</span>
                      <strong className="text-xs">{new Date(result.expires_at).toLocaleString("pt-BR")}</strong>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-border/30">
                  <Label className="text-xs">Valor da Compra (R$)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={purchaseValue}
                    onChange={e => setPurchaseValue(e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <LoadingButton
                  onClick={() => confirmMutation.mutate({
                    redemptionId: result.id,
                    purchaseValue: Number(purchaseValue) || null,
                    creditValueApplied: result.value_rescue,
                    minPurchase: result.min_purchase,
                  })}
                  isLoading={confirmMutation.isPending}
                  loadingText="Resgatando..."
                  className="w-full rounded-xl bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70 text-success-foreground"
                  size="lg"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirmar Resgate
                </LoadingButton>
              </CardContent>
            </Card>
          )}
        </CardContent>
      )}
    </Card>
  );
}
