import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { recordGanhaGanhaBillingEvent } from "@/lib/ganhaGanhaBilling";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomer } from "@/contexts/CustomerContext";
import type { Tables } from "@/integrations/supabase/types";
import {
  ArrowLeft, Clock, ShoppingBag, Heart, CalendarDays, Store, Loader2,
  CheckCircle2, AlertTriangle, Share2, Copy, Sparkles, ThumbsUp,
  MapPin, Ban, Globe, MessageCircle, DollarSign, Tag,
} from "lucide-react";
import RedemptionSignupCarousel from "@/components/customer/RedemptionSignupCarousel";
import CustomerRedemptionDetailPage from "@/pages/customer/CustomerRedemptionDetailPage";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { translateError } from "@/lib/translateError";

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
  const [redemptionStep, setRedemptionStep] = useState<"terms" | "cpf">("terms");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(false);
  const [cpf, setCpf] = useState("");
  
  const [pin, setPin] = useState<string | null>(null);
  const [completedRedemption, setCompletedRedemption] = useState<any>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [similarOffers, setSimilarOffers] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [contentKey, setContentKey] = useState(offer.id);
  const [isFading, setIsFading] = useState(false);

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

  // Calculate required points for redemption
  const getRequiredPoints = () => {
    return Math.round(Number(offer.value_rescue) || 0);
  };

  const requiredPoints = getRequiredPoints();
  const customerPoints = Math.round(customer?.points_balance || 0);
  const hasEnoughPoints = customerPoints >= requiredPoints;

  // Pre-calculated product values for PRODUCT offers
  const discountPctOffer = Number(offer.discount_percent) || 0;
  const termsParamsOffer = offer.terms_params_json as any;
  const productPriceOffer = termsParamsOffer?.product_price
    ? Number(termsParamsOffer.product_price)
    : (discountPctOffer > 0 && Number(offer.value_rescue) > 0)
      ? Number(offer.value_rescue) / (discountPctOffer / 100)
      : Number(offer.value_rescue) || 0;
  const creditAmountOffer = Number(offer.value_rescue) || 0;
  const remainingAfterCredit = Math.max(0, productPriceOffer - creditAmountOffer);

  const handleRedeem = async () => {
    if (!brand || !selectedBranch) return;
    if (!isValidCpf(cpf)) {
      toast({ title: "CPF inválido", description: "Informe os 11 dígitos do CPF.", variant: "destructive" });
      return;
    }

    // Points balance validation
    const finalRequired = getRequiredPoints();
    if (finalRequired > 0 && customerPoints < finalRequired) {
      toast({
        title: "Saldo insuficiente",
        description: `Você precisa de ${finalRequired.toLocaleString("pt-BR")} pontos, mas possui apenas ${customerPoints.toLocaleString("pt-BR")}.`,
        variant: "destructive",
      });
      return;
    }

    setRedeeming(true);
    try {
      // Ensure we have a valid authenticated session
      const { data: sessionData } = await supabase.auth.getSession();
      let activeSession = sessionData.session;

      if (!activeSession) {
        // Try refreshing
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          toast({ title: "Sessão expirada", description: "Faça login novamente para resgatar.", variant: "destructive" });
          setRedeeming(false);
          return;
        }
        activeSession = refreshData.session;
      }

      // Verify customer belongs to current user
      if (!customer || customer.user_id !== activeSession.user.id) {
        toast({ title: "Erro de autenticação", description: "Faça login novamente para resgatar.", variant: "destructive" });
        setRedeeming(false);
        return;
      }

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

      const parsedProductValue = offer.coupon_type === "PRODUCT" ? productPriceOffer : undefined;
      const creditApplied = offer.coupon_type === "PRODUCT" ? creditAmountOffer : undefined;

      const { data: created, error } = await supabase.from("redemptions").insert({
        offer_id: offer.id,
        customer_id: customer.id,
        brand_id: brand.id,
        branch_id: selectedBranch.id,
        status: "PENDING",
        customer_cpf: cpf.replace(/\D/g, ""),
        offer_snapshot_json: offerSnapshot as any,
        purchase_value: parsedProductValue || null,
        credit_value_applied: creditApplied || null,
      }).select("id, token").single();
      if (error) throw error;
      setPin(created.token);

      // ── Deduct points from customer balance ──
      if (finalRequired > 0) {
        // 1. Insert debit entry in points_ledger
        await supabase.from("points_ledger").insert({
          customer_id: customer.id,
          brand_id: brand.id,
          branch_id: selectedBranch.id,
          entry_type: "DEBIT" as any,
          points_amount: finalRequired,
          money_amount: 0,
          reference_type: "REDEMPTION" as any,
          reference_id: created.id,
          reason: `Resgate: ${offer.title}`,
          created_by_user_id: (await supabase.auth.getUser()).data.user!.id,
        });

        // 2. Decrement customer balance
        await supabase.from("customers").update({
          points_balance: Math.max(0, customerPoints - finalRequired),
        }).eq("id", customer.id);
      }

      // Fetch the full redemption record to show the detail page
      const { data: fullRedemption } = await supabase
        .from("redemptions")
        .select("*, offers(*, stores(name, logo_url, address, whatsapp, site_url, instagram))")
        .eq("id", created.id)
        .single();

      setRedeemed(true);
      setShowConfirm(false);
      if (fullRedemption) {
        setCompletedRedemption(fullRedemption);
      }

      // Record Ganha-Ganha billing event for the redemption (fire-and-forget)
      if (finalRequired > 0) {
        recordGanhaGanhaBillingEvent({
          brandId: brand.id,
          storeId: offer.store_id,
          eventType: "REDEEM",
          pointsAmount: finalRequired,
          referenceId: created.id,
          referenceType: "REDEMPTION",
        });
      }

      toast({ title: "Resgate solicitado!", description: "Apresente o PIN ao estabelecimento." });
    } catch (err: any) {
      toast({ title: "Erro ao resgatar", description: translateError(err.message), variant: "destructive" });
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
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pb-40 transition-opacity duration-300"
        style={{ opacity: isFading ? 0 : 1 }}
      >
        {(() => {
          const isProduct = offer.coupon_type === "PRODUCT";
          const termsParams = offer.terms_params_json as any;
          const discountPct = Number(offer.discount_percent) || 0;
          // Product price: try terms_params_json first, then fall back to value_rescue / (discount/100)
          const productPrice = termsParams?.product_price
            ? Number(termsParams.product_price)
            : (discountPct > 0 && Number(offer.value_rescue) > 0)
              ? Number(offer.value_rescue) / (discountPct / 100)
              : Number(offer.value_rescue) || 0;
          const pointsValue = discountPct > 0 && productPrice > 0
            ? Math.round((discountPct / 100) * productPrice)
            : Math.round(Number(offer.value_rescue) || 0);
          const creditAmount = discountPct > 0 && productPrice > 0
            ? (discountPct / 100) * productPrice
            : Number(offer.value_rescue) || 0;

          if (isProduct) {
            return (
              <>
                {/* Store banner */}
                <div className="relative">
                  {offer.stores?.logo_url ? (
                    <div className="w-full h-48 flex items-center justify-center" style={{ backgroundColor: `${primary}08` }}>
                      <img src={offer.stores.logo_url} alt={offer.stores?.name} className="max-h-32 max-w-[80%] object-contain" />
                    </div>
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center" style={{ backgroundColor: `${primary}10` }}>
                      <Store className="h-16 w-16" style={{ color: `${primary}30` }} />
                    </div>
                  )}
                  <button onClick={onBack} className="absolute top-4 left-4 h-10 w-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center shadow-md">
                    <ArrowLeft className="h-5 w-5" style={{ color: fg }} />
                  </button>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={handleShare} className="h-10 w-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center shadow-md">
                      <Share2 className="h-5 w-5" style={{ color: `${fg}70` }} />
                    </button>
                    <motion.button whileTap={{ scale: 1.3 }} className="h-10 w-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center shadow-md">
                      <Heart className="h-5 w-5" style={{ color: `${fg}50` }} />
                    </motion.button>
                  </div>
                  {/* Store logo circle overlay */}
                  {offer.stores?.logo_url && (
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
                      <div className="h-16 w-16 rounded-2xl bg-card shadow-lg border-2 border-card overflow-hidden">
                        <img src={offer.stores.logo_url} alt={offer.stores?.name} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Store name */}
                <div className="text-center pt-10 pb-2">
                  <p className="text-base font-bold" style={{ color: fg, fontFamily: fontHeading }}>
                    {offer.stores?.name || "Loja"}
                  </p>
                </div>

                {/* Product image with badge */}
                <div className="mx-4 mt-2 relative rounded-2xl overflow-hidden" style={{ boxShadow: "0 2px 16px hsl(var(--foreground) / 0.08)" }}>
                  {discountPct > 0 && (
                    <span className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: primary }}>
                      {discountPct}% COM PONTOS
                    </span>
                  )}
                  {offer.image_url ? (
                    <img src={offer.image_url} alt={offer.title} className="w-full h-72 object-cover" />
                  ) : (
                    <div className="w-full h-72 flex items-center justify-center" style={{ backgroundColor: `${primary}06` }}>
                      <ShoppingBag className="h-20 w-20" style={{ color: `${primary}20` }} />
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div className="mx-4 mt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{offer.stores?.name}</span>
                  </div>
                  <h1 className="text-xl font-bold mb-1" style={{ fontFamily: fontHeading }}>{offer.title}</h1>
                  {offer.description && (
                    <p className="text-sm leading-relaxed mb-2" style={{ color: `${fg}60` }}>{offer.description}</p>
                  )}
                  {productPrice > 0 && (
                    <div className="mb-4">
                      <p className="text-xs" style={{ color: `${fg}50` }}>Preço</p>
                      <p className="text-2xl font-bold" style={{ fontFamily: fontHeading }}>
                        R$ {Number(productPrice).toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                  )}
                </div>

                {/* Pague com Pontos card */}
                {discountPct > 0 && (
                   <div className="mx-4 mt-2 rounded-2xl p-4 bg-amber-50 dark:bg-amber-950/30" style={{
                     border: "2px solid hsl(var(--chart-4, 45 93% 58%))",
                   }}>
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="h-5 w-5" style={{ color: "#E65100" }} />
                      <span className="text-base font-bold" style={{ color: "#E65100" }}>Pague com Pontos</span>
                    </div>
                    <div className="flex gap-3 mb-3">
                      <div className="flex-1 rounded-xl p-3 text-center bg-card/70">
                        <p className="text-[11px] font-medium" style={{ color: `${fg}50` }}>Você pode usar</p>
                        <p className="text-3xl font-bold" style={{ color: "#E65100" }}>{discountPct}%</p>
                        <p className="text-[11px]" style={{ color: `${fg}50` }}>do valor em pontos</p>
                      </div>
                      <div className="flex-1 rounded-xl p-3 text-center" style={{ backgroundColor: "#FFD54F" }}>
                        <p className="text-[11px] font-medium" style={{ color: `${fg}70` }}>Equivale a</p>
                        <p className="text-3xl font-bold" style={{ color: fg }}>{pointsValue}</p>
                        <p className="text-[11px]" style={{ color: `${fg}70` }}>pontos</p>
                      </div>
                    </div>
                    <p className="text-xs" style={{ color: `${fg}60` }}>
                      Ao resgatar, você receberá um cupom de desconto de{" "}
                      <strong style={{ color: "#E65100" }}>R$ {creditAmount.toFixed(2).replace(".", ",")}</strong>{" "}
                      para usar na compra deste produto.
                    </p>
                  </div>
                )}

                {/* Informações */}
                <div className="mx-4 mt-4 mb-4">
                  <h3 className="text-base font-bold mb-3" style={{ fontFamily: fontHeading }}>Informações</h3>
                  <div className="space-y-3">
                    {offer.end_at && (
                      <RuleRow icon={Clock} primary={primary} fg={fg} label="Validade"
                        value={`até ${new Date(offer.end_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}`} />
                    )}
                    {offer.is_cumulative === false && (
                      <RuleRow icon={AlertTriangle} primary={primary} fg={fg} label="Atenção"
                        value="Oferta não cumulativa com outras promoções" />
                    )}
                    {offer.redemption_type && (
                      <RuleRow icon={MapPin} primary={primary} fg={fg} label="Resgate"
                        value={offer.redemption_type === "SITE" ? "Válido para compras online" :
                          offer.redemption_type === "WHATSAPP" ? "Resgate via WhatsApp" :
                            "Válido somente na loja física"} />
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
                    {offer.max_daily_redemptions && (
                      <RuleRow icon={AlertTriangle} primary={primary} fg={fg} label="Limite diário"
                        value={`${offer.max_daily_redemptions} resgates por dia`} />
                    )}
                  </div>
                </div>

                {/* Similar offers */}
                {similarOffers.length > 0 && (
                  <div className="mx-4 mt-2 mb-4">
                    <h3 className="text-sm font-bold mb-3" style={{ fontFamily: fontHeading }}>Ofertas semelhantes</h3>
                    <div className="space-y-2">
                      {similarOffers.map((sim) => (
                        <motion.div
                          key={sim.id}
                          whileTap={{ scale: 0.98 }}
                          className="flex gap-3 p-3 rounded-2xl bg-card cursor-pointer"
                          style={{ boxShadow: "0 1px 5px rgba(0,0,0,0.04)" }}
                          onClick={() => {
                            setIsFading(true);
                            setTimeout(() => {
                              scrollRef.current?.scrollTo({ top: 0 });
                              onOfferClick?.(sim);
                              setIsFading(false);
                            }, 250);
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
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          }

          // ── STORE type (original layout) ──
          return (
            <>
              {/* Hero image */}
              <div className="relative">
                {offer.image_url ? (
                  <img src={offer.image_url} alt={offer.title} className="w-full h-64 object-cover" />
                ) : offer.stores?.logo_url ? (
                  <img src={offer.stores.logo_url} alt={offer.stores?.name} className="w-full h-64 object-cover" />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center" style={{ backgroundColor: `${primary}10` }}>
                    <ShoppingBag className="h-16 w-16" style={{ color: `${primary}30` }} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
                <button onClick={onBack} className="absolute top-4 left-4 h-10 w-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center shadow-md">
                  <ArrowLeft className="h-5 w-5" style={{ color: fg }} />
                </button>
                <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={handleShare} className="h-10 w-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center shadow-md">
                    <Share2 className="h-5 w-5" style={{ color: `${fg}70` }} />
                  </button>
                  <motion.button whileTap={{ scale: 1.3 }} className="h-10 w-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center shadow-md">
                    <Heart className="h-5 w-5" style={{ color: `${fg}50` }} />
                  </motion.button>
                </div>
                {daysLeft !== null && daysLeft <= 3 && (
                  <div className="absolute bottom-4 left-4">
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: "hsl(0 72% 51%)" }}>
                      <Clock className="h-3 w-3" />
                      {daysLeft === 0 ? "Último dia!" : `${daysLeft} dias restantes`}
                    </span>
                  </div>
                )}
                {offer.likes_count > 0 && (
                  <div className="absolute bottom-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-card/80 backdrop-blur text-xs font-semibold shadow-sm">
                    <ThumbsUp className="h-3 w-3" style={{ color: primary }} />
                    {offer.likes_count}
                  </div>
                )}
              </div>

              {/* Content card */}
              <div className="relative -mt-6 mx-4 rounded-[24px] bg-card p-5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
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

                {/* Vale Resgate value highlight */}
                {Number(offer.value_rescue) > 0 && (
                  <div className="rounded-2xl overflow-hidden mb-4 border-2 border-dashed" style={{ borderColor: `${primary}30` }}>
                    <div className="p-4 flex items-center justify-between" style={{ backgroundColor: `${primary}06` }}>
                      <div>
                        <p className="text-xs font-medium mb-0.5" style={{ color: `${fg}50` }}>Vale Resgate em Crédito</p>
                        <p className="text-2xl font-bold" style={{ color: primary, fontFamily: fontHeading }}>
                          R$ {Number(offer.value_rescue).toFixed(2).replace(".", ",")}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: `${fg}50` }}>crédito condicionado à compra mínima</p>
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
              <div className="mx-4 mt-4 rounded-[20px] bg-card p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
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
                        className="flex gap-3 p-3 rounded-2xl bg-card cursor-pointer"
                        style={{ boxShadow: "0 1px 5px rgba(0,0,0,0.04)" }}
                        onClick={() => {
                          setIsFading(true);
                          setTimeout(() => {
                            scrollRef.current?.scrollTo({ top: 0 });
                            onOfferClick?.(sim);
                            setIsFading(false);
                          }, 250);
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
            </>
          );
        })()}
      </div>

      {/* Sticky CTA - Product type */}
      {!redeemed && offer.coupon_type === "PRODUCT" && (
        <div className="fixed bottom-0 inset-x-0 z-[61] px-5 pb-6 pt-3" style={{ background: `linear-gradient(to top, hsl(var(--background)) 60%, transparent)` }}>
          <div className="max-w-lg mx-auto">
            {customer && (
              <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-sm" style={{ color: `${fg}50` }}>Seu saldo:</span>
                <span className="text-sm font-bold" style={{ color: customerPoints > 0 ? primary : "#DC2626" }}>
                  {customerPoints.toLocaleString("pt-BR")} pontos
                </span>
              </div>
            )}
            {customer && customerPoints <= 0 ? (
              <div className="w-full py-4 rounded-2xl font-bold text-sm text-center"
                style={{ backgroundColor: `${fg}08`, color: `${fg}40` }}>
                🔒 Você precisa acumular pontos para resgatar
              </div>
            ) : (
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => {
                setRedemptionStep("terms");
                setTermsAccepted(false);
                setIsSigningUp(false);
                setShowConfirm(true);
              }}
                className="w-full py-4 rounded-2xl font-bold text-base shadow-lg"
                style={{ backgroundColor: "#FFD54F", color: "hsl(var(--foreground))", boxShadow: "0 8px 24px rgba(255,213,79,0.4)" }}>
                PAGUE {offer.discount_percent}% COM PONTOS
              </motion.button>
            )}
          </div>
        </div>
      )}

      {/* Sticky CTA - Store type */}
      {!redeemed && offer.coupon_type !== "PRODUCT" && (
        <div className="fixed bottom-0 inset-x-0 z-[61] px-5 pb-6 pt-3" style={{ background: `linear-gradient(to top, hsl(var(--background)) 60%, transparent)` }}>
          <div className="max-w-lg mx-auto">
            {customer && (
              <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-sm" style={{ color: `${fg}50` }}>Seu saldo:</span>
                <span className="text-sm font-bold" style={{ color: customerPoints >= requiredPoints ? primary : "#DC2626" }}>
                  {customerPoints.toLocaleString("pt-BR")} pontos
                </span>
              </div>
            )}
            {customer && requiredPoints > 0 && customerPoints < requiredPoints ? (
              <div className="w-full py-4 rounded-2xl text-center space-y-1"
                style={{ backgroundColor: "#FEF2F2", border: "1.5px solid #FECACA" }}>
                <p className="text-sm font-bold" style={{ color: "#991B1B" }}>
                  🔒 Saldo insuficiente
                </p>
                <p className="text-xs" style={{ color: "#B91C1C" }}>
                  Necessário: {requiredPoints.toLocaleString("pt-BR")} pts · Faltam {(requiredPoints - customerPoints).toLocaleString("pt-BR")} pts
                </p>
              </div>
            ) : (
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => {
                setRedemptionStep("terms");
                setTermsAccepted(false);
                setIsSigningUp(false);
                setShowConfirm(true);
              }}
                className="w-full py-4 rounded-2xl font-bold text-base text-white shadow-lg"
                style={{ backgroundColor: primary, boxShadow: `0 8px 24px ${primary}40` }}>
                {Number(offer.value_rescue) > 0
                  ? `Resgate R$ ${Number(offer.value_rescue).toFixed(2).replace(".", ",")} em crédito`
                  : "Resgatar agora"}
              </motion.button>
            )}
          </div>
        </div>
      )}

      {/* Completed Redemption → Full Detail Page */}
      <AnimatePresence>
        {completedRedemption && (
          <CustomerRedemptionDetailPage
            redemption={completedRedemption}
            onBack={() => {
              setCompletedRedemption(null);
              onBack();
            }}
          />
        )}
      </AnimatePresence>

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
              className="fixed bottom-0 inset-x-0 z-[71] mx-4 mb-4 rounded-[28px] bg-card overflow-hidden"
              style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.12)", maxHeight: "85vh" }}>

              {isSigningUp ? (
                <div className="p-6">
                  <RedemptionSignupCarousel
                    primary={primary}
                    fg={fg}
                    fontHeading={fontHeading}
                    onComplete={(cpfFromSignup) => {
                      setCpf(formatCpf(cpfFromSignup));
                      setIsSigningUp(false);
                      setRedemptionStep("cpf");
                      toast({ title: "Conta criada!", description: "Agora confirme o resgate." });
                    }}
                    onCancel={() => {
                      setIsSigningUp(false);
                      setRedemptionStep("terms");
                    }}
                    onSigningUp={() => setIsSigningUp(true)}
                  />
                </div>
              ) : redemptionStep === "terms" ? (
                /* ── TERMS STEP ── */
                <div className="flex flex-col" style={{ maxHeight: "85vh" }}>
                  <div className="overflow-y-auto flex-1 p-6 pb-0">
                    {/* Store header */}
                    <div className="flex items-center gap-3 mb-4">
                      {offer.stores?.logo_url ? (
                        <img src={offer.stores.logo_url} alt={offer.stores?.name} className="h-12 w-12 rounded-2xl object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${primary}10` }}>
                          <Store className="h-6 w-6" style={{ color: primary }} />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium" style={{ color: `${fg}60` }}>{offer.stores?.name || "Loja"}</p>
                        <p className="text-lg font-bold" style={{ fontFamily: fontHeading }}>
                          {offer.coupon_type === "PRODUCT"
                            ? `Pague ${offer.discount_percent}% com Pontos`
                            : Number(offer.value_rescue) > 0
                              ? `Vale Resgate de R$ ${Number(offer.value_rescue).toFixed(2).replace(".", ",")} em crédito`
                              : offer.title}
                        </p>
                      </div>
                    </div>

                    {/* Redemption type badge */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primary}12` }}>
                        {offer.redemption_type === "ONLINE" ? <Globe className="h-4 w-4" style={{ color: primary }} /> :
                          offer.redemption_type === "WHATSAPP" ? <MessageCircle className="h-4 w-4" style={{ color: primary }} /> :
                            <MapPin className="h-4 w-4" style={{ color: primary }} />}
                      </div>
                      <span className="text-sm font-semibold" style={{ color: fg }}>
                        {offer.redemption_type === "ONLINE" ? "Resgate Online (Site)" :
                          offer.redemption_type === "WHATSAPP" ? "Resgate via WhatsApp" :
                            "Resgate em Loja Física"}
                      </span>
                    </div>

                    {/* Value card */}
                    {Number(offer.value_rescue) > 0 && (
                      <div className="rounded-2xl p-4 mb-4 flex items-center gap-3" style={{ backgroundColor: `${primary}06`, border: `1.5px solid ${primary}15` }}>
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primary}15` }}>
                          <span className="text-lg font-bold" style={{ color: primary }}>$</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold tracking-wider" style={{ color: `${fg}50` }}>VALOR A SER RESGATADO</p>
                          <p className="text-xl font-bold" style={{ color: primary, fontFamily: fontHeading }}>
                            R$ {Number(offer.value_rescue).toFixed(2).replace(".", ",")}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Rules card */}
                    <div className="rounded-2xl p-4 mb-4 space-y-3 bg-muted" style={{ border: `1px solid ${fg}08` }}>
                      <p className="text-[11px] font-bold tracking-wider" style={{ color: `${fg}50` }}>REGRAS DE USO</p>
                      {Number(offer.min_purchase) > 0 && (
                        <TermsRuleItem icon={<ShoppingBag className="h-4 w-4" style={{ color: primary }} />} primary={primary}>
                          Compra mínima de R$ {Number(offer.min_purchase).toFixed(2).replace(".", ",")}
                        </TermsRuleItem>
                      )}
                      {offer.is_cumulative === false && (
                        <TermsRuleItem icon={<Ban className="h-4 w-4" style={{ color: primary }} />} primary={primary}>
                          Não cumulativa com outras ofertas
                        </TermsRuleItem>
                      )}
                      {offer.end_at && (
                        <TermsRuleItem icon={<CalendarDays className="h-4 w-4" style={{ color: primary }} />} primary={primary}>
                          Válida até {new Date(offer.end_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                        </TermsRuleItem>
                      )}
                      {hasWeekdayRestriction && (
                        <TermsRuleItem icon={<CalendarDays className="h-4 w-4" style={{ color: primary }} />} primary={primary}>
                          Dias: {(offer.allowed_weekdays as number[]).map(d => WEEKDAY_LABELS[d]).join(", ")}
                        </TermsRuleItem>
                      )}
                      {offer.allowed_hours && (
                        <TermsRuleItem icon={<Clock className="h-4 w-4" style={{ color: primary }} />} primary={primary}>
                          Horários: {offer.allowed_hours}
                        </TermsRuleItem>
                      )}
                      {offer.max_uses_per_customer && (
                        <TermsRuleItem icon={<AlertTriangle className="h-4 w-4" style={{ color: primary }} />} primary={primary}>
                          Máximo {offer.max_uses_per_customer} uso(s) por cliente
                        </TermsRuleItem>
                      )}
                      {offer.max_daily_redemptions && (
                        <TermsRuleItem icon={<AlertTriangle className="h-4 w-4" style={{ color: primary }} />} primary={primary}>
                          Limite de {offer.max_daily_redemptions} resgate(s) por dia
                        </TermsRuleItem>
                      )}
                      {offer.redemption_type && (
                        <TermsRuleItem icon={<MapPin className="h-4 w-4" style={{ color: primary }} />} primary={primary}>
                          {offer.redemption_type === "ONLINE" ? "Válido para compras online" :
                            offer.redemption_type === "WHATSAPP" ? "Resgate via WhatsApp" :
                              "Válido em loja física"}
                        </TermsRuleItem>
                      )}
                    </div>

                    {/* Terms text */}
                    {offer.terms_text && (
                      <div className="rounded-2xl p-4 mb-4 text-xs leading-relaxed" style={{ backgroundColor: `${fg}04`, color: `${fg}60`, border: `1px solid ${fg}06` }}>
                        {offer.terms_text}
                      </div>
                    )}

                    {/* Checkbox accept */}
                    <label className="flex items-start gap-3 mb-4 cursor-pointer select-none">
                      <div
                        onClick={() => setTermsAccepted(!termsAccepted)}
                        className="h-6 w-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
                        style={{
                          borderColor: termsAccepted ? primary : `${fg}25`,
                          backgroundColor: termsAccepted ? primary : "transparent",
                        }}
                      >
                        {termsAccepted && <CheckCircle2 className="h-4 w-4 text-white" />}
                      </div>
                      <span className="text-sm" style={{ color: `${fg}70` }}>
                        Li e aceito os <strong>termos e condições</strong> desta oferta
                      </span>
                    </label>
                  </div>

                  {/* Buttons */}
                  <div className="p-6 pt-3 flex gap-3">
                    <button onClick={() => setShowConfirm(false)}
                      className="flex-1 py-3.5 rounded-2xl font-semibold text-sm"
                      style={{ backgroundColor: `${fg}08`, color: `${fg}70` }}>
                      Cancelar
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        if (!termsAccepted) return;
                        if (customer) {
                          setRedemptionStep("cpf");
                        } else {
                          setIsSigningUp(true);
                        }
                      }}
                      disabled={!termsAccepted}
                      className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white disabled:opacity-40"
                      style={{ backgroundColor: primary }}
                    >
                      Confirmar Resgate
                    </motion.button>
                  </div>
                </div>
              ) : !customer ? (
                <div className="p-6">
                  <RedemptionSignupCarousel
                    primary={primary}
                    fg={fg}
                    fontHeading={fontHeading}
                    onComplete={(cpfFromSignup) => {
                      setCpf(formatCpf(cpfFromSignup));
                      setIsSigningUp(false);
                      setRedemptionStep("cpf");
                      toast({ title: "Conta criada!", description: "Agora confirme o resgate." });
                    }}
                    onCancel={() => {
                      setIsSigningUp(false);
                      setRedemptionStep("terms");
                    }}
                    onSigningUp={() => setIsSigningUp(true)}
                  />
                </div>
              ) : (
                /* ── CPF STEP ── */
                <div className="p-6">
                  <div className="text-center mb-5">
                    <div className="h-14 w-14 mx-auto mb-3 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${primary}12` }}>
                      <ShoppingBag className="h-7 w-7" style={{ color: primary }} />
                    </div>
                    <h3 className="text-lg font-bold mb-1" style={{ fontFamily: fontHeading }}>
                      {offer.coupon_type === "PRODUCT" ? `Pague ${offer.discount_percent}% com Pontos` : "Confirmar resgate"}
                    </h3>
                    <p className="text-sm" style={{ color: `${fg}50` }}>
                      {offer.coupon_type === "PRODUCT" ? (
                        <>Confira os valores e informe seu CPF para gerar o cupom</>
                      ) : (
                        <>
                          Você está resgatando{" "}
                          {Number(offer.value_rescue) > 0 ? (
                            <><strong style={{ color: primary }}>R$ {Number(offer.value_rescue).toFixed(2).replace(".", ",")}</strong> em crédito</>
                          ) : (
                            <>a oferta <strong>{offer.title}</strong></>
                          )}
                        </>
                      )}
                    </p>
                    {offer.coupon_type !== "PRODUCT" && Number(offer.min_purchase) > 0 && (
                      <p className="text-xs mt-2 px-3 py-1.5 rounded-full inline-block" style={{ backgroundColor: `${fg}06`, color: `${fg}50` }}>
                        Compra mínima: R$ {Number(offer.min_purchase).toFixed(2).replace(".", ",")}
                      </p>
                    )}
                  </div>

                  {/* Product value summary - for PRODUCT offers */}
                  {offer.coupon_type === "PRODUCT" && (
                    <div className="mb-4 space-y-2">
                      {/* Product price */}
                      <div className="rounded-2xl p-3 flex justify-between items-center" style={{ backgroundColor: `${fg}04`, border: `1px solid ${fg}08` }}>
                        <span className="text-sm" style={{ color: `${fg}60` }}>Valor do produto</span>
                        <span className="text-sm font-bold" style={{ color: fg }}>
                          R$ {productPriceOffer.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                      {/* Credit applied */}
                      <div className="rounded-2xl p-3 flex justify-between items-center" style={{ backgroundColor: `${primary}06`, border: `1.5px solid ${primary}15` }}>
                        <span className="text-sm" style={{ color: `${fg}60` }}>Desconto ({discountPctOffer}% em pontos)</span>
                        <span className="text-sm font-bold" style={{ color: primary }}>
                          - R$ {creditAmountOffer.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                      {/* Remaining to pay */}
                      <div className="rounded-2xl p-3 flex justify-between items-center bg-amber-50 dark:bg-amber-950/30" style={{ border: "1.5px solid hsl(var(--chart-4, 45 93% 58%))" }}>
                        <span className="text-sm font-semibold" style={{ color: `${fg}80` }}>Você paga</span>
                        <span className="text-lg font-bold" style={{ color: "#E65100" }}>
                          R$ {remainingAfterCredit.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                      {/* Points cost */}
                      <div className="rounded-xl p-2 text-center">
                        <span className="text-xs" style={{ color: `${fg}50` }}>
                          Custo: <strong style={{ color: primary }}>{requiredPoints.toLocaleString("pt-BR")} pontos</strong>
                        </span>
                        {!hasEnoughPoints && (
                          <p className="text-xs font-bold mt-1" style={{ color: "#991B1B" }}>
                            🔒 Saldo insuficiente — faltam {(requiredPoints - customerPoints).toLocaleString("pt-BR")} pontos
                          </p>
                        )}
                      </div>
                    </div>
                  )}

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
                    <button onClick={() => setRedemptionStep("terms")} disabled={redeeming}
                      className="flex-1 py-3.5 rounded-2xl font-semibold text-sm"
                      style={{ backgroundColor: `${fg}08`, color: `${fg}70` }}>
                      Voltar
                    </button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleRedeem}
                      disabled={redeeming || !isValidCpf(cpf) || !hasEnoughPoints}
                      className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{ backgroundColor: primary }}>
                      {redeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
                    </motion.button>
                  </div>
                </div>
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

function TermsRuleItem({ icon, children, primary }: { icon: React.ReactNode; children: React.ReactNode; primary: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primary}10` }}>
        {icon}
      </div>
      <span className="text-sm" style={{ color: "hsl(var(--foreground) / 0.7)" }}>{children}</span>
    </div>
  );
}
