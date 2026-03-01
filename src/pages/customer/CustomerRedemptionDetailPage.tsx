import { useBrand } from "@/contexts/BrandContext";
import { MapPin, MessageCircle, Globe, Instagram, Clock, Ban, Store, Copy, Check, ArrowLeft, Home } from "lucide-react";
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
  const creditValue = redemption.credit_value_applied || offer?.value_rescue || 0;

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

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-[60] overflow-y-auto"
      style={{ backgroundColor: "#F5F5F0" }}
    >
      {/* Header image */}
      <div className="relative h-52 overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${primary}cc)` }}>
        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-10 h-9 w-9 rounded-full bg-black/20 flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
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
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-5 right-5">
          <h1 className="text-white text-2xl font-bold" style={{ fontFamily: fontHeading }}>{offer?.title || "Oferta"}</h1>
          <p className="text-white/80 text-sm mt-0.5">{store?.name || "Loja"}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 -mt-4 relative z-10 pb-32">
        {/* Info cards row */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: "Crédito", value: formatCurrency(creditValue) },
            { label: "Validade", value: offer?.end_at ? format(new Date(offer.end_at), "dd/MM/yy") : "—" },
            { label: "Status", value: statusLabel },
          ].map((item, i) => (
            <div key={i} className="rounded-2xl p-3 text-center" style={{ backgroundColor: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <p className="text-[10px] font-semibold tracking-wider mb-1" style={{ color: `${fg}50` }}>{item.label.toUpperCase()}</p>
              <p className="text-sm font-bold" style={{ color: i === 2 ? statusColor : primary, fontFamily: fontHeading }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* PIN Section */}
        <div className="rounded-2xl p-5 mb-5" style={{ backgroundColor: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p className="text-[11px] font-bold tracking-wider mb-3" style={{ color: `${fg}50` }}>COPIE SEU PIN</p>
          <div
            className="flex items-center justify-between rounded-xl p-4 mb-2"
            style={{ border: `2px dashed ${primary}40`, backgroundColor: `${primary}05` }}
          >
            <span className="text-3xl font-mono font-bold tracking-[0.3em]" style={{ color: primary }}>
              {redemption.token}
            </span>
            <button
              onClick={copyPin}
              className="h-10 w-10 rounded-xl flex items-center justify-center transition-colors"
              style={{ backgroundColor: `${primary}15` }}
            >
              {copied ? (
                <Check className="h-5 w-5" style={{ color: primary }} />
              ) : (
                <Copy className="h-5 w-5" style={{ color: primary }} />
              )}
            </button>
          </div>
          <p className="text-[11px] text-center" style={{ color: `${fg}40` }}>Informe este PIN ao lojista no momento do resgate</p>
        </div>

        {/* How to redeem */}
        {(store?.address || store?.whatsapp || store?.site_url || store?.instagram) && (
          <div className="rounded-2xl p-5 mb-5" style={{ backgroundColor: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p className="text-[11px] font-bold tracking-wider mb-3" style={{ color: `${fg}50` }}>COMO RESGATAR</p>
            <div className="space-y-2">
              {store.address && (
                <ActionButton
                  icon={<MapPin className="h-5 w-5" />}
                  label="Ver Localização"
                  bg="#FBBF24"
                  color="#1F2937"
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`, "_blank")}
                />
              )}
              {store.whatsapp && (
                <ActionButton
                  icon={<MessageCircle className="h-5 w-5" />}
                  label="Resgatar no WhatsApp"
                  bg="#25D366"
                  color="#fff"
                  onClick={() => {
                    const num = store.whatsapp.replace(/\D/g, "");
                    window.open(`https://wa.me/${num}`, "_blank");
                  }}
                />
              )}
              {store.site_url && (
                <ActionButton
                  icon={<Globe className="h-5 w-5" />}
                  label="Resgatar no Site"
                  bg="#1F2937"
                  color="#fff"
                  onClick={() => window.open(store.site_url, "_blank")}
                />
              )}
              {store.instagram && (
                <ActionButton
                  icon={<Instagram className="h-5 w-5" />}
                  label="Ver Instagram"
                  bg="linear-gradient(135deg, #833AB4, #E1306C, #F77737)"
                  color="#fff"
                  onClick={() => {
                    const handle = store.instagram.replace("@", "");
                    window.open(`https://instagram.com/${handle}`, "_blank");
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* Redemption rules */}
        <div className="rounded-2xl p-5 mb-5" style={{ backgroundColor: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p className="text-[11px] font-bold tracking-wider mb-3" style={{ color: `${fg}50` }}>REGRAS DE RESGATE</p>
          <div className="space-y-3">
            {offer?.end_at && (
              <RuleRow icon={<Clock className="h-4 w-4" style={{ color: primary }} />} primary={primary}>
                Validade: até {format(new Date(offer.end_at), "dd/MM/yyyy")}
              </RuleRow>
            )}
            {offer?.is_cumulative === false && (
              <RuleRow icon={<Ban className="h-4 w-4" style={{ color: primary }} />} primary={primary}>
                Não cumulativo com outras ofertas
              </RuleRow>
            )}
            <RuleRow icon={<MapPin className="h-4 w-4" style={{ color: primary }} />} primary={primary}>
              {offer?.redemption_type === "ONLINE" ? "Válido para compras online" :
                offer?.redemption_type === "WHATSAPP" ? "Resgate via WhatsApp" :
                  "Válido em loja física"}
            </RuleRow>
            {offer?.min_purchase > 0 && (
              <RuleRow icon={<span className="text-xs font-bold" style={{ color: primary }}>$</span>} primary={primary}>
                Compra mínima: {formatCurrency(offer.min_purchase)}
              </RuleRow>
            )}
          </div>
        </div>

        {/* Order details */}
        <div className="rounded-2xl p-5 mb-5" style={{ backgroundColor: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p className="text-[11px] font-bold tracking-wider mb-3" style={{ color: `${fg}50` }}>DETALHES DO PEDIDO</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: `${fg}60` }}>Código</span>
              <span className="font-mono font-semibold" style={{ color: fg }}>
                #PED{redemption.id.slice(0, 8).toUpperCase()}
              </span>
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
          onClick={() => {
            onBack();
            navigateToTab("home");
          }}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold mb-6 transition-transform active:scale-[0.98]"
          style={{ backgroundColor: primary, color: "#fff" }}
        >
          <Home className="h-5 w-5" />
          VOLTAR PARA HOME
        </button>
      </div>
    </motion.div>
  );
}

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

function RuleRow({ icon, children, primary }: { icon: React.ReactNode; children: React.ReactNode; primary: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primary}10` }}>
        {icon}
      </div>
      <span className="text-sm" style={{ color: "hsl(var(--foreground) / 0.7)" }}>{children}</span>
    </div>
  );
}
