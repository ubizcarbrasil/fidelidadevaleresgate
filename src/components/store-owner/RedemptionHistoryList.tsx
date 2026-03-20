/**
 * Lists pending and recently-used redemptions for a store owner.
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, Ticket, Clock, User, CreditCard, DollarSign, KeyRound, Phone, CalendarClock } from "lucide-react";
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
  customer_phone: string;
  branch_name: string;
  value_rescue: number;
  min_purchase: number;
  coupon_type: string;
  offer_end_at: string | null;
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
  const expired = redemptions.filter(r => r.status === "EXPIRED");

  return (
    <>
      {/* ── Pending ── */}
      <Card className="rounded-2xl border-0 shadow-sm glow-amber bg-gradient-to-br from-warning/6 to-warning/2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg kpi-icon-amber flex items-center justify-center text-white">
              <Ticket className="h-4 w-4" />
            </div>
            <span>Aguardando Baixa</span>
            {pending.length > 0 && (
              <Badge className="ml-auto bg-warning/15 text-warning border-0 text-xs rounded-full">
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

      {/* ── Used ── */}
      {used.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-sm kpi-card-gradient">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg kpi-icon-green flex items-center justify-center text-white">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span>Baixas Recentes</span>
              <Badge className="ml-auto bg-success/15 text-success border-0 text-xs rounded-full">
                {used.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {used.slice(0, 10).map(r => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl bg-background/60 border border-border/30 p-3 hover-scale">
                <div className="h-9 w-9 rounded-xl kpi-icon-green flex items-center justify-center text-white shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{r.offer_title}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.customer_name}
                    {r.customer_phone
                      ? <> · <Phone className="inline h-3 w-3" /> {r.customer_phone}</>
                      : <> · <span className="italic text-muted-foreground/60">Tel. não informado</span></>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.used_at ? format(new Date(r.used_at), "dd/MM HH:mm", { locale: ptBR }) : "—"}
                    {r.offer_end_at
                      ? <> · Validade: {format(new Date(r.offer_end_at), "dd/MM/yyyy", { locale: ptBR })}</>
                      : <> · <span className="italic text-muted-foreground/60">Sem validade definida</span></>}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-success">R$ {Number(r.credit_value_applied || r.value_rescue).toFixed(2)}</p>
                  {r.purchase_value && (
                    <p className="text-[10px] text-muted-foreground">Compra: R$ {Number(r.purchase_value).toFixed(2)}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Expired ── */}
      {expired.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-sm bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-muted-foreground/20 flex items-center justify-center text-muted-foreground">
                <Clock className="h-4 w-4" />
              </div>
              <span>Expirados</span>
              <Badge className="ml-auto bg-muted-foreground/10 text-muted-foreground border-0 text-xs rounded-full">
                {expired.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {expired.slice(0, 10).map(r => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl bg-background/40 border border-border/20 p-3 opacity-60">
                <div className="h-9 w-9 rounded-xl bg-muted-foreground/15 flex items-center justify-center text-muted-foreground shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{r.offer_title}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.customer_name}
                    {r.customer_phone
                      ? <> · <Phone className="inline h-3 w-3" /> {r.customer_phone}</>
                      : <> · <span className="italic text-muted-foreground/60">Tel. não informado</span></>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Criado: {format(new Date(r.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    {r.offer_end_at
                      ? <> · Validade: {format(new Date(r.offer_end_at), "dd/MM/yyyy", { locale: ptBR })}</>
                      : <> · <span className="italic text-muted-foreground/60">Sem validade definida</span></>}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-muted-foreground">R$ {Number(r.value_rescue).toFixed(2)}</p>
                  <p className="text-[10px] text-destructive font-semibold">EXPIRADO</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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
    <div className={`rounded-xl transition-all ${
      isExpired
        ? "opacity-50 border border-destructive/30"
        : "border border-warning/20 bg-gradient-to-br from-warning/5 to-transparent glow-amber"
    }`}>
      <button
        onClick={() => !isExpired && setExpanded(!expanded)}
        className="w-full text-left p-3 flex items-center gap-3"
      >
        <div className="h-10 w-10 rounded-xl kpi-icon-amber flex items-center justify-center text-white shrink-0 shadow-sm">
          <Ticket className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{redemption.offer_title}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <User className="h-3 w-3" />
            <span className="truncate">{redemption.customer_name}</span>
            <span>·</span>
            <span className="font-mono">{maskCpf(redemption.customer_cpf)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <Phone className="h-3 w-3" />
            <span>{redemption.customer_phone || <span className="italic text-muted-foreground/60">Não informado</span>}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold">R$ {redemption.value_rescue.toFixed(2)}</p>
          {timeLeft !== null && !isExpired && (
            <p className="text-[10px] text-warning flex items-center gap-0.5 justify-end font-medium">
              <Clock className="h-3 w-3" /> {timeLeft > 60 ? `${Math.floor(timeLeft / 60)}h${timeLeft % 60}m` : `${timeLeft}min`}
            </p>
          )}
          {isExpired && <p className="text-[10px] text-destructive font-semibold">EXPIRADO</p>}
        </div>
      </button>

      {expanded && !isExpired && (
        <div className="px-3 pb-3 space-y-3 border-t border-warning/10 pt-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-background/60 rounded-lg p-2">
              <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Crédito:</span>
              <strong>R$ {redemption.value_rescue.toFixed(2)}</strong>
            </div>
            <div className="flex items-center gap-1.5 bg-background/60 rounded-lg p-2">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Mín.:</span>
              <strong>R$ {redemption.min_purchase.toFixed(2)}</strong>
            </div>
            <div className="flex items-center gap-1.5 bg-background/60 rounded-lg p-2">
              <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">PIN:</span>
              <strong className="font-mono tracking-wider">{redemption.token}</strong>
            </div>
            <div className="flex items-center gap-1.5 bg-background/60 rounded-lg p-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Em:</span>
              <strong>{format(new Date(redemption.created_at), "dd/MM HH:mm", { locale: ptBR })}</strong>
            </div>
            {redemption.offer_end_at && (
              <div className="flex items-center gap-1.5 bg-background/60 rounded-lg p-2 col-span-2">
                <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Validade da oferta:</span>
                <strong>{format(new Date(redemption.offer_end_at), "dd/MM/yyyy", { locale: ptBR })}</strong>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Valor da Compra (R$)</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={purchaseValue}
              onChange={e => setPurchaseValue(e.target.value)}
              className="h-11 rounded-xl"
              inputMode="decimal"
            />
          </div>

          <Button
            onClick={handleConfirm}
            disabled={redeemMutation.isPending}
            className="w-full rounded-xl bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70 text-success-foreground"
            size="lg"
          >
            {redeemMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Confirmar Baixa
          </Button>
        </div>
      )}
    </div>
  );
});
