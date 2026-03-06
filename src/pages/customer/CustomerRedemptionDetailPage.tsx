import { useBrand } from "@/contexts/BrandContext";
import { MapPin, MessageCircle, Globe, Instagram, Clock, AlertTriangle, Store, Copy, Check, ArrowLeft, Home, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { useState } from "react";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

interface Props {
  redemption: any;
  onBack: () => void;
  onCanceled?: () => void;
}

export default function CustomerRedemptionDetailPage({ redemption, onBack, onCanceled }: Props) {
  const { theme } = useBrand();
  const { navigateToTab } = useCustomerNav();
  const [copied, setCopied] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelPin, setCancelPin] = useState("");
  const [canceling, setCanceling] = useState(false);

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  const offer = redemption.offers;
  const store = offer?.stores;
  const snapshot = redemption.offer_snapshot_json || {};
  const isProduct = offer?.coupon_type === "PRODUCT" || snapshot?.coupon_type === "PRODUCT";
  const discountPct = Number(offer?.discount_percent || snapshot?.discount_percent) || 0;
  const creditValue = redemption.credit_value_applied || offer?.value_rescue || snapshot?.value_rescue || 0;
  const purchaseValue = redemption.purchase_value || 0;

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const copyPin = async () => {
    try {
      await navigator.clipboard.writeText(redemption.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  const hoursSinceCreation = (Date.now() - new Date(redemption.created_at).getTime()) / (1000 * 60 * 60);
  const canCancel = redemption.status === "PENDING" && hoursSinceCreation <= 24;

  const handleCancelRedemption = async () => {
    if (cancelPin !== redemption.token) {
      toast.error("PIN incorreto. Verifique e tente novamente.");
      return;
    }
    setCanceling(true);
    try {
      const { error } = await supabase
        .from("redemptions")
        .update({ status: "CANCELED" as any })
        .eq("id", redemption.id)
        .eq("status", "PENDING");
      if (error) throw error;

      // Refund points: check if there's a debit ledger entry for this redemption
      const { data: debitEntry } = await supabase
        .from("points_ledger")
        .select("points_amount, customer_id, brand_id, branch_id")
        .eq("reference_id", redemption.id)
        .eq("reference_type", "REDEMPTION")
        .eq("entry_type", "DEBIT")
        .maybeSingle();

      if (debitEntry && debitEntry.points_amount > 0) {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (userId) {
          // Insert credit (refund) entry
          await supabase.from("points_ledger").insert({
            customer_id: debitEntry.customer_id,
            brand_id: debitEntry.brand_id,
            branch_id: debitEntry.branch_id,
            entry_type: "CREDIT" as any,
            points_amount: debitEntry.points_amount,
            money_amount: 0,
            reference_type: "REDEMPTION" as any,
            reference_id: redemption.id,
            reason: "Estorno de resgate",
            created_by_user_id: userId,
          });

          // Restore customer balance
          const { data: cust } = await supabase
            .from("customers")
            .select("points_balance")
            .eq("id", debitEntry.customer_id)
            .single();

          if (cust) {
            await supabase.from("customers").update({
              points_balance: Number(cust.points_balance) + debitEntry.points_amount,
            }).eq("id", debitEntry.customer_id);
          }
        }
      }

      toast.success("Resgate estornado com sucesso!");
      onCanceled?.();
    } catch (err: any) {
      toast.error("Erro ao estornar: " + (err.message || "Tente novamente"));
    } finally {
      setCanceling(false);
    }
  };

  const statusLabel = redemption.status === "PENDING" ? "ATIVO" : redemption.status === "USED" ? "USADO" : redemption.status === "CANCELED" ? "ESTORNADO" : "EXPIRADO";
  const statusColor = redemption.status === "PENDING" ? "#059669" : redemption.status === "USED" ? "#6B7280" : redemption.status === "CANCELED" ? "#D97706" : "#DC2626";

  const hasActions = store?.address || store?.whatsapp || store?.site_url || store?.instagram;

  // Determine hero image: product → offer image, store → logo
  const heroImage = isProduct ? offer?.image_url : (store?.logo_url || offer?.image_url);
  const heroTitle = isProduct
    ? `${discountPct}% OFF`
    : (offer?.title || snapshot?.title || "Oferta");

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-[60] overflow-y-auto bg-background"
    >
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-card border-b">
        <button onClick={onBack} className="h-9 w-9 rounded-full flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" style={{ color: fg }} />
        </button>
        <h1 className="text-lg font-bold" style={{ fontFamily: fontHeading, color: fg }}>Detalhes do Resgate</h1>
      </div>

      <div className="pb-6">
        {/* Hero section - image + title */}
        <div className="flex flex-col items-center py-6 border-b bg-muted">
          <div className="h-40 w-40 rounded-2xl overflow-hidden mb-4 bg-card flex items-center justify-center" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            {heroImage ? (
              <img src={heroImage} alt={heroTitle} className="h-full w-full object-contain" />
            ) : (
              <Store className="h-12 w-12" style={{ color: `${fg}30` }} />
            )}
          </div>
          <p className="text-xl font-bold" style={{ color: fg, fontFamily: fontHeading }}>{heroTitle}</p>
          <p className="text-sm mt-0.5" style={{ color: `${fg}60` }}>{store?.name || "Parceiro"}</p>
        </div>

        {/* Info cards row: CRÉDITO / VALIDADE / STATUS */}
        <div className="grid grid-cols-3 gap-2 px-5 py-4">
          <div className="rounded-2xl p-3 text-center bg-muted">
            <p className="text-[10px] font-semibold tracking-wider mb-1" style={{ color: `${fg}50` }}>CRÉDITO</p>
            <p className="text-sm font-bold" style={{ color: primary, fontFamily: fontHeading }}>
              {formatCurrency(Number(creditValue))}
            </p>
          </div>
          <div className="rounded-2xl p-3 text-center bg-muted">
            <p className="text-[10px] font-semibold tracking-wider mb-1" style={{ color: `${fg}50` }}>VALIDADE</p>
            <p className="text-sm font-bold" style={{ color: fg, fontFamily: fontHeading }}>
              {redemption.expires_at
                ? format(new Date(redemption.expires_at), "dd/MM/yyyy")
                : offer?.end_at
                  ? format(new Date(offer.end_at), "dd/MM/yyyy")
                  : "—"}
            </p>
          </div>
          <div className="rounded-2xl p-3 text-center bg-muted">
            <p className="text-[10px] font-semibold tracking-wider mb-1" style={{ color: `${fg}50` }}>STATUS</p>
            <p className="text-sm font-bold" style={{ color: statusColor, fontFamily: fontHeading }}>{statusLabel}</p>
          </div>
        </div>

        {/* PIN section */}
        <div className="mx-5 rounded-2xl p-5 mb-4 bg-muted">
          <p className="text-[11px] font-bold tracking-wider mb-3" style={{ color: `${fg}60` }}>COPIE SEU PIN</p>
          <div className="flex items-center justify-between rounded-xl p-4" style={{ border: `2px dashed ${primary}40`, backgroundColor: `${primary}06` }}>
            <span className="text-3xl font-mono font-bold tracking-[0.3em]" style={{ color: primary }}>
              {redemption.token}
            </span>
            <button
              onClick={copyPin}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
              style={{ backgroundColor: primary, color: "#fff" }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copiar
            </button>
          </div>
          <p className="text-[11px] text-center mt-2" style={{ color: `${fg}50` }}>
            Informe este PIN ao lojista para validar seu crédito
          </p>
        </div>

        {/* Estorno button */}
        {canCancel && (
          <div className="mx-5 mb-4">
            {!showCancelConfirm ? (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border transition-transform active:scale-[0.98]"
                style={{ borderColor: "#DC2626", color: "#DC2626", backgroundColor: "#FEF2F2" }}
              >
                <RotateCcw className="h-4 w-4" />
                ESTORNAR RESGATE
              </button>
            ) : (
              <div className="rounded-2xl p-4 space-y-3" style={{ border: "1.5px solid #DC2626", backgroundColor: "#FEF2F2" }}>
                <p className="text-xs font-semibold text-center" style={{ color: "#991B1B" }}>
                  Digite o PIN para confirmar o estorno
                </p>
                <input
                  type="text"
                  maxLength={6}
                  value={cancelPin}
                  onChange={(e) => setCancelPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full text-center text-2xl font-mono font-bold tracking-[0.3em] py-3 rounded-xl border outline-none"
                  style={{ borderColor: "#DC262640", color: "#991B1B" }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowCancelConfirm(false); setCancelPin(""); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ backgroundColor: `${fg}10`, color: `${fg}70` }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCancelRedemption}
                    disabled={cancelPin.length < 6 || canceling}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                    style={{ backgroundColor: "#DC2626" }}
                  >
                    {canceling ? "Estornando..." : "Confirmar Estorno"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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

        {/* Rules section */}
        <div className="mx-5 rounded-2xl p-5 mb-4 bg-card border" style={{ borderColor: `${fg}10` }}>
          <p className="text-[11px] font-bold tracking-wider mb-4" style={{ color: `${fg}60` }}>REGRAS DE RESGATE</p>
          <div className="space-y-4">
            {(offer?.end_at || redemption.expires_at) && (
              <RuleRow icon={<Clock className="h-4 w-4" style={{ color: primary }} />} primary={primary} title="Validade">
                {redemption.expires_at
                  ? `Até ${format(new Date(redemption.expires_at), "dd/MM/yyyy")}`
                  : "30 dias após o resgate"}
              </RuleRow>
            )}
            {(offer?.is_cumulative === false || snapshot?.is_cumulative === false) && (
              <RuleRow icon={<AlertTriangle className="h-4 w-4" style={{ color: primary }} />} primary={primary} title="Cumulativo">
                Não cumulativo com outras promoções
              </RuleRow>
            )}
            <RuleRow icon={<MapPin className="h-4 w-4" style={{ color: primary }} />} primary={primary} title="Local de resgate">
              {(() => {
                const rt = offer?.redemption_type || snapshot?.redemption_type;
                const parts: string[] = [];
                if (rt !== "ONLINE") parts.push("loja física");
                if (store?.whatsapp || rt === "WHATSAPP") parts.push("WhatsApp");
                if (store?.site_url || rt === "ONLINE") parts.push("site");
                return `Válido no ${parts.join(" e ")}`;
              })()}
            </RuleRow>
          </div>
        </div>

        {/* Order details */}
        <div className="mx-5 rounded-2xl p-5 mb-6" style={{ backgroundColor: "#F9FAFB" }}>
          <p className="text-[11px] font-bold tracking-wider mb-4" style={{ color: `${fg}60` }}>DETALHES DO PEDIDO</p>
          <div className="text-sm">
            <DetailRow label="Código do pedido" fg={fg}>
              <span className="font-mono font-semibold">
                #PED{redemption.id.replace(/-/g, "").slice(0, 14).toUpperCase()}
              </span>
            </DetailRow>
            {isProduct && purchaseValue > 0 && (
              <DetailRow label="Valor do produto" fg={fg}>
                <span className="font-semibold">{formatCurrency(purchaseValue)}</span>
              </DetailRow>
            )}
            {isProduct && discountPct > 0 ? (
              <DetailRow label="Crédito usado" fg={fg}>
                <span className="font-semibold" style={{ color: primary }}>
                  {discountPct}% = {formatCurrency(Number(creditValue))}
                </span>
              </DetailRow>
            ) : (
              <DetailRow label="Valor do crédito" fg={fg}>
                <span className="font-semibold" style={{ color: primary }}>{formatCurrency(Number(creditValue))}</span>
              </DetailRow>
            )}
            {isProduct && (
              <DetailRow label="Pontos gastos" fg={fg}>
                <span className="font-bold">{Math.round(Number(creditValue))} pontos</span>
              </DetailRow>
            )}
            <DetailRow label="Data do resgate" fg={fg} noBorder>
              <span>{format(new Date(redemption.created_at), "dd/MM/yyyy, HH:mm", { locale: ptBR })}</span>
            </DetailRow>
          </div>
        </div>

        {/* Back to home */}
        <div className="px-5">
          <button
            onClick={() => { onBack(); navigateToTab("home"); }}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition-transform active:scale-[0.98]"
            style={{ backgroundColor: "#1F2937", color: "#fff" }}
          >
            VOLTAR PARA HOME
          </button>
        </div>
      </div>
    </motion.div>
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
      className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-transform active:scale-[0.98]"
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

function DetailRow({ label, fg, children, noBorder }: { label: string; fg: string; children: React.ReactNode; noBorder?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-3 ${noBorder ? "" : "border-b"}`} style={{ borderColor: `${fg}10` }}>
      <span style={{ color: `${fg}70` }}>{label}</span>
      <span style={{ color: fg }}>{children}</span>
    </div>
  );
}
