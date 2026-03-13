import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScanLine, CheckCircle2, XCircle, Loader2, KeyRound, Clock, User, CreditCard, DollarSign, ChevronDown, ChevronUp, Ticket } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  return `***.***.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
};

export default function StoreRedeemTab({ store }: { store: any }) {
  const qc = useQueryClient();
  const [pin, setPin] = useState("");
  const [cpf, setCpf] = useState("");
  const [purchaseValue, setPurchaseValue] = useState("");
  const [result, setResult] = useState<RedemptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);

  // ─── Fetch pending redemptions for this store ───
  const { data: pendingRedemptions = [], isLoading: loadingPending } = useQuery({
    queryKey: ["store-pending-redemptions", store.id],
    queryFn: async () => {
      const { data: offers } = await supabase
        .from("offers")
        .select("id")
        .eq("store_id", store.id);
      const offerIds = (offers || []).map((o: any) => o.id);
      if (!offerIds.length) return [];

      const { data, error } = await supabase
        .from("redemptions")
        .select("*, offers!inner(title, value_rescue, min_purchase, store_id, coupon_type), customers(name), branches(name)")
        .in("offer_id", offerIds)
        .in("status", ["PENDING", "USED"])
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []).map((r: any) => ({
        id: r.id,
        token: r.token,
        status: r.status,
        created_at: r.created_at,
        used_at: r.used_at,
        expires_at: r.expires_at,
        customer_cpf: r.customer_cpf || "",
        offer_title: r.offers?.title || "",
        customer_name: r.customers?.name || "—",
        branch_name: r.branches?.name || "",
        value_rescue: Number(r.offers?.value_rescue || 0),
        min_purchase: Number(r.offers?.min_purchase || 0),
        coupon_type: r.offers?.coupon_type || "STORE",
        purchase_value: r.purchase_value,
        credit_value_applied: r.credit_value_applied,
      }));
    },
    refetchInterval: 15000, // auto-refresh every 15s
  });

  // ─── Realtime subscription for new redemptions ───
  useEffect(() => {
    const channel = supabase
      .channel("store-redemptions-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "redemptions" },
        () => {
          qc.invalidateQueries({ queryKey: ["store-pending-redemptions", store.id] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [store.id, qc]);

  const pending = pendingRedemptions.filter((r: any) => r.status === "PENDING");
  const used = pendingRedemptions.filter((r: any) => r.status === "USED");

  // ─── Manual PIN lookup ───
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
        .eq("offers.store_id", store.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("PIN + CPF inválidos, resgate já utilizado ou não pertence a esta loja");

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

  const canSearch = pin.length === 6 && cpf.replace(/\D/g, "").length === 11;

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Resgates</h1>
        <p className="text-sm text-muted-foreground">Veja resgates dos clientes e dê baixa</p>
      </div>

      {/* Pending redemptions list */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Ticket className="h-5 w-5 text-amber-600" />
            Aguardando Baixa
            {pending.length > 0 && (
              <Badge className="ml-auto bg-amber-100 text-amber-800 border-amber-300 text-xs">
                {pending.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loadingPending ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : pending.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum resgate pendente no momento
            </div>
          ) : (
            pending.map((r: any) => (
              <PendingRedemptionCard
                key={r.id}
                redemption={r}
                storeId={store.id}
                onConfirmed={() => qc.invalidateQueries({ queryKey: ["store-pending-redemptions", store.id] })}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Recently confirmed */}
      {used.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Baixas Recentes
              <Badge className="ml-auto bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">
                {used.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {used.slice(0, 10).map((r: any) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border p-3">
                <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{r.offer_title}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.customer_name} · {r.used_at ? format(new Date(r.used_at), "dd/MM HH:mm", { locale: ptBR }) : "—"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-emerald-700">R$ {Number(r.credit_value_applied || r.value_rescue).toFixed(2)}</p>
                  {r.purchase_value && (
                    <p className="text-[10px] text-muted-foreground">Compra: R$ {Number(r.purchase_value).toFixed(2)}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Manual PIN lookup - collapsible */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <button
            onClick={() => setShowManual(!showManual)}
            className="w-full flex items-center justify-between"
          >
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-5 w-5" /> Buscar por PIN + CPF
            </CardTitle>
            {showManual ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
        </CardHeader>
        {showManual && (
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

            {result && (
              <ConfirmRedemptionPanel
                result={result}
                purchaseValue={purchaseValue}
                setPurchaseValue={setPurchaseValue}
                onConfirmed={() => {
                  setResult(null); setPin(""); setCpf(""); setPurchaseValue(""); setError(null);
                  qc.invalidateQueries({ queryKey: ["store-pending-redemptions", store.id] });
                }}
              />
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

/* ─── Pending Redemption Card ─── */
const PendingRedemptionCard = React.memo(function PendingRedemptionCard({ redemption, storeId, onConfirmed }: { redemption: any; storeId: string; onConfirmed: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [purchaseValue, setPurchaseValue] = useState("");
  const [confirming, setConfirming] = useState(false);

  const isExpired = redemption.expires_at && new Date(redemption.expires_at) < new Date();
  const timeLeft = redemption.expires_at
    ? Math.max(0, Math.floor((new Date(redemption.expires_at).getTime() - Date.now()) / (1000 * 60)))
    : null;

  const handleConfirm = async () => {
    const pv = Number(purchaseValue);
    if (redemption.min_purchase > 0 && pv < redemption.min_purchase) {
      toast.error(`Compra mínima: R$ ${redemption.min_purchase.toFixed(2)}`);
      return;
    }
    setConfirming(true);
    try {
      const { error } = await supabase
        .from("redemptions")
        .update({
          status: "USED" as any,
          used_at: new Date().toISOString(),
          purchase_value: pv || null,
          credit_value_applied: redemption.value_rescue,
        } as any)
        .eq("id", redemption.id);
      if (error) throw error;
      toast.success("Resgate confirmado!");
      onConfirmed();
    } catch (err: any) {
      toast.error(err.message || "Erro ao confirmar");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div
      className={`rounded-xl border transition-all ${isExpired ? "opacity-50 border-destructive/30" : "border-amber-200 bg-amber-50/30 dark:bg-amber-950/10"}`}
    >
      <button
        onClick={() => !isExpired && setExpanded(!expanded)}
        className="w-full text-left p-3 flex items-center gap-3"
      >
        <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
          <Ticket className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{redemption.offer_title}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <User className="h-3 w-3" />
            <span className="truncate">{redemption.customer_name}</span>
            <span>·</span>
            <span className="font-mono">{maskCpf(redemption.customer_cpf)}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold">R$ {redemption.value_rescue.toFixed(2)}</p>
          {timeLeft !== null && !isExpired && (
            <p className="text-[10px] text-amber-600 flex items-center gap-0.5 justify-end">
              <Clock className="h-3 w-3" /> {timeLeft > 60 ? `${Math.floor(timeLeft / 60)}h${timeLeft % 60}m` : `${timeLeft}min`}
            </p>
          )}
          {isExpired && <p className="text-[10px] text-destructive font-semibold">EXPIRADO</p>}
        </div>
      </button>

      {expanded && !isExpired && (
        <div className="px-3 pb-3 space-y-3 border-t border-amber-200/50 pt-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Crédito:</span>
              <strong>R$ {redemption.value_rescue.toFixed(2)}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Compra mín.:</span>
              <strong>R$ {redemption.min_purchase.toFixed(2)}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">PIN:</span>
              <strong className="font-mono tracking-wider">{redemption.token}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Em:</span>
              <strong>{format(new Date(redemption.created_at), "dd/MM HH:mm", { locale: ptBR })}</strong>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Valor da Compra (R$)</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={purchaseValue}
              onChange={e => setPurchaseValue(e.target.value)}
              className="h-11"
              inputMode="decimal"
            />
          </div>

          <Button onClick={handleConfirm} disabled={confirming} className="w-full" size="lg">
            {confirming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Confirmar Baixa
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Confirm Panel for manual lookup ─── */
function ConfirmRedemptionPanel({
  result, purchaseValue, setPurchaseValue, onConfirmed,
}: {
  result: RedemptionResult;
  purchaseValue: string;
  setPurchaseValue: (v: string) => void;
  onConfirmed: () => void;
}) {
  const confirm = useMutation({
    mutationFn: async () => {
      const pv = Number(purchaseValue);
      if (result.min_purchase > 0 && pv < result.min_purchase) {
        throw new Error(`Compra mínima: R$ ${result.min_purchase.toFixed(2)}`);
      }
      const { error } = await supabase
        .from("redemptions")
        .update({
          status: "USED" as any,
          used_at: new Date().toISOString(),
          purchase_value: pv || null,
          credit_value_applied: result.value_rescue,
        } as any)
        .eq("id", result.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Resgate confirmado!");
      onConfirmed();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="rounded-2xl border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" /> Resgate Encontrado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">Oferta:</span> <strong>{result.offer_title}</strong></div>
          <div><span className="text-muted-foreground">Cliente:</span> <strong>{result.customer_name}</strong></div>
          <div><span className="text-muted-foreground">CPF:</span> <strong>{maskCpf(result.customer_cpf)}</strong></div>
          <div><span className="text-muted-foreground">Filial:</span> <strong>{result.branch_name}</strong></div>
          <div><span className="text-muted-foreground">Crédito:</span> <strong>R$ {result.value_rescue.toFixed(2)}</strong></div>
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
          Confirmar Resgate
        </Button>
      </CardContent>
    </Card>
  );
}
