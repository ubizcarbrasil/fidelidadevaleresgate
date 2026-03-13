import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { recordGanhaGanhaBillingEvent } from "@/lib/ganhaGanhaBilling";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Coins, Search, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function EarnPointsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { currentBrandId, currentBranchId, isRootAdmin } = useBrandGuard();

  const [storeId, setStoreId] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [purchaseValue, setPurchaseValue] = useState("");
  const [receiptCode, setReceiptCode] = useState("");
  const [success, setSuccess] = useState<{ points: number; money: number; newBalance: number } | null>(null);

  // Fetch stores for the current scope
  const { data: stores } = useQuery({
    queryKey: ["stores-earn", currentBrandId, currentBranchId],
    queryFn: async () => {
      let q = supabase.from("stores").select("id, name, branch_id").eq("is_active", true);
      if (currentBranchId) q = q.eq("branch_id", currentBranchId);
      else if (currentBrandId) q = q.eq("brand_id", currentBrandId);
      const { data, error } = await q.order("name");
      if (error) throw error;
      return data;
    },
  });

  // Search customers
  const { data: customers } = useQuery({
    queryKey: ["customers-search", phoneSearch, currentBrandId],
    queryFn: async () => {
      if (!phoneSearch || phoneSearch.length < 3) return [];
      let q = supabase.from("customers").select("id, name, phone, cpf, points_balance, money_balance, branch_id");
      if (currentBrandId) q = q.eq("brand_id", currentBrandId);
      q = q.or(`phone.ilike.%${phoneSearch}%,name.ilike.%${phoneSearch}%,cpf.ilike.%${phoneSearch}%`).limit(10);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: phoneSearch.length >= 3,
  });

  const selectedCustomer = customers?.find(c => c.id === selectedCustomerId);

  // Fetch active rule for the selected store's branch
  const selectedStore = stores?.find(s => s.id === storeId);
  const { data: rule } = useQuery({
    queryKey: ["points-rule-active", currentBrandId, selectedStore?.branch_id],
    queryFn: async () => {
      if (!currentBrandId) return null;
      let q = supabase.from("points_rules").select("*").eq("brand_id", currentBrandId).eq("is_active", true);
      if (selectedStore?.branch_id) {
        q = q.or(`branch_id.eq.${selectedStore.branch_id},branch_id.is.null`);
      }
      const { data, error } = await q.order("branch_id", { ascending: false, nullsFirst: false }).limit(1);
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!currentBrandId && !!storeId,
  });

  // Fetch store-specific custom rule if allowed
  const { data: storeRule } = useQuery({
    queryKey: ["store-rule-active", storeId, rule?.allow_store_custom_rule],
    queryFn: async () => {
      if (!storeId || !rule?.allow_store_custom_rule) return null;
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("store_points_rules")
        .select("*")
        .eq("store_id", storeId)
        .eq("status", "ACTIVE")
        .eq("is_active", true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!storeId && !!rule?.allow_store_custom_rule,
  });

  // Calculate effective points_per_real
  const effectivePointsPerReal = useMemo(() => {
    if (!rule) return 0;
    if (storeRule && rule.allow_store_custom_rule) {
      const clamped = Math.min(
        Math.max(Number(storeRule.points_per_real), Number(rule.store_points_per_real_min)),
        Number(rule.store_points_per_real_max)
      );
      return clamped;
    }
    return Number(rule.points_per_real);
  }, [rule, storeRule]);

  const usingCustomRule = !!storeRule && !!rule?.allow_store_custom_rule;

  // Calculate preview
  const preview = useMemo(() => {
    if (!rule || !purchaseValue) return null;
    const pv = parseFloat(purchaseValue);
    if (isNaN(pv) || pv <= 0) return null;
    if (pv < Number(rule.min_purchase_to_earn)) return { error: `Compra mínima: R$ ${Number(rule.min_purchase_to_earn).toFixed(2)}` };

    let points = 0;
    if (rule.rule_type === "PER_REAL") {
      points = Math.floor(pv * effectivePointsPerReal);
    } else if (rule.rule_type === "FIXED") {
      points = Number(rule.points_per_real);
    }
    points = Math.min(points, rule.max_points_per_purchase);
    const money = points * Number(rule.money_per_point);
    return { points, money, error: null };
  }, [rule, purchaseValue, effectivePointsPerReal]);

  const earn = useMutation({
    mutationFn: async () => {
      if (!preview || preview.error || !selectedCustomerId || !storeId || !user) throw new Error("Dados inválidos");
      const branchId = selectedStore?.branch_id || currentBranchId;
      if (!branchId || !currentBrandId) throw new Error("Contexto inválido");

      // Anti-fraud: check daily limits
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Customer daily limit
      const { data: custToday } = await supabase
        .from("earning_events")
        .select("points_earned")
        .eq("customer_id", selectedCustomerId)
        .eq("status", "APPROVED")
        .gte("created_at", todayISO);
      const custDayTotal = (custToday || []).reduce((s: number, e: any) => s + e.points_earned, 0);
      if (rule && custDayTotal + preview.points > rule.max_points_per_customer_per_day) {
        throw new Error(`Limite diário do cliente atingido (${rule.max_points_per_customer_per_day} pontos)`);
      }

      // Store daily limit
      const { data: storeToday } = await supabase
        .from("earning_events")
        .select("points_earned")
        .eq("store_id", storeId)
        .eq("status", "APPROVED")
        .gte("created_at", todayISO);
      const storeDayTotal = (storeToday || []).reduce((s: number, e: any) => s + e.points_earned, 0);
      if (rule && storeDayTotal + preview.points > rule.max_points_per_store_per_day) {
        throw new Error(`Limite diário do parceiro atingido (${rule.max_points_per_store_per_day} pontos)`);
      }

      // Receipt uniqueness check
      if (rule?.require_receipt_code) {
        if (!receiptCode.trim()) throw new Error("Código do comprovante obrigatório");
        const { data: existing } = await supabase
          .from("earning_events")
          .select("id")
          .eq("store_id", storeId)
          .eq("receipt_code", receiptCode.trim())
          .limit(1);
        if (existing && existing.length > 0) throw new Error("Comprovante já utilizado neste parceiro");
      }

      // Build rule snapshot for historical integrity
      const ruleSnapshot = {
        points_per_real: effectivePointsPerReal,
        rule_type: rule!.rule_type,
        money_per_point: rule!.money_per_point,
        min_purchase_to_earn: rule!.min_purchase_to_earn,
        max_points_per_purchase: rule!.max_points_per_purchase,
        max_points_per_customer_per_day: rule!.max_points_per_customer_per_day,
        max_points_per_store_per_day: rule!.max_points_per_store_per_day,
        using_custom_store_rule: usingCustomRule,
      };

      // Insert earning_event
      const { data: event, error: eventErr } = await supabase.from("earning_events").insert({
        brand_id: currentBrandId,
        branch_id: branchId,
        store_id: storeId,
        customer_id: selectedCustomerId,
        purchase_value: parseFloat(purchaseValue),
        receipt_code: receiptCode.trim() || null,
        points_earned: preview!.points ?? 0,
        money_earned: preview!.money ?? 0,
        source: "PDV" as any,
        created_by_user_id: user.id,
        status: "APPROVED" as any,
        rule_snapshot_json: ruleSnapshot as any,
      }).select("id").single();
      if (eventErr) throw eventErr;

      // Insert ledger entry
      const { error: ledgerErr } = await supabase.from("points_ledger").insert({
        brand_id: currentBrandId,
        branch_id: branchId,
        customer_id: selectedCustomerId,
        entry_type: "CREDIT" as any,
        points_amount: preview!.points ?? 0,
        money_amount: preview!.money ?? 0,
        reason: `Compra no parceiro ${selectedStore?.name || ""}`,
        reference_type: "EARNING_EVENT" as any,
        reference_id: event.id,
        created_by_user_id: user.id,
      });
      if (ledgerErr) throw ledgerErr;

      // Update customer balance
      const newPoints = (selectedCustomer?.points_balance || 0) + (preview!.points ?? 0);
      const newMoney = (selectedCustomer?.money_balance || 0) + (preview!.money ?? 0);
      const { error: custErr } = await supabase
        .from("customers")
        .update({ points_balance: newPoints, money_balance: newMoney })
        .eq("id", selectedCustomerId);
      if (custErr) throw custErr;

      // Record Ganha-Ganha billing event (fire-and-forget)
      recordGanhaGanhaBillingEvent({
        brandId: currentBrandId,
        storeId,
        eventType: "EARN",
        pointsAmount: preview!.points ?? 0,
        referenceId: event.id,
        referenceType: "EARNING_EVENT",
      });

      return { points: preview!.points ?? 0, money: preview!.money ?? 0, newBalance: newPoints };
    },
    onSuccess: (data) => {
      setSuccess(data);
      toast.success(`${data.points} pontos creditados!`);
      qc.invalidateQueries({ queryKey: ["customers-search"] });
      setPurchaseValue("");
      setReceiptCode("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reset = () => { setSuccess(null); setSelectedCustomerId(null); setPhoneSearch(""); setPurchaseValue(""); setReceiptCode(""); };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Pontuação Confirmada!</h2>
            <div className="space-y-2">
              <p className="text-lg">+{success.points} pontos <span className="text-muted-foreground">(R$ {success.money.toFixed(2)})</span></p>
              <p className="text-sm text-muted-foreground">Novo saldo: {success.newBalance} pontos</p>
            </div>
            <Button onClick={reset} className="w-full">Nova Pontuação</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Coins className="h-6 w-6" /> Pontuar Cliente</h2>
        <p className="text-muted-foreground">Registre pontos após uma compra</p>
      </div>

      {/* Step 1: Select store */}
      <Card>
        <CardHeader><CardTitle className="text-lg">1. Selecione o Parceiro</CardTitle></CardHeader>
        <CardContent>
          <Select value={storeId} onValueChange={setStoreId}>
            <SelectTrigger><SelectValue placeholder="Escolha o parceiro" /></SelectTrigger>
            <SelectContent>{stores?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Step 2: Find customer */}
      {storeId && (
        <Card>
          <CardHeader><CardTitle className="text-lg">2. Buscar Cliente</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Telefone ou nome do cliente..." value={phoneSearch} onChange={e => { setPhoneSearch(e.target.value); setSelectedCustomerId(null); }} className="pl-10" />
            </div>
            {customers && customers.length > 0 && !selectedCustomerId && (
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {customers.map(c => (
                  <button key={c.id} onClick={() => setSelectedCustomerId(c.id)} className="w-full p-3 text-left hover:bg-muted/50 flex justify-between items-center">
                    <div>
                      <span className="font-medium text-sm">{c.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{c.phone}</span>
                      {c.cpf && <span className="text-xs text-muted-foreground ml-2">CPF: {c.cpf}</span>}
                    </div>
                    <Badge variant="secondary">{c.points_balance} pts</Badge>
                  </button>
                ))}
              </div>
            )}
            {selectedCustomer && (
              <div className="p-4 bg-muted/30 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">{selectedCustomer.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{selectedCustomer.points_balance} pts</p>
                  <p className="text-xs text-muted-foreground">R$ {Number(selectedCustomer.money_balance).toFixed(2)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Purchase value */}
      {selectedCustomerId && rule && (
        <Card>
          <CardHeader><CardTitle className="text-lg">3. Valor da Compra</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" min="0" placeholder="0,00" value={purchaseValue} onChange={e => setPurchaseValue(e.target.value)} className="text-lg" />
            </div>
            {rule.require_receipt_code && (
              <div className="space-y-2">
                <Label>Código do Comprovante</Label>
                <Input value={receiptCode} onChange={e => setReceiptCode(e.target.value)} placeholder="Nº da nota/cupom" />
              </div>
            )}

            {preview && !preview.error && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-1">
                <p className="text-sm font-medium text-primary">Preview do ganho:</p>
                <p className="text-2xl font-bold">+{preview.points} pontos</p>
                <p className="text-sm text-muted-foreground">Equivalente a R$ {(preview.money ?? 0).toFixed(2)}</p>
                {usingCustomRule && (
                  <Badge variant="outline" className="mt-1">
                    Regra personalizada do parceiro ({effectivePointsPerReal} pts/R$)
                  </Badge>
                )}
              </div>
            )}

            {preview?.error && (
              <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">{preview.error}</p>
              </div>
            )}

            <Button onClick={() => earn.mutate()} disabled={!preview || !!preview.error || earn.isPending} className="w-full" size="lg">
              {earn.isPending ? "Processando..." : "Confirmar Pontuação"}
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedCustomerId && !rule && storeId && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p>Nenhuma regra de pontuação ativa para este parceiro/cidade.</p>
            <p className="text-sm">Configure uma regra em "Regras de Pontuação".</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
