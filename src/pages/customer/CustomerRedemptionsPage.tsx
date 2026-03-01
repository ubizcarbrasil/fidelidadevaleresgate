import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCustomer } from "@/contexts/CustomerContext";
import { useBrand } from "@/contexts/BrandContext";
import { Search, ChevronDown, ChevronUp, MapPin, Phone, Globe, Instagram, Clock, Ban, Store, QrCode } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import CustomerRedemptionDetailPage from "./CustomerRedemptionDetailPage";

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
};

export default function CustomerRedemptionsPage() {
  const { customer } = useCustomer();
  const { theme } = useBrand();
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedRedemption, setSelectedRedemption] = useState<any>(null);

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

  const totalCredit = useMemo(() =>
    redemptions
      .filter((r: any) => r.status === "PENDING")
      .reduce((sum: number, r: any) => sum + (r.credit_value_applied || r.offers?.value_rescue || 0), 0),
    [redemptions]
  );

  return (
    <>
      <div className="max-w-lg mx-auto pb-4">
        {/* Header with gradient */}
        <div className="rounded-b-3xl px-5 pt-5 pb-6 mb-4" style={{ background: `linear-gradient(135deg, ${primary}, ${primary}dd)` }}>
          <h1 className="text-white text-xl font-bold mb-4" style={{ fontFamily: fontHeading }}>
            Meus Resgates
          </h1>
          {/* Balance card */}
          <div className="rounded-2xl p-4 flex items-center justify-between" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
            <span className="text-white/80 text-sm font-medium">Saldo disponível</span>
            <span className="text-white text-2xl font-bold" style={{ fontFamily: fontHeading }}>
              {formatCurrency(customer?.money_balance || 0)}
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
          <div className="px-5 text-center py-12">
            <QrCode className="h-12 w-12 mx-auto mb-3" style={{ color: `${fg}20` }} />
            <p className="text-sm" style={{ color: `${fg}50` }}>Nenhum resgate encontrado</p>
          </div>
        ) : (
          <div className="px-5 space-y-4">
            {filtered.map((r: any) => {
              const offer = r.offers;
              const store = offer?.stores;
              const badge = STATUS_BADGE[r.status] || STATUS_BADGE.PENDING;
              const creditValue = r.credit_value_applied || offer?.value_rescue || 0;
              const isExpanded = expandedId === r.id;

              return (
                <motion.div
                  key={r.id}
                  layout
                  className="rounded-2xl overflow-hidden"
                  style={{ backgroundColor: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
                >
                  {/* Card header */}
                  <div className="px-4 pt-3 pb-2 flex items-center justify-between" style={{ borderBottom: `1px solid ${fg}08` }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold tracking-wider" style={{ color: `${fg}40` }}>RESGATE</span>
                      <span className="text-[10px] font-mono" style={{ color: `${fg}30` }}>
                        #PED{r.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ backgroundColor: badge.bg, color: badge.color }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Store info + value */}
                  <div className="px-4 py-3 flex items-center gap-3">
                    {store?.logo_url ? (
                      <img src={store.logo_url} alt={store.name} className="h-10 w-10 rounded-xl object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primary}15` }}>
                        <Store className="h-5 w-5" style={{ color: primary }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: fg }}>{store?.name || "Loja"}</p>
                      {offer?.coupon_type && (
                        <span
                          className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold"
                          style={{ backgroundColor: offer.coupon_type === "PRODUCT" ? "#DBEAFE" : "#FEF3C7", color: offer.coupon_type === "PRODUCT" ? "#1E40AF" : "#92400E" }}
                        >
                          {offer.coupon_type === "PRODUCT"
                            ? `PAGUE ${offer.discount_percent || 0}% COM PONTOS`
                            : `VALE RESGATE ${formatCurrency(creditValue)}`}
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-bold" style={{ color: primary, fontFamily: fontHeading }}>
                      {formatCurrency(creditValue)}
                    </p>
                  </div>

                  {/* Expandable details */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    className="w-full px-4 py-2 flex items-center justify-between text-xs font-semibold"
                    style={{ backgroundColor: `${primary}06`, color: primary, borderTop: `1px solid ${fg}06` }}
                  >
                    <span>Detalhes do {offer?.coupon_type === "PRODUCT" ? "Produto" : "Cupom"}</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div
                          className="px-4 py-3 mx-3 mb-3 rounded-xl space-y-2 text-xs"
                          style={{ border: `1.5px solid ${primary}25`, backgroundColor: `${primary}04` }}
                        >
                          <DetailRow icon={<span style={{ color: primary }}>💲</span>} label="Valor" value={formatCurrency(r.purchase_value || offer?.value_rescue || 0)} />
                          {offer?.discount_percent > 0 && (
                            <DetailRow icon={<span style={{ color: primary }}>%</span>} label="Crédito" value={`${offer.discount_percent}% = ${formatCurrency(creditValue)}`} />
                          )}
                          {offer?.end_at && (
                            <DetailRow icon={<Clock className="h-3.5 w-3.5" style={{ color: primary }} />} label="Validade" value={format(new Date(offer.end_at), "dd/MM/yyyy")} />
                          )}
                          {offer?.is_cumulative === false && (
                            <DetailRow icon={<Ban className="h-3.5 w-3.5" style={{ color: primary }} />} label="" value="Não cumulativa" />
                          )}
                          {store?.address && (
                            <DetailRow icon={<MapPin className="h-3.5 w-3.5" style={{ color: primary }} />} label="Resgate via" value={store.address} />
                          )}
                          {store?.whatsapp && (
                            <DetailRow icon={<Phone className="h-3.5 w-3.5" style={{ color: primary }} />} label="WhatsApp" value={store.whatsapp} />
                          )}
                          {store?.site_url && (
                            <DetailRow icon={<Globe className="h-3.5 w-3.5" style={{ color: primary }} />} label="Site" value={store.site_url} />
                          )}
                          {store?.instagram && (
                            <DetailRow icon={<Instagram className="h-3.5 w-3.5" style={{ color: primary }} />} label="Instagram" value={`@${store.instagram}`} />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Credit + dates */}
                  <div className="px-4 py-3 space-y-1" style={{ borderTop: `1px solid ${fg}06` }}>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-semibold" style={{ color: `${fg}50` }}>CRÉDITO DO {offer?.coupon_type === "PRODUCT" ? "PRODUTO" : "CUPOM"}</span>
                      <span className="text-sm font-bold" style={{ color: primary }}>{formatCurrency(creditValue)}</span>
                    </div>
                    <div className="flex justify-between text-[11px]" style={{ color: `${fg}50` }}>
                      <span>Resgate:</span>
                      <span>{formatDate(r.created_at)}</span>
                    </div>
                    {r.expires_at && (
                      <div className="flex justify-between text-[11px]">
                        <span style={{ color: `${fg}50` }}>Expira:</span>
                        <span style={{ color: r.status === "EXPIRED" ? "#DC2626" : `${fg}50` }}>
                          {formatDate(r.expires_at)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* QR / PIN button */}
                  {r.status === "PENDING" && (
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => setSelectedRedemption(r)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-transform active:scale-[0.98]"
                        style={{ backgroundColor: "#FBBF24", color: "#1F2937" }}
                      >
                        <QrCode className="h-5 w-5" />
                        VER QR CODE E PIN
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Redemption Detail Overlay */}
      <AnimatePresence>
        {selectedRedemption && (
          <CustomerRedemptionDetailPage
            redemption={selectedRedemption}
            onBack={() => setSelectedRedemption(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "hsl(var(--primary) / 0.1)" }}>
        {icon}
      </div>
      <span className="flex-1" style={{ color: "hsl(var(--foreground) / 0.7)" }}>
        {label && <span className="font-medium">{label}: </span>}
        {value}
      </span>
    </div>
  );
}
