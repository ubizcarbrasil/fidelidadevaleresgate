import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCustomer } from "@/contexts/CustomerContext";
import { useBrand } from "@/contexts/BrandContext";
import { Search, MapPin, Phone, Globe, Clock, AlertTriangle, Store, QrCode, Info, DollarSign, CreditCard, ArrowLeft, RotateCcw } from "lucide-react";
import EmptyState from "@/components/customer/EmptyState";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import CustomerRedemptionDetailPage from "./CustomerRedemptionDetailPage";
import { toast } from "sonner";
function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

type StatusFilter = "ALL" | "PENDING" | "USED" | "EXPIRED";

const STATUS_LABELS: Record<StatusFilter, string> = {
  ALL: "Todos",
  PENDING: "Pendentes",
  USED: "Usados",
  EXPIRED: "Expirados",
};

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  PENDING: { label: "EMITIDO", bg: "#FEF3C7", color: "#92400E" },
  USED: { label: "USADO", bg: "#D1FAE5", color: "#065F46" },
  EXPIRED: { label: "EXPIRADO", bg: "#FEE2E2", color: "#991B1B" },
  CANCELED: { label: "ESTORNADO", bg: "#FEF3C7", color: "#D97706" },
};

export default function CustomerRedemptionsPage() {
  const { customer } = useCustomer();
  const { theme } = useBrand();
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [selectedRedemption, setSelectedRedemption] = useState<any>(null);
  const queryClient = useQueryClient();
  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  const { data: redemptions = [], isLoading } = useQuery({
    queryKey: ["customer-redemptions", customer?.id],
    queryFn: async () => {
      if (!customer?.id) return [];
      const { data, error } = await supabase
        .from("redemptions")
        .select(`
          *,
          offers(
            title, image_url, value_rescue, discount_percent,
            coupon_type, redemption_type, terms_text, min_purchase,
            start_at, end_at, is_cumulative, allowed_weekdays, allowed_hours,
            stores(name, logo_url, address, whatsapp, site_url, instagram)
          ),
          branches(name)
        `)
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!customer?.id,
  });

  const counts = useMemo(() => {
    const c = { ALL: 0, PENDING: 0, USED: 0, EXPIRED: 0 };
    redemptions.forEach((r: any) => {
      c.ALL++;
      if (r.status in c) c[r.status as keyof typeof c]++;
    });
    return c;
  }, [redemptions]);

  const filtered = useMemo(() => {
    let list = redemptions;
    if (filter !== "ALL") list = list.filter((r: any) => r.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r: any) =>
        r.token?.toLowerCase().includes(q) ||
        r.id?.toLowerCase().includes(q) ||
        r.offers?.title?.toLowerCase().includes(q) ||
        r.offers?.stores?.name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [redemptions, filter, search]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const formatDate = (d: string) =>
    format(new Date(d), "dd/MM/yyyy, HH:mm", { locale: ptBR });

  return (
    <>
      <div className="max-w-lg mx-auto pb-4">
        {/* Header with gradient */}
        <div className="rounded-b-3xl px-5 pt-5 pb-6 mb-4" style={{ background: `linear-gradient(135deg, ${primary}, ${primary}dd)` }}>
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-white text-xl font-bold" style={{ fontFamily: fontHeading }}>
              Meus Resgates
            </h1>
          </div>
          {/* Balance card */}
          <div className="rounded-2xl p-4 flex items-center justify-between" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
            <span className="text-white/80 text-sm font-medium">Seus pontos</span>
            <span className="text-white text-2xl font-bold" style={{ fontFamily: fontHeading }}>
              {Number(customer?.points_balance || 0).toLocaleString("pt-BR")} <span className="text-sm font-normal text-white/70">pts</span>
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 mb-3">
          <div className="flex items-center gap-2.5 rounded-full px-4 py-2.5" style={{ backgroundColor: "#F2F2F7" }}>
            <Search className="h-4 w-4 flex-shrink-0" style={{ color: `${fg}50` }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código ou loja..."
              className="bg-transparent flex-1 outline-none text-sm"
              style={{ color: fg }}
            />
          </div>
        </div>

        {/* Status filters */}
        <div className="px-5 mb-4 flex gap-2 overflow-x-auto no-scrollbar">
          {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((key) => {
            const active = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
                style={{
                  backgroundColor: active ? primary : "#F2F2F7",
                  color: active ? "#fff" : `${fg}80`,
                }}
              >
                {STATUS_LABELS[key]}
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor: active ? "rgba(255,255,255,0.25)" : `${fg}10`,
                    color: active ? "#fff" : `${fg}60`,
                  }}
                >
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Redemption cards */}
        {isLoading ? (
          <div className="px-5 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl h-40 animate-pulse" style={{ backgroundColor: "#F2F2F7" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5">
            <EmptyState type="redemptions" primary={primary} />
          </div>
        ) : (
          <div className="px-5 space-y-4">
            {filtered.map((r: any) => (
              <RedemptionCard
                key={r.id}
                r={r}
                primary={primary}
                fg={fg}
                fontHeading={fontHeading}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                onViewDetail={() => setSelectedRedemption(r)}
                onCanceled={() => queryClient.invalidateQueries({ queryKey: ["customer-redemptions"] })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Redemption Detail Overlay */}
      <AnimatePresence>
        {selectedRedemption && (
          <CustomerRedemptionDetailPage
            redemption={selectedRedemption}
            onBack={() => setSelectedRedemption(null)}
            onCanceled={() => {
              setSelectedRedemption(null);
              queryClient.invalidateQueries({ queryKey: ["customer-redemptions"] });
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Card Component ─── */

function RedemptionCard({
  r, primary, fg, fontHeading, formatCurrency, formatDate, onViewDetail, onCanceled,
}: {
  r: any;
  primary: string;
  fg: string;
  fontHeading: string;
  formatCurrency: (v: number) => string;
  formatDate: (d: string) => string;
  onViewDetail: () => void;
  onCanceled: () => void;
}) {
  const offer = r.offers;
  const store = offer?.stores;
  const snapshot = r.offer_snapshot_json || {};
  const badge = STATUS_BADGE[r.status] || STATUS_BADGE.PENDING;
  const isProduct = offer?.coupon_type === "PRODUCT" || snapshot?.coupon_type === "PRODUCT";
  const creditValue = r.credit_value_applied || offer?.value_rescue || snapshot?.value_rescue || 0;
  const purchaseValue = r.purchase_value || 0;
  const discountPct = Number(offer?.discount_percent || snapshot?.discount_percent) || 0;
  const minPurchase = Number(offer?.min_purchase || snapshot?.min_purchase) || 0;

  const typeBadge = isProduct
    ? { label: "PRODUTO", bg: "#DBEAFE", color: "#1E40AF" }
    : { label: "LOJA", bg: "#FEF3C7", color: "#92400E" };

  // Can cancel within 24h of creation
  const hoursSinceCreation = (Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60);
  const canCancel = r.status === "PENDING" && hoursSinceCreation <= 24;

  const expiryDays = r.expires_at
    ? Math.max(0, Math.ceil((new Date(r.expires_at).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)))
    : 30;

  return (
    <div className="rounded-2xl overflow-hidden bg-card" style={{ boxShadow: "0 2px 12px hsl(var(--foreground) / 0.06)" }}>
      {/* Card header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between" style={{ borderBottom: `1px solid ${fg}08` }}>
        <div>
          <span className="text-[10px] font-bold tracking-wider block" style={{ color: `${fg}40` }}>RESGATE</span>
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
            <p className="text-xs mt-0.5" style={{ color: `${fg}60` }}>
              {formatCurrency(purchaseValue)}
            </p>
          ) : !isProduct && creditValue > 0 ? (
            <p className="text-xs mt-0.5" style={{ color: `${fg}60` }}>
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
              <p className="text-xs font-bold" style={{ color: primary }}>
                Compra mínima obrigatória
              </p>
              <p className="text-sm font-extrabold" style={{ color: fg }}>
                {formatCurrency(minPurchase)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Details section - always visible */}
      <div className="px-4 pb-3">
        <div
          className="rounded-xl p-3 space-y-2 text-xs"
          style={{ border: `1.5px solid ${primary}25`, backgroundColor: `${primary}04` }}
        >
          {/* Section title */}
          <div className="flex items-center gap-1.5 mb-1">
            <Info className="h-3.5 w-3.5" style={{ color: primary }} />
            <span className="text-xs font-bold" style={{ color: primary }}>
              {isProduct ? "Detalhes do Produto" : "Detalhes do Cupom"}
            </span>
          </div>

          {/* Product value */}
          {isProduct && purchaseValue > 0 && (
            <DetailInfoRow icon={<DollarSign className="h-3.5 w-3.5" style={{ color: primary }} />} primary={primary}>
              Valor do produto: <strong>{formatCurrency(purchaseValue)}</strong>
            </DetailInfoRow>
          )}

          {/* Credit */}
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

          {/* Min purchase - for product type */}
          {isProduct && minPurchase > 0 && (
            <DetailInfoRow icon={<DollarSign className="h-3.5 w-3.5" style={{ color: primary }} />} primary={primary}>
              Compra mínima: <strong>{formatCurrency(minPurchase)}</strong>
            </DetailInfoRow>
          )}

          {/* Validity */}
          <DetailInfoRow icon={<Clock className="h-3.5 w-3.5" style={{ color: primary }} />} primary={primary}>
            Validade do crédito: <strong>{expiryDays} dias</strong> após o resgate
          </DetailInfoRow>

          {/* Cumulative */}
          {(offer?.is_cumulative === false || snapshot?.is_cumulative === false) && (
            <DetailInfoRow icon={<AlertTriangle className="h-3.5 w-3.5" style={{ color: primary }} />} primary={primary}>
              Oferta <strong>não cumulativa</strong> com outras promoções
            </DetailInfoRow>
          )}

          {/* Store address */}
          {store?.address && (
            <DetailInfoRow icon={<MapPin className="h-3.5 w-3.5" style={{ color: primary }} />} primary={primary}>
              Resgate via: {store.address}
            </DetailInfoRow>
          )}

          {/* WhatsApp */}
          {store?.whatsapp && (
            <DetailInfoRow icon={<Phone className="h-3.5 w-3.5" style={{ color: primary }} />} primary={primary}>
              WhatsApp: {store.whatsapp}
            </DetailInfoRow>
          )}

          {/* Site */}
          {store?.site_url && (
            <DetailInfoRow icon={<Globe className="h-3.5 w-3.5" style={{ color: primary }} />} primary={primary}>
              Site: {store.site_url}
            </DetailInfoRow>
          )}
        </div>
      </div>

      {/* Credit + dates */}
      <div className="px-4 py-3 space-y-1" style={{ borderTop: `1px solid ${fg}06` }}>
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[11px] font-semibold block" style={{ color: `${fg}50` }}>
              CRÉDITO DO {isProduct ? "PRODUTO" : "CUPOM"}
            </span>
            {!isProduct && minPurchase > 0 && (
              <span className="text-[10px]" style={{ color: `${fg}40` }}>
                Crédito condicionado à compra mínima de {formatCurrency(minPurchase)}
              </span>
            )}
          </div>
          <span className="text-lg font-bold" style={{ color: primary, fontFamily: fontHeading }}>
            {formatCurrency(creditValue)}
          </span>
        </div>
        <div className="flex justify-between text-[11px]" style={{ color: `${fg}50` }}>
          <span>Resgate:</span>
          <span>{formatDate(r.created_at)}</span>
        </div>
        {r.expires_at && (
          <div className="flex justify-between text-[11px]">
            <span style={{ color: `${fg}50` }}>Expira:</span>
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
            <CancelButton redemptionId={r.id} token={r.token} onCanceled={onCanceled} fg={fg} />
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Detail Info Row ─── */

function DetailInfoRow({ icon, children, primary }: { icon: React.ReactNode; children: React.ReactNode; primary: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: `${primary}10` }}>
        {icon}
      </div>
      <span className="flex-1 text-xs leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.7)" }}>
        {children}
      </span>
    </div>
  );
}

/* ─── Cancel / Estorno Button ─── */

function CancelButton({ redemptionId, token, onCanceled, fg }: { redemptionId: string; token: string; onCanceled: () => void; fg: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (pinInput !== token) {
      toast.error("PIN incorreto. Verifique e tente novamente.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("redemptions")
        .update({ status: "CANCELED" as any })
        .eq("id", redemptionId)
        .eq("status", "PENDING");
      if (error) throw error;
      toast.success("Resgate estornado com sucesso!");
      onCanceled();
    } catch (err: any) {
      toast.error("Erro ao estornar: " + (err.message || "Tente novamente"));
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-semibold border transition-transform active:scale-[0.98]"
        style={{ borderColor: "#DC2626", color: "#DC2626", backgroundColor: "#FEF2F2" }}
      >
        <RotateCcw className="h-4 w-4" />
        ESTORNAR RESGATE
      </button>
    );
  }

  return (
    <div className="rounded-2xl p-3 space-y-2" style={{ border: "1.5px solid #DC2626", backgroundColor: "#FEF2F2" }}>
      <p className="text-xs font-semibold text-center" style={{ color: "#991B1B" }}>
        Digite o PIN para confirmar o estorno
      </p>
      <input
        type="text"
        maxLength={6}
        value={pinInput}
        onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
        placeholder="000000"
        className="w-full text-center text-xl font-mono font-bold tracking-[0.3em] py-2 rounded-xl border outline-none"
        style={{ borderColor: "#DC262640", color: "#991B1B" }}
      />
      <div className="flex gap-2">
        <button
          onClick={() => { setConfirming(false); setPinInput(""); }}
          className="flex-1 py-2 rounded-xl text-xs font-semibold"
          style={{ backgroundColor: `${fg}10`, color: `${fg}70` }}
        >
          Cancelar
        </button>
        <button
          onClick={handleCancel}
          disabled={pinInput.length < 6 || loading}
          className="flex-1 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50"
          style={{ backgroundColor: "#DC2626" }}
        >
          {loading ? "Estornando..." : "Confirmar"}
        </button>
      </div>
    </div>
  );
}
