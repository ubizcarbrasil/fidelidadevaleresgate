import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScanLine, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RedemptionResult {
  id: string;
  token: string;
  status: string;
  offer_title: string;
  customer_name: string;
  branch_name: string;
  value_rescue: number;
  min_purchase: number;
}

export default function OperatorRedeemPage() {
  const qc = useQueryClient();
  const [token, setToken] = useState("");
  const [purchaseValue, setPurchaseValue] = useState("");
  const [result, setResult] = useState<RedemptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lookup = useMutation({
    mutationFn: async (tokenInput: string) => {
      const { data, error } = await supabase
        .from("redemptions")
        .select("*, offers(title, value_rescue, min_purchase), customers(name), branches(name)")
        .eq("token", tokenInput)
        .eq("status", "PENDING")
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Token inválido ou já utilizado");

      return {
        id: data.id,
        token: data.token,
        status: data.status,
        offer_title: (data.offers as any)?.title || "",
        customer_name: (data.customers as any)?.name || "",
        branch_name: (data.branches as any)?.name || "",
        value_rescue: Number((data.offers as any)?.value_rescue || 0),
        min_purchase: Number((data.offers as any)?.min_purchase || 0),
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
      setResult(null); setToken(""); setPurchaseValue(""); setError(null);
      qc.invalidateQueries({ queryKey: ["redemptions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Validar Resgate</h2>
        <p className="text-muted-foreground">Insira o token ou escaneie o QR Code</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><ScanLine className="h-5 w-5" />Buscar Token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Cole o token aqui..."
              value={token}
              onChange={e => setToken(e.target.value)}
              onKeyDown={e => e.key === "Enter" && token && lookup.mutate(token)}
              className="font-mono"
            />
            <Button onClick={() => lookup.mutate(token)} disabled={!token || lookup.isPending}>
              {lookup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
            </Button>
          </div>

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
              <div><span className="text-muted-foreground">Filial:</span> <strong>{result.branch_name}</strong></div>
              <div><span className="text-muted-foreground">Valor Resgate:</span> <strong>R$ {result.value_rescue.toFixed(2)}</strong></div>
              <div><span className="text-muted-foreground">Compra Mín.:</span> <strong>R$ {result.min_purchase.toFixed(2)}</strong></div>
              <div><span className="text-muted-foreground">Status:</span> <Badge variant="outline">{result.status}</Badge></div>
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
