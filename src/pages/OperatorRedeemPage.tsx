import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScanLine, CheckCircle2, XCircle, Loader2, KeyRound, User } from "lucide-react";
import { toast } from "sonner";


interface RedemptionResult {
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

const maskCpf = (cpf: string) => {
  if (!cpf || cpf.length < 11) return cpf || "—";
  return `${cpf.slice(0, 3)}.***.**${cpf.slice(9, 11)}-${cpf.slice(9)}`;
};

export default function OperatorRedeemPage() {
  const qc = useQueryClient();
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
        .select("*, offers(title, value_rescue, min_purchase), customers(name), branches(name)")
        .eq("token", pinInput)
        .eq("customer_cpf", cpfDigits)
        .eq("status", "PENDING")
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("PIN + CPF inválidos ou resgate já utilizado");

      // Anti-fraud: check PIN expiration
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        await supabase.from("redemptions").update({ status: "EXPIRED" as any }).eq("id", data.id);
        throw new Error("PIN expirado. Este resgate não pode mais ser utilizado.");
      }

      return {
        id: data.id,
        token: data.token,
        status: data.status,
        offer_title: (data.offers as any)?.title || "",
        customer_name: (data.customers as any)?.name || "",
        customer_cpf: (data as any).customer_cpf || "",
        branch_name: (data.branches as any)?.name || "",
        value_rescue: Number((data.offers as any)?.value_rescue || 0),
        min_purchase: Number((data.offers as any)?.min_purchase || 0),
        expires_at: data.expires_at,
      } as RedemptionResult;
    },
    onSuccess: (data) => { setResult(data); setError(null); },
    onError: (e: Error) => { setResult(null); setError(e.message); },
  });

  const confirm = useMutation({
    mutationFn: async () => {
      if (!result) throw new Error("Nenhum resgate selecionado");
      const pv = Number(purchaseValue);
      if (result.min_purchase > 0 && pv < result.min_purchase) {
        throw new Error(`Compra mínima: R$ ${result.min_purchase.toFixed(2)}`);
      }
      const { error } = await supabase
        .from("redemptions")
        .update({ status: "USED" as any, used_at: new Date().toISOString(), purchase_value: pv || null })
        .eq("id", result.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Resgate confirmado!");
      setResult(null); setPin(""); setCpf(""); setPurchaseValue(""); setError(null);
      qc.invalidateQueries({ queryKey: ["redemptions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSearch = pin.length === 6 && cpf.replace(/\D/g, "").length === 11;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Validar Resgate</h2>
        <p className="text-muted-foreground">Insira o PIN de 6 dígitos + CPF do cliente</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Buscar por PIN + CPF
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">PIN (6 dígitos)</Label>
            <Input
              placeholder="000000"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={e => e.key === "Enter" && canSearch && lookup.mutate({ pinInput: pin, cpfInput: cpf })}
              className="font-mono text-2xl tracking-[0.3em] text-center h-14"
              maxLength={6}
              inputMode="numeric"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">CPF do cliente</Label>
            <Input
              placeholder="000.000.000-00"
              value={cpf}
              onChange={e => setCpf(formatCpf(e.target.value))}
              onKeyDown={e => e.key === "Enter" && canSearch && lookup.mutate({ pinInput: pin, cpfInput: cpf })}
              className="font-mono text-lg tracking-wider text-center h-12"
              maxLength={14}
              inputMode="numeric"
            />
          </div>
          <Button
            onClick={() => lookup.mutate({ pinInput: pin, cpfInput: cpf })}
            disabled={!canSearch || lookup.isPending}
            className="w-full h-12"
          >
            {lookup.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ScanLine className="h-4 w-4 mr-2" />}
            Buscar Resgate
          </Button>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <XCircle className="h-4 w-4" /> {error}
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Resgate Encontrado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Oferta:</span> <strong>{result.offer_title}</strong></div>
              <div><span className="text-muted-foreground">Cliente:</span> <strong>{result.customer_name}</strong></div>
              <div><span className="text-muted-foreground">CPF:</span> <strong>{maskCpf(result.customer_cpf)}</strong></div>
              <div><span className="text-muted-foreground">Filial:</span> <strong>{result.branch_name}</strong></div>
              <div><span className="text-muted-foreground">Valor Resgate:</span> <strong>R$ {result.value_rescue.toFixed(2)}</strong></div>
              <div><span className="text-muted-foreground">Compra Mín.:</span> <strong>R$ {result.min_purchase.toFixed(2)}</strong></div>
              <div><span className="text-muted-foreground">PIN:</span> <strong className="font-mono tracking-wider">{result.token}</strong></div>
              <div><span className="text-muted-foreground">Status:</span> <Badge variant="outline">{result.status}</Badge></div>
              {result.expires_at && (
                <div className="col-span-2"><span className="text-muted-foreground">Expira em:</span> <strong>{new Date(result.expires_at).toLocaleString("pt-BR")}</strong></div>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label>Valor da Compra (R$)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={purchaseValue}
                onChange={e => setPurchaseValue(e.target.value)}
              />
            </div>

            <Button onClick={() => confirm.mutate()} disabled={confirm.isPending} className="w-full" size="lg">
              {confirm.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Confirmar Resgate (USED)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
