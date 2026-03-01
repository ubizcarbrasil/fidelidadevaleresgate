import { useBrand } from "@/contexts/BrandContext";
import { MapPin, MessageCircle, Globe, Instagram, Clock, Ban, Store, Copy, Check, ArrowLeft, Home, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { useState } from "react";
import { useCustomerNav } from "@/components/customer/CustomerLayout";

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

interface Props {
  redemption: any;
  onBack: () => void;
}

export default function CustomerRedemptionDetailPage({ redemption, onBack }: Props) {
  const { theme } = useBrand();
  const { navigateToTab } = useCustomerNav();
  const [copied, setCopied] = useState(false);

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  const offer = redemption.offers;
  const store = offer?.stores;
  const isProduct = offer?.coupon_type === "PRODUCT";
  const termsParams = offer?.terms_params_json || {};
  const productPrice = termsParams?.product_price || 0;
  const discountPct = Number(offer?.discount_percent) || 0;
  const creditValue = redemption.credit_value_applied || offer?.value_rescue || 0;
  const pointsValue = isProduct ? Math.round((discountPct / 100) * productPrice) : creditValue;

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const copyPin = async () => {
    try {
      await navigator.clipboard.writeText(redemption.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const statusLabel = redemption.status === "PENDING" ? "ATIVO" : redemption.status === "USED" ? "USADO" : "EXPIRADO";
  const statusColor = redemption.status === "PENDING" ? "#059669" : redemption.status === "USED" ? "#6B7280" : "#DC2626";

  const hasActions = store?.address || store?.whatsapp || store?.site_url || store?.instagram;

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-[60] overflow-y-auto bg-white"
    >
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-white border-b">
        <button onClick={onBack} className="h-9 w-9 rounded-full flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" style={{ color: fg }} />
        </button>
        <h1 className="text-lg font-bold" style={{ fontFamily: fontHeading, color: fg }}>Detalhes do Resgate</h1>
      </div>

      {isProduct ? (
        <ProductRedemptionBody
          offer={offer}
          store={store}
          redemption={redemption}
          productPrice={productPrice}
          discountPct={discountPct}
          creditValue={creditValue}
          pointsValue={pointsValue}
          statusLabel={statusLabel}
          statusColor={statusColor}
          primary={primary}
          fg={fg}
          fontHeading={fontHeading}
          copied={copied}
          copyPin={copyPin}
          formatCurrency={formatCurrency}
          hasActions={hasActions}
          onBack={onBack}
          navigateToTab={navigateToTab}
        />
      ) : (
        <StoreRedemptionBody
          offer={offer}
          store={store}
          redemption={redemption}
          creditValue={creditValue}
          statusLabel={statusLabel}
          statusColor={statusColor}
          primary={primary}
          fg={fg}
          fontHeading={fontHeading}
          copied={copied}
          copyPin={copyPin}
          formatCurrency={formatCurrency}
          hasActions={hasActions}
          onBack={onBack}
          navigateToTab={navigateToTab}
        />
      )}
    </motion.div>
  );
}

/* ─── PRODUCT Redemption Layout ─── */
function ProductRedemptionBody({
  offer, store, redemption, productPrice, discountPct, creditValue, pointsValue,
  statusLabel, statusColor, primary, fg, fontHeading, copied, copyPin, formatCurrency,
  hasActions, onBack, navigateToTab,
}: any) {
  return (
    <div className="pb-28">
      {/* Product hero */}
      <div className="flex flex-col items-center py-6 border-b bg-white">
        <div className="h-40 w-40 rounded-2xl overflow-hidden mb-4 bg-gray-50 flex items-center justify-center">
          {offer?.image_url ? (
            <img src={offer.image_url} alt={offer.title} className="h-full w-full object-contain" />
          ) : (
            <Store className="h-12 w-12 text-gray-300" />
          )}
        </div>
        <p className="text-xl font-bold" style={{ color: fg, fontFamily: fontHeading }}>{discountPct}% OFF</p>
        <p className="text-sm mt-0.5" style={{ color: `${fg}80` }}>{store?.name || "Loja"}</p>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-2 px-5 py-4">
        {[
          { label: "CRÉDITO", value: formatCurrency(creditValue), color: primary },
          { label: "VALIDADE", value: offer?.end_at ? format(new Date(offer.end_at), "dd/MM/yyyy") : "—", color: fg },
          { label: "STATUS", value: statusLabel, color: statusColor },
        ].map((item, i) => (
          <div key={i} className="rounded-2xl p-3 text-center bg-gray-50">
            <p className="text-[10px] font-semibold tracking-wider mb-1" style={{ color: `${fg}60` }}>{item.label}</p>
            <p className="text-sm font-bold" style={{ color: item.color, fontFamily: fontHeading }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* PIN */}
      <div className="mx-5 rounded-2xl p-5 mb-4 bg-gray-50">
        <p className="text-[11px] font-bold tracking-wider mb-3" style={{ color: `${fg}60` }}>COPIE SEU PIN</p>
        <div className="flex items-center justify-between rounded-xl p-4" style={{ border: `2px dashed ${primary}40`, backgroundColor: `${primary}08` }}>
          <span className="text-3xl font-mono font-bold tracking-[0.3em]" style={{ color: primary }}>{redemption.token}</span>
          <button onClick={copyPin} className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: primary, color: "#fff" }}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copiar
          </button>
        </div>
        <p className="text-[11px] text-center mt-2" style={{ color: `${fg}50` }}>Informe este PIN ao lojista para validar seu crédito</p>
      </div>

      {/* How to redeem */}
      {hasActions && (
        <div className="mx-5 rounded-2xl p-5 mb-4" style={{ border: "2px solid #FBBF24", backgroundColor: "#FFFBEB" }}>
          <p className="text-[11px] font-bold tracking-wider mb-3" style={{ color: `${fg}60` }}>COMO RESGATAR</p>
          <div className="space-y-2">
            {store?.address && (
              <ActionButton icon={<MapPin className="h-5 w-5" />} label="Ver Localização" bg="#FBBF24" color="#1F2937"
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`, "_blank")} />
            )}
            {store?.whatsapp && (
              <ActionButton icon={<MessageCircle className="h-5 w-5" />} label="Resgatar no WhatsApp" bg="#25D366" color="#fff"
                onClick={() => window.open(`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`, "_blank")} />
            )}
            {store?.site_url && (
              <ActionButton icon={<Globe className="h-5 w-5" />} label="Resgatar no Site" bg="#1F2937" color="#fff"
                onClick={() => window.open(store.site_url, "_blank")} />
            )}
            {store?.instagram && (
              <ActionButton icon={<Instagram className="h-5 w-5" />} label="Ver Instagram" bg="linear-gradient(135deg, #833AB4, #E1306C, #F77737)" color="#fff"
                onClick={() => window.open(`https://instagram.com/${store.instagram.replace("@", "")}`, "_blank")} />
            )}
          </div>
        </div>
      )}

      {/* Rules */}
      <div className="mx-5 rounded-2xl p-5 mb-4 bg-white border">
        <p className="text-[11px] font-bold tracking-wider mb-3" style={{ color: `${fg}60` }}>REGRAS DE RESGATE</p>
        <div className="space-y-4">
          {offer?.end_at && (
            <RuleRow icon={<Clock className="h-4 w-4" style={{ color: primary }} />} primary={primary} title="Validade">
              30 dias após o resgate
            </RuleRow>
          )}
          {offer?.is_cumulative === false && (
            <RuleRow icon={<AlertTriangle className="h-4 w-4" style={{ color: primary }} />} primary={primary} title="Cumulativo">
              Não cumulativo com outras promoções
            </RuleRow>
          )}
          <RuleRow icon={<MapPin className="h-4 w-4" style={{ color: primary }} />} primary={primary} title="Local de resgate">
            {offer?.redemption_type === "ONLINE" ? "Válido para compras online" :
              offer?.redemption_type === "WHATSAPP" ? "Válido na loja física e WhatsApp" :
                "Válido na loja física"}
            {store?.site_url ? " e site" : ""}
          </RuleRow>
        </div>
      </div>

      {/* Order details — PRODUCT specific */}
      <div className="mx-5 rounded-2xl p-5 mb-4 bg-gray-50">
        <p className="text-[11px] font-bold tracking-wider mb-4" style={{ color: `${fg}60` }}>DETALHES DO PEDIDO</p>
        <div className="space-y-0 text-sm">
          <DetailRow label="Código do pedido" fg={fg}>
            <span className="font-mono font-semibold">#PED{redemption.id.slice(0, 14).toUpperCase()}</span>
          </DetailRow>
          {productPrice > 0 && (
            <DetailRow label="Valor do produto" fg={fg}>
              <span className="font-semibold">{formatCurrency(productPrice)}</span>
            </DetailRow>
          )}
          <DetailRow label="Crédito usado" fg={fg}>
            <span className="font-semibold" style={{ color: primary }}>{discountPct}% = {formatCurrency(creditValue)}</span>
          </DetailRow>
          <DetailRow label="Pontos gastos" fg={fg}>
            <span className="font-bold">{pointsValue} pontos</span>
          </DetailRow>
          <DetailRow label="Data do resgate" fg={fg} noBorder>
            <span>{format(new Date(redemption.created_at), "dd/MM/yyyy, HH:mm", { locale: ptBR })}</span>
          </DetailRow>
        </div>
      </div>

      {/* Back to home */}
      <div className="px-5 pb-6">
        <button
          onClick={() => { onBack(); navigateToTab("home"); }}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition-transform active:scale-[0.98]"
          style={{ backgroundColor: "#1F2937", color: "#fff" }}
        >
          VOLTAR PARA HOME
        </button>
      </div>
    </div>
  );
}

/* ─── STORE Redemption Layout (original) ─── */
function StoreRedemptionBody({
  offer, store, redemption, creditValue, statusLabel, statusColor,
  primary, fg, fontHeading, copied, copyPin, formatCurrency,
  hasActions, onBack, navigateToTab,
}: any) {
  return (
    <div className="pb-28">
      {/* Header image */}
      <div className="relative h-48 overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${primary}cc)` }}>
        {offer?.image_url ? (
          <img src={offer.image_url} alt={offer.title} className="w-full h-full object-cover opacity-80" />
        ) : store?.logo_url ? (
          <div className="w-full h-full flex items-center justify-center">
            <img src={store.logo_url} alt={store.name} className="h-24 object-contain" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Store className="h-16 w-16 text-white/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-5 right-5">
          <h2 className="text-white text-2xl font-bold" style={{ fontFamily: fontHeading }}>{offer?.title || "Oferta"}</h2>
          <p className="text-white/80 text-sm mt-0.5">{store?.name || "Loja"}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 -mt-4 relative z-10">
        {/* Info cards */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: "Crédito", value: formatCurrency(creditValue), color: primary },
            { label: "Validade", value: offer?.end_at ? format(new Date(offer.end_at), "dd/MM/yy") : "—", color: fg },
            { label: "Status", value: statusLabel, color: statusColor },
          ].map((item, i) => (
            <div key={i} className="rounded-2xl p-3 text-center bg-white" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <p className="text-[10px] font-semibold tracking-wider mb-1" style={{ color: `${fg}50` }}>{item.label.toUpperCase()}</p>
              <p className="text-sm font-bold" style={{ color: item.color, fontFamily: fontHeading }}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* PIN */}
        <div className="rounded-2xl p-5 mb-5 bg-white" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p className="text-[11px] font-bold tracking-wider mb-3" style={{ color: `${fg}50` }}>COPIE SEU PIN</p>
          <div className="flex items-center justify-between rounded-xl p-4 mb-2" style={{ border: `2px dashed ${primary}40`, backgroundColor: `${primary}05` }}>
            <span className="text-3xl font-mono font-bold tracking-[0.3em]" style={{ color: primary }}>{redemption.token}</span>
            <button onClick={copyPin} className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primary}15` }}>
              {copied ? <Check className="h-5 w-5" style={{ color: primary }} /> : <Copy className="h-5 w-5" style={{ color: primary }} />}
            </button>
          </div>
          <p className="text-[11px] text-center" style={{ color: `${fg}40` }}>Informe este PIN ao lojista no momento do resgate</p>
        </div>

        {/* How to redeem */}
        {hasActions && (
          <div className="rounded-2xl p-5 mb-5 bg-white" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p className="text-[11px] font-bold tracking-wider mb-3" style={{ color: `${fg}50` }}>COMO RESGATAR</p>
            <div className="space-y-2">
              {store?.address && (
                <ActionButton icon={<MapPin className="h-5 w-5" />} label="Ver Localização" bg="#FBBF24" color="#1F2937"
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`, "_blank")} />
              )}
              {store?.whatsapp && (
                <ActionButton icon={<MessageCircle className="h-5 w-5" />} label="Resgatar no WhatsApp" bg="#25D366" color="#fff"
                  onClick={() => window.open(`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`, "_blank")} />
              )}
              {store?.site_url && (
                <ActionButton icon={<Globe className="h-5 w-5" />} label="Resgatar no Site" bg="#1F2937" color="#fff"
                  onClick={() => window.open(store.site_url, "_blank")} />
              )}
              {store?.instagram && (
                <ActionButton icon={<Instagram className="h-5 w-5" />} label="Ver Instagram" bg="linear-gradient(135deg, #833AB4, #E1306C, #F77737)" color="#fff"
                  onClick={() => window.open(`https://instagram.com/${store.instagram.replace("@", "")}`, "_blank")} />
              )}
            </div>
          </div>
        )}

        {/* Rules */}
        <div className="rounded-2xl p-5 mb-5 bg-white" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p className="text-[11px] font-bold tracking-wider mb-3" style={{ color: `${fg}50` }}>REGRAS DE RESGATE</p>
          <div className="space-y-3">
            {offer?.end_at && (
              <RuleRowSimple icon={<Clock className="h-4 w-4" style={{ color: primary }} />} primary={primary}>
                Validade: até {format(new Date(offer.end_at), "dd/MM/yyyy")}
              </RuleRowSimple>
            )}
            {offer?.is_cumulative === false && (
              <RuleRowSimple icon={<Ban className="h-4 w-4" style={{ color: primary }} />} primary={primary}>
                Não cumulativo com outras ofertas
              </RuleRowSimple>
            )}
            <RuleRowSimple icon={<MapPin className="h-4 w-4" style={{ color: primary }} />} primary={primary}>
              {offer?.redemption_type === "ONLINE" ? "Válido para compras online" :
                offer?.redemption_type === "WHATSAPP" ? "Resgate via WhatsApp" : "Válido em loja física"}
            </RuleRowSimple>
            {offer?.min_purchase > 0 && (
              <RuleRowSimple icon={<span className="text-xs font-bold" style={{ color: primary }}>$</span>} primary={primary}>
                Compra mínima: {formatCurrency(offer.min_purchase)}
              </RuleRowSimple>
            )}
          </div>
        </div>

        {/* Order details */}
        <div className="rounded-2xl p-5 mb-5 bg-white" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p className="text-[11px] font-bold tracking-wider mb-3" style={{ color: `${fg}50` }}>DETALHES DO PEDIDO</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: `${fg}60` }}>Código</span>
              <span className="font-mono font-semibold" style={{ color: fg }}>#PED{redemption.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: `${fg}60` }}>Valor do crédito</span>
              <span className="font-semibold" style={{ color: primary }}>{formatCurrency(creditValue)}</span>
            </div>
            {redemption.purchase_value > 0 && (
              <div className="flex justify-between">
                <span style={{ color: `${fg}60` }}>Valor da compra</span>
                <span className="font-semibold" style={{ color: fg }}>{formatCurrency(redemption.purchase_value)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span style={{ color: `${fg}60` }}>Data do resgate</span>
              <span style={{ color: fg }}>{format(new Date(redemption.created_at), "dd/MM/yyyy, HH:mm", { locale: ptBR })}</span>
            </div>
            {redemption.expires_at && (
              <div className="flex justify-between">
                <span style={{ color: `${fg}60` }}>Expira em</span>
                <span style={{ color: redemption.status === "EXPIRED" ? "#DC2626" : fg }}>
                  {format(new Date(redemption.expires_at), "dd/MM/yyyy, HH:mm", { locale: ptBR })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Back to home */}
        <button
          onClick={() => { onBack(); navigateToTab("home"); }}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold mb-6 transition-transform active:scale-[0.98]"
          style={{ backgroundColor: primary, color: "#fff" }}
        >
          <Home className="h-5 w-5" />
          VOLTAR PARA HOME
        </button>
      </div>
    </div>
  );
}

/* ─── Shared Components ─── */

function ActionButton({ icon, label, bg, color, onClick }: {
  icon: React.ReactNode; label: string; bg: string; color: string; onClick: () => void;
}) {
  const isGradient = bg.includes("gradient");
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-transform active:scale-[0.98]"
      style={isGradient ? { background: bg, color } : { backgroundColor: bg, color }}
    >
      {icon}
      {label}
    </button>
  );
}

function RuleRow({ icon, children, primary, title }: { icon: React.ReactNode; children: React.ReactNode; primary: string; title: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primary}15` }}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{title}</p>
        <p className="text-sm" style={{ color: "hsl(var(--foreground) / 0.6)" }}>{children}</p>
      </div>
    </div>
  );
}

function RuleRowSimple({ icon, children, primary }: { icon: React.ReactNode; children: React.ReactNode; primary: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primary}10` }}>
        {icon}
      </div>
      <span className="text-sm" style={{ color: "hsl(var(--foreground) / 0.7)" }}>{children}</span>
    </div>
  );
}

function DetailRow({ label, fg, children, noBorder }: { label: string; fg: string; children: React.ReactNode; noBorder?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-3 ${noBorder ? "" : "border-b border-gray-200"}`}>
      <span className="text-sm" style={{ color: `${fg}70` }}>{label}</span>
      <span className="text-sm" style={{ color: fg }}>{children}</span>
    </div>
  );
}
