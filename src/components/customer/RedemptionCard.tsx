import React from "react";
import { Store, Info, DollarSign, CreditCard, Clock, AlertTriangle, MapPin, Phone, Globe, QrCode } from "lucide-react";
import type { RedemptionWithOffer } from "@/types/customer";
import { DetailInfoRow } from "./DetailInfoRow";
import { CancelRedemptionButton } from "./CancelRedemptionButton";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING: { label: "EMITIDO", className: "bg-warning/15 text-warning" },
  USED: { label: "USADO", className: "bg-success/15 text-success" },
  EXPIRED: { label: "EXPIRADO", className: "bg-destructive/15 text-destructive" },
  CANCELED: { label: "ESTORNADO", className: "bg-warning/15 text-warning" },
};

interface RedemptionCardProps {
  r: RedemptionWithOffer;
  primary: string;
  fg: string;
  fontHeading: string;
  formatCurrency: (v: number) => string;
  formatDate: (d: string) => string;
  onViewDetail: () => void;
  onCanceled: () => void;
}

function RedemptionCardInner({
  r, primary, fg, fontHeading, formatCurrency, formatDate, onViewDetail, onCanceled,
}: RedemptionCardProps) {
  const offer = r.offers;
  const store = offer?.stores;
  const snapshot = (r.offer_snapshot_json || {}) as Record<string, unknown>;
  const badge = STATUS_BADGE[r.status] || STATUS_BADGE.PENDING;
  const isProduct = offer?.coupon_type === "PRODUCT" || snapshot?.coupon_type === "PRODUCT";
  const creditValue = r.credit_value_applied || offer?.value_rescue || (snapshot?.value_rescue as number) || 0;
  const purchaseValue = r.purchase_value || 0;
  const discountPct = Number(offer?.discount_percent || snapshot?.discount_percent) || 0;
  const minPurchase = Number(offer?.min_purchase || snapshot?.min_purchase) || 0;

  const typeBadge = isProduct
    ? { label: "PRODUTO", className: "bg-primary/15 text-primary" }
    : { label: "LOJA", className: "bg-warning/15 text-warning" };

  const hoursSinceCreation = (Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60);
  const canCancel = r.status === "PENDING" && hoursSinceCreation <= 24;

  const expiryDays = r.expires_at
    ? Math.max(0, Math.ceil((new Date(r.expires_at).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)))
    : 30;

  return (
    <div className="rounded-2xl overflow-hidden bg-card" style={{ boxShadow: "0 2px 12px hsl(var(--foreground) / 0.06)" }}>
      {/* Card header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-border/50">
        <div>
          <span className="text-[10px] font-bold tracking-wider block text-muted-foreground">RESGATE</span>
          <span className="text-xs font-mono font-semibold" style={{ color: fg }}>
            #PED{r.id.replace(/-/g, "").slice(0, 14).toUpperCase()}
          </span>
        </div>
        <span
          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
          style={{ backgroundColor: badge.bg, color: badge.color }}
        >
          {badge.label}
        </span>
      </div>

      {/* Store info + type badge */}
      <div className="px-4 py-3 flex items-center gap-3">
        {store?.logo_url ? (
          <img src={store.logo_url} alt={store.name} className="h-11 w-11 rounded-xl object-cover" />
        ) : (
          <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primary}15` }}>
            <Store className="h-5 w-5" style={{ color: primary }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate" style={{ color: fg }}>{store?.name || "Loja"}</p>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold flex-shrink-0"
              style={{ backgroundColor: typeBadge.bg, color: typeBadge.color }}
            >
              {typeBadge.label}
            </span>
          </div>
          {isProduct && purchaseValue > 0 ? (
            <p className="text-xs mt-0.5 text-muted-foreground">{formatCurrency(purchaseValue)}</p>
          ) : !isProduct && creditValue > 0 ? (
            <p className="text-xs mt-0.5 text-muted-foreground">
              Vale Resgate {formatCurrency(creditValue)}
              {minPurchase > 0 && <span> · Compra mín. {formatCurrency(minPurchase)}</span>}
            </p>
          ) : null}
        </div>
      </div>

      {/* Minimum purchase highlight banner */}
      {minPurchase > 0 && (
        <div className="mx-4 mb-2">
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5"
            style={{ backgroundColor: `${primary}12`, border: `1.5px solid ${primary}30` }}
          >
            <DollarSign className="h-5 w-5 flex-shrink-0" style={{ color: primary }} />
            <div className="flex-1">
              <p className="text-xs font-bold" style={{ color: primary }}>Compra mínima obrigatória</p>
              <p className="text-sm font-extrabold" style={{ color: fg }}>{formatCurrency(minPurchase)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Details section */}
      <div className="px-4 pb-3">
        <div
          className="rounded-xl p-3 space-y-2 text-xs"
          style={{ border: `1.5px solid ${primary}25`, backgroundColor: `${primary}04` }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Info className="h-3.5 w-3.5" style={{ color: primary }} />
            <span className="text-xs font-bold" style={{ color: primary }}>
              {isProduct ? "Detalhes do Produto" : "Detalhes do Cupom"}
            </span>
          </div>

          {isProduct && purchaseValue > 0 && (
            <DetailInfoRow icon={<DollarSign className="h-3.5 w-3.5" style={{ color: primary }} />} primary={primary}>
              Valor do produto: <strong>{formatCurrency(purchaseValue)}</strong>
            </DetailInfoRow>
          )}

          {isProduct && discountPct > 0 ? (
            <DetailInfoRow icon={<CreditCard className="h-3.5 w-3.5" style={{ color: primary }} />} primary={primary}>
              Crédito: <strong>{discountPct}%</strong> = {formatCurrency(creditValue)}
            </DetailInfoRow>
          ) : !isProduct && creditValue > 0 ? (
            <DetailInfoRow icon={<CreditCard className="h-3.5 w-3.5" style={{ color: primary }} />} primary={primary}>
              Vale Resgate: <strong>{formatCurrency(creditValue)}</strong>
              {minPurchase > 0 && <> · Compra mínima de <strong>{formatCurrency(minPurchase)}</strong></>}
            </DetailInfoRow>
          ) : null}

          {isProduct && minPurchase > 0 && (
            <DetailInfoRow icon={<DollarSign className="h-3.5 w-3.5" style={{ color: primary }} />} primary={primary}>
              Compra mínima: <strong>{formatCurrency(minPurchase)}</strong>
            </DetailInfoRow>
          )}

          <DetailInfoRow icon={<Clock className="h-3.5 w-3.5" style={{ color: primary }} />} primary={primary}>
            Validade do crédito: <strong>{expiryDays} dias</strong> após o resgate
          </DetailInfoRow>

          {(offer?.is_cumulative === false || snapshot?.is_cumulative === false) && (
            <DetailInfoRow icon={<AlertTriangle className="h-3.5 w-3.5" style={{ color: primary }} />} primary={primary}>
              Oferta <strong>não cumulativa</strong> com outras promoções
            </DetailInfoRow>
          )}

          {store?.address && (
            <DetailInfoRow icon={<MapPin className="h-3.5 w-3.5" style={{ color: primary }} />} primary={primary}>
              Resgate via: {store.address}
            </DetailInfoRow>
          )}

          {store?.whatsapp && (
            <DetailInfoRow icon={<Phone className="h-3.5 w-3.5" style={{ color: primary }} />} primary={primary}>
              WhatsApp: {store.whatsapp}
            </DetailInfoRow>
          )}

          {store?.site_url && (
            <DetailInfoRow icon={<Globe className="h-3.5 w-3.5" style={{ color: primary }} />} primary={primary}>
              Site: {store.site_url}
            </DetailInfoRow>
          )}
        </div>
      </div>

      {/* Credit + dates */}
      <div className="px-4 py-3 space-y-1 border-t border-border/50">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[11px] font-semibold block text-muted-foreground">
              CRÉDITO DO {isProduct ? "PRODUTO" : "CUPOM"}
            </span>
            {!isProduct && minPurchase > 0 && (
              <span className="text-[10px] text-muted-foreground">
                Crédito condicionado à compra mínima de {formatCurrency(minPurchase)}
              </span>
            )}
          </div>
          <span className="text-lg font-bold" style={{ color: primary, fontFamily: fontHeading }}>
            {formatCurrency(creditValue)}
          </span>
        </div>
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>Resgate:</span>
          <span>{formatDate(r.created_at)}</span>
        </div>
        {r.expires_at && (
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Expira:</span>
            <span style={{ color: r.status === "EXPIRED" ? "#DC2626" : primary }}>
              {formatDate(r.expires_at)}
            </span>
          </div>
        )}
      </div>

      {/* QR / PIN button + Estorno */}
      {r.status === "PENDING" && (
        <div className="px-4 pb-4 space-y-2">
          <button
            onClick={onViewDetail}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-transform active:scale-[0.98]"
            style={{ backgroundColor: "#FBBF24", color: "#1F2937" }}
          >
            <QrCode className="h-5 w-5" />
            VER QR CODE E PIN
          </button>
          {canCancel && (
            <CancelRedemptionButton redemptionId={r.id} token={r.token} onCanceled={onCanceled} fg={fg} />
          )}
        </div>
      )}
    </div>
  );
}

export const RedemptionCard = React.memo(RedemptionCardInner);
