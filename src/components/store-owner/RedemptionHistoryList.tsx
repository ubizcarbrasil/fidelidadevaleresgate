/**
 * Lists pending and recently-used redemptions for a store owner.
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, Ticket, Clock, User, CreditCard, DollarSign, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRedeemMutation } from "@/hooks/useRedeemMutation";
import { maskCpf } from "./RedeemPinInput";

export interface PendingRedemption {
  id: string;
  token: string;
  status: string;
  created_at: string;
  used_at: string | null;
  expires_at: string | null;
  customer_cpf: string;
  offer_title: string;
  customer_name: string;
  branch_name: string;
  value_rescue: number;
  min_purchase: number;
  coupon_type: string;
  purchase_value: number | null;
  credit_value_applied: number | null;
}

interface RedemptionHistoryListProps {
  redemptions: PendingRedemption[];
  loading: boolean;
  storeId: string;
  onRefresh: () => void;
  hasMore: boolean;
  onLoadMore: () => void;
  loadingMore: boolean;
}

export default function RedemptionHistoryList({
  redemptions, loading, storeId, onRefresh, hasMore, onLoadMore, loadingMore,
}: RedemptionHistoryListProps) {
  const pending = redemptions.filter(r => r.status === "PENDING");
  const used = redemptions.filter(r => r.status === "USED");

  return (
    <>
      {/* Pending */}
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
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : pending.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum resgate pendente no momento
            </div>
          ) : (
            pending.map(r => (
              <PendingRedemptionCard key={r.id} redemption={r} onConfirmed={onRefresh} />
            ))
          )}
        </CardContent>
      </Card>

      {/* Used */}
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
            {used.slice(0, 10).map(r => (
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

      {/* Load more */}
      {hasMore && (
        <Button variant="outline" onClick={onLoadMore} disabled={loadingMore} className="w-full rounded-xl">
          {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Carregar mais
        </Button>
      )}
    </>
  );
}

/* ─── Pending Redemption Card ─── */
const PendingRedemptionCard = React.memo(function PendingRedemptionCard({
  redemption, onConfirmed,
}: {
  redemption: PendingRedemption;
  onConfirmed: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [purchaseValue, setPurchaseValue] = useState("");

  const redeemMutation = useRedeemMutation(onConfirmed);

  const isExpired = redemption.expires_at && new Date(redemption.expires_at) < new Date();
  const timeLeft = redemption.expires_at
    ? Math.max(0, Math.floor((new Date(redemption.expires_at).getTime() - Date.now()) / (1000 * 60)))
    : null;

  const handleConfirm = () => {
    redeemMutation.mutate({
      redemptionId: redemption.id,
      purchaseValue: Number(purchaseValue) || null,
      creditValueApplied: redemption.value_rescue,
      minPurchase: redemption.min_purchase,
    });
  };

  return (
    <div className={`rounded-xl border transition-all ${isExpired ? "opacity-50 border-destructive/30" : "border-amber-200 bg-amber-50/30 dark:bg-amber-950/10"}`}>
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

          <Button onClick={handleConfirm} disabled={redeemMutation.isPending} className="w-full" size="lg">
            {redeemMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Confirmar Baixa
          </Button>
        </div>
      )}
    </div>
  );
});
