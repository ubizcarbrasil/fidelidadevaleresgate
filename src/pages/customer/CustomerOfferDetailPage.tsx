import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomer } from "@/contexts/CustomerContext";
import type { Tables } from "@/integrations/supabase/types";
import {
  ArrowLeft, Clock, ShoppingBag, Heart, CalendarDays, Store, Loader2,
  CheckCircle2, AlertTriangle, Share2, Copy, Sparkles, ThumbsUp,
} from "lucide-react";
import RedemptionSignupCarousel from "@/components/customer/RedemptionSignupCarousel";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";

type Offer = Tables<"offers">;

interface OfferWithStore extends Offer {
  stores?: { name: string; logo_url: string | null } | null;
}

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface Props {
  offer: OfferWithStore;
  onBack: () => void;
  onOfferClick?: (offer: OfferWithStore) => void;
}

export default function CustomerOfferDetailPage({ offer, onBack, onOfferClick }: Props) {
  const { brand, selectedBranch, theme } = useBrand();
  const { customer } = useCustomer();
  const [showConfirm, setShowConfirm] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(false);
  const [cpf, setCpf] = useState("");
  const [pin, setPin] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [similarOffers, setSimilarOffers] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  // Fetch similar offers
  useEffect(() => {
    if (!brand || !selectedBranch) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("offers")
        .select("*, stores(name, logo_url)")
        .eq("branch_id", selectedBranch.id)
        .eq("brand_id", brand.id)
        .eq("status", "ACTIVE")
        .eq("is_active", true)
        .neq("id", offer.id)
        .limit(4)
        .order("created_at", { ascending: false });
      setSimilarOffers(data || []);
    };
    fetch();
  }, [offer.id, brand, selectedBranch]);

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const isValidCpf = (v: string) => v.replace(/\D/g, "").length === 11;

  const handleRedeem = async () => {
    if (!customer) {
      toast({ title: "Faça login para resgatar", description: "Você precisa estar logado para resgatar ofertas.", variant: "destructive" });
      return;
    }
    if (!brand || !selectedBranch) return;
    if (!isValidCpf(cpf)) {
      toast({ title: "CPF inválido", description: "Informe os 11 dígitos do CPF.", variant: "destructive" });
      return;
    }
    setRedeeming(true);
    try {
      // Build offer snapshot for historical integrity
      const offerSnapshot = {
        title: offer.title,
        value_rescue: offer.value_rescue,
        min_purchase: offer.min_purchase,
        discount_percent: offer.discount_percent,
        scaled_values_json: offer.scaled_values_json,
        coupon_type: offer.coupon_type,
        redemption_type: offer.redemption_type,
        allowed_weekdays: offer.allowed_weekdays,
        allowed_hours: offer.allowed_hours,
        max_daily_redemptions: offer.max_daily_redemptions,
        max_uses_per_customer: offer.max_uses_per_customer,
        terms_text: offer.terms_text,
      };

      const { data: created, error } = await supabase.from("redemptions").insert({
        offer_id: offer.id,
        customer_id: customer.id,
        brand_id: brand.id,
        branch_id: selectedBranch.id,
        status: "PENDING",
        customer_cpf: cpf.replace(/\D/g, ""),
        offer_snapshot_json: offerSnapshot as any,
      }).select("token").single();
      if (error) throw error;
      setPin(created.token);
      setRedeemed(true);
      setShowConfirm(false);
      toast({ title: "Resgate solicitado!", description: "Apresente o PIN ao estabelecimento." });
    } catch (err: any) {
      toast({ title: "Erro ao resgatar", description: err.message, variant: "destructive" });
    } finally {
      setRedeeming(false);
    }
  };

  const handleShare = async () => {
    const text = `${offer.title}${Number(offer.value_rescue) > 0 ? ` - R$ ${Number(offer.value_rescue).toFixed(2)}` : ""}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: offer.title, text });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copiado!", description: "Oferta copiada para a área de transferência." });
    }
  };

  const hasWeekdayRestriction =
    offer.allowed_weekdays &&
    Array.isArray(offer.allowed_weekdays) &&
    offer.allowed_weekdays.length < 7;

  const daysLeft = offer.end_at
    ? Math.max(0, Math.ceil((new Date(offer.end_at).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ backgroundColor: "#FAFAFA" }}
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-40">
        {/* Hero image */}
        <div className="relative">
          {offer.image_url ? (
            <img src={offer.image_url} alt={offer.title} className="w-full h-64 object-cover" />
          ) : (
            <div className="w-full h-64 flex items-center justify-center" style={{ backgroundColor: `${primary}10` }}>
              <ShoppingBag className="h-16 w-16" style={{ color: `${primary}30` }} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
          <button onClick={onBack} className="absolute top-4 left-4 h-10 w-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-md">
            <ArrowLeft className="h-5 w-5" style={{ color: fg }} />
          </button>
          <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={handleShare} className="h-10 w-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-md">
              <Share2 className="h-5 w-5" style={{ color: `${fg}70` }} />
            </button>
            <motion.button whileTap={{ scale: 1.3 }} className="h-10 w-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-md">
              <Heart className="h-5 w-5" style={{ color: `${fg}50` }} />
            </motion.button>
          </div>
          {/* Badges */}
          <div className="absolute bottom-4 left-4 flex gap-1.5">
            {daysLeft !== null && daysLeft <= 3 && (
              <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: "hsl(0 72% 51%)" }}>
                <Clock className="h-3 w-3" />
                {daysLeft === 0 ? "Último dia!" : `${daysLeft} dias restantes`}
              </span>
            )}
          </div>
          {offer.likes_count > 0 && (
            <div className="absolute bottom-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 backdrop-blur text-xs font-semibold shadow-sm">
              <ThumbsUp className="h-3 w-3" style={{ color: primary }} />
              {offer.likes_count}
            </div>
          )}
        </div>

        {/* Content card */}
        <div className="relative -mt-6 mx-4 rounded-[24px] bg-white p-5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          {offer.stores?.name && (
            <div className="flex items-center gap-2 mb-3">
              {offer.stores.logo_url ? (
                <img src={offer.stores.logo_url} alt={offer.stores.name} className="h-8 w-8 rounded-lg object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primary}10` }}>
                  <Store className="h-4 w-4" style={{ color: primary }} />
                </div>
              )}
              <span className="text-sm font-medium" style={{ color: `${fg}70` }}>{offer.stores.name}</span>
            </div>
          )}
          <h1 className="text-xl font-bold mb-2" style={{ fontFamily: fontHeading }}>{offer.title}</h1>
          {offer.description && (
            <p className="text-sm leading-relaxed mb-4" style={{ color: `${fg}60` }}>{offer.description}</p>
          )}

          {/* Coupon-style value highlight */}
          {Number(offer.value_rescue) > 0 && (
            <div className="rounded-2xl overflow-hidden mb-4 border-2 border-dashed" style={{ borderColor: `${primary}30` }}>
              <div className="p-4 flex items-center justify-between" style={{ backgroundColor: `${primary}06` }}>
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: `${fg}50` }}>Valor do resgate</p>
                  <p className="text-2xl font-bold" style={{ color: primary, fontFamily: fontHeading }}>
                    R$ {Number(offer.value_rescue).toFixed(2).replace(".", ",")}
                  </p>
                </div>
                {Number(offer.min_purchase) > 0 && (
                  <div className="text-right">
                    <p className="text-[10px] font-medium" style={{ color: `${fg}40` }}>Compra mínima</p>
                    <p className="text-sm font-bold" style={{ color: `${fg}70` }}>
                      R$ {Number(offer.min_purchase).toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                )}
              </div>
              {Number(offer.discount_percent) > 0 && (
                <div className="px-4 py-2 text-center text-xs font-bold" style={{ backgroundColor: `${primary}12`, color: primary }}>
                  {offer.discount_percent}% de desconto aplicado
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rules section */}
        <div className="mx-4 mt-4 rounded-[20px] bg-white p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
          <h3 className="text-sm font-bold mb-3" style={{ fontFamily: fontHeading }}>Regras da oferta</h3>
          <div className="space-y-3">
            {offer.end_at && (
              <RuleRow icon={CalendarDays} primary={primary} fg={fg} label="Válida até"
                value={new Date(offer.end_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })} />
            )}
            {offer.start_at && (
              <RuleRow icon={Clock} primary={primary} fg={fg} label="Início"
                value={new Date(offer.start_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })} />
            )}
            {hasWeekdayRestriction && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primary}10` }}>
                  <CalendarDays className="h-4 w-4" style={{ color: primary }} />
                </div>
                <div>
                  <p className="text-xs font-semibold">Dias válidos</p>
                  <div className="flex gap-1 mt-1">
                    {WEEKDAY_LABELS.map((label, i) => {
                      const isAllowed = (offer.allowed_weekdays as number[]).includes(i);
                      return (
                        <span key={i} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                          style={{ backgroundColor: isAllowed ? `${primary}15` : `${fg}06`, color: isAllowed ? primary : `${fg}30` }}>
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {offer.allowed_hours && (
              <RuleRow icon={Clock} primary={primary} fg={fg} label="Horários" value={offer.allowed_hours} />
            )}
            {Number(offer.min_purchase) > 0 && (
              <RuleRow icon={ShoppingBag} primary={primary} fg={fg} label="Compra mínima"
                value={`R$ ${Number(offer.min_purchase).toFixed(2).replace(".", ",")}`} />
            )}
            {offer.max_daily_redemptions && (
              <RuleRow icon={AlertTriangle} primary={primary} fg={fg} label="Limite diário"
                value={`${offer.max_daily_redemptions} resgates por dia`} />
            )}
          </div>
        </div>

        {/* Similar offers */}
        {similarOffers.length > 0 && (
          <div className="mx-4 mt-4 mb-4">
            <h3 className="text-sm font-bold mb-3" style={{ fontFamily: fontHeading }}>Ofertas semelhantes</h3>
            <div className="space-y-2">
              {similarOffers.map((sim) => (
                <motion.div
                  key={sim.id}
                  whileTap={{ scale: 0.98 }}
                  className="flex gap-3 p-3 rounded-2xl bg-white cursor-pointer"
                  style={{ boxShadow: "0 1px 5px rgba(0,0,0,0.04)" }}
                  onClick={() => {
                    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                    onOfferClick?.(sim);
                  }}
                >
                  {sim.image_url ? (
                    <img src={sim.image_url} alt={sim.title} className="h-14 w-14 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primary}08` }}>
                      <ShoppingBag className="h-6 w-6" style={{ color: `${primary}30` }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    {sim.stores?.name && (
                      <p className="text-[10px] font-medium truncate" style={{ color: `${fg}45` }}>{sim.stores.name}</p>
                    )}
                    <h4 className="font-semibold text-sm truncate" style={{ fontFamily: fontHeading }}>{sim.title}</h4>
                    {Number(sim.value_rescue) > 0 && (
                      <span className="text-xs font-bold" style={{ color: primary }}>
                        R$ {Number(sim.value_rescue).toFixed(2).replace(".", ",")}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      {!redeemed && (
        <div className="fixed bottom-0 inset-x-0 z-[61] px-5 pb-6 pt-3" style={{ background: `linear-gradient(to top, #FAFAFA 60%, transparent)` }}>
          <div className="max-w-lg mx-auto">
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowConfirm(true)}
              className="w-full py-4 rounded-2xl font-bold text-base text-white shadow-lg"
              style={{ backgroundColor: primary, boxShadow: `0 8px 24px ${primary}40` }}>
              Resgatar agora
            </motion.button>
          </div>
        </div>
      )}

      {/* Redeemed PIN */}
      {redeemed && pin && (
        <div className="fixed bottom-0 inset-x-0 z-[61] px-5 pb-6 pt-3" style={{ background: `linear-gradient(to top, #FAFAFA 60%, transparent)` }}>
          <div className="max-w-lg mx-auto space-y-3">
            <div className="w-full py-4 rounded-2xl text-center" style={{ backgroundColor: "#E8F5E9" }}>
              <div className="flex items-center justify-center gap-2 mb-2" style={{ color: "#2E7D32" }}>
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-bold text-base">Resgate confirmado!</span>
              </div>
              <p className="text-xs mb-2" style={{ color: "#2E7D32" }}>Apresente este PIN ao estabelecimento:</p>
              <p className="text-4xl font-mono font-black tracking-[0.3em]" style={{ color: "#1B5E20" }}>{pin}</p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm"
              onClick={() => !redeeming && setShowConfirm(false)} />
            <motion.div
              initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 inset-x-0 z-[71] mx-4 mb-4 rounded-[28px] bg-white p-6"
              style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.12)" }}>
              {(!customer || isSigningUp) ? (
                <RedemptionSignupCarousel
                  primary={primary}
                  fg={fg}
                  fontHeading={fontHeading}
                  onComplete={(cpfFromSignup) => {
                    setCpf(formatCpf(cpfFromSignup));
                    setIsSigningUp(false);
                    setShowConfirm(false);
                    toast({ title: "Conta criada!", description: "Agora finalize seu resgate." });
                  }}
                  onCancel={() => { setIsSigningUp(false); setShowConfirm(false); }}
                  onSigningUp={() => setIsSigningUp(true)}
                />
              ) : (
                <>
                  <div className="text-center mb-5">
                    <div className="h-14 w-14 mx-auto mb-3 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${primary}12` }}>
                      <ShoppingBag className="h-7 w-7" style={{ color: primary }} />
                    </div>
                    <h3 className="text-lg font-bold mb-1" style={{ fontFamily: fontHeading }}>Confirmar resgate?</h3>
                    <p className="text-sm" style={{ color: `${fg}50` }}>
                      Você está resgatando a oferta <strong>{offer.title}</strong>
                      {Number(offer.value_rescue) > 0 && (
                        <> no valor de <strong style={{ color: primary }}>R$ {Number(offer.value_rescue).toFixed(2).replace(".", ",")}</strong></>
                      )}
                    </p>
                    {Number(offer.min_purchase) > 0 && (
                      <p className="text-xs mt-2 px-3 py-1.5 rounded-full inline-block" style={{ backgroundColor: `${fg}06`, color: `${fg}50` }}>
                        Compra mínima: R$ {Number(offer.min_purchase).toFixed(2).replace(".", ",")}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: `${fg}60` }}>CPF (obrigatório)</label>
                    <input
                      type="text" inputMode="numeric" value={cpf}
                      onChange={e => setCpf(formatCpf(e.target.value))}
                      placeholder="000.000.000-00"
                      className="w-full text-center text-lg font-mono tracking-wider px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2"
                      style={{ borderColor: `${fg}15` }}
                      maxLength={14}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowConfirm(false)} disabled={redeeming}
                      className="flex-1 py-3.5 rounded-2xl font-semibold text-sm"
                      style={{ backgroundColor: `${fg}08`, color: `${fg}70` }}>
                      Cancelar
                    </button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleRedeem}
                      disabled={redeeming || !isValidCpf(cpf)}
                      className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{ backgroundColor: primary }}>
                      {redeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RuleRow({ icon: Icon, primary, fg, label, value }: { icon: any; primary: string; fg: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primary}10` }}>
        <Icon className="h-4 w-4" style={{ color: primary }} />
      </div>
      <div>
        <p className="text-xs font-semibold">{label}</p>
        <p className="text-xs" style={{ color: `${fg}50` }}>{value}</p>
      </div>
    </div>
  );
}
