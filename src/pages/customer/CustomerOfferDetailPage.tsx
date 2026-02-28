import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomer } from "@/contexts/CustomerContext";
import type { Tables } from "@/integrations/supabase/types";
import {
  ArrowLeft,
  Clock,
  ShoppingBag,
  Heart,
  MapPin,
  CalendarDays,
  Store,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
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
}

export default function CustomerOfferDetailPage({ offer, onBack }: Props) {
  const { brand, selectedBranch, theme } = useBrand();
  const { customer } = useCustomer();
  const [showConfirm, setShowConfirm] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(false);

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  const handleRedeem = async () => {
    if (!customer || !brand || !selectedBranch) return;
    setRedeeming(true);
    try {
      const { error } = await supabase.from("redemptions").insert({
        offer_id: offer.id,
        customer_id: customer.id,
        brand_id: brand.id,
        branch_id: selectedBranch.id,
        status: "PENDING",
      });
      if (error) throw error;
      setRedeemed(true);
      toast({ title: "Resgate solicitado!", description: "Apresente o código ao estabelecimento." });
    } catch (err: any) {
      toast({ title: "Erro ao resgatar", description: err.message, variant: "destructive" });
    } finally {
      setRedeeming(false);
    }
  };

  const hasWeekdayRestriction =
    offer.allowed_weekdays &&
    Array.isArray(offer.allowed_weekdays) &&
    offer.allowed_weekdays.length < 7;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ backgroundColor: "#FAFAFA" }}
    >
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-28">
        {/* Hero image */}
        <div className="relative">
          {offer.image_url ? (
            <img
              src={offer.image_url}
              alt={offer.title}
              className="w-full h-64 object-cover"
            />
          ) : (
            <div
              className="w-full h-64 flex items-center justify-center"
              style={{ backgroundColor: `${primary}10` }}
            >
              <ShoppingBag className="h-16 w-16" style={{ color: `${primary}30` }} />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

          {/* Back button */}
          <button
            onClick={onBack}
            className="absolute top-4 left-4 h-10 w-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-md"
          >
            <ArrowLeft className="h-5 w-5" style={{ color: fg }} />
          </button>

          {/* Like button */}
          <motion.button
            whileTap={{ scale: 1.3 }}
            transition={{ type: "spring", stiffness: 400, damping: 12 }}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-md"
          >
            <Heart className="h-5 w-5" style={{ color: `${fg}50` }} />
          </motion.button>

          {/* Likes count badge */}
          {offer.likes_count > 0 && (
            <div className="absolute bottom-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 backdrop-blur text-xs font-semibold shadow-sm">
              <Heart className="h-3 w-3" style={{ color: primary }} />
              {offer.likes_count}
            </div>
          )}
        </div>

        {/* Content card overlapping image */}
        <div
          className="relative -mt-6 mx-4 rounded-[24px] bg-white p-5"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
        >
          {/* Store info */}
          {offer.stores?.name && (
            <div className="flex items-center gap-2 mb-3">
              {offer.stores.logo_url ? (
                <img
                  src={offer.stores.logo_url}
                  alt={offer.stores.name}
                  className="h-8 w-8 rounded-lg object-cover"
                />
              ) : (
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${primary}10` }}
                >
                  <Store className="h-4 w-4" style={{ color: primary }} />
                </div>
              )}
              <span className="text-sm font-medium" style={{ color: `${fg}70` }}>
                {offer.stores.name}
              </span>
            </div>
          )}

          <h1 className="text-xl font-bold mb-2" style={{ fontFamily: fontHeading }}>
            {offer.title}
          </h1>

          {offer.description && (
            <p className="text-sm leading-relaxed mb-4" style={{ color: `${fg}60` }}>
              {offer.description}
            </p>
          )}

          {/* Value highlight */}
          {Number(offer.value_rescue) > 0 && (
            <div
              className="rounded-2xl p-4 mb-4 flex items-center justify-between"
              style={{ backgroundColor: `${primary}08` }}
            >
              <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: `${fg}50` }}>
                  Valor do resgate
                </p>
                <p className="text-2xl font-bold" style={{ color: primary, fontFamily: fontHeading }}>
                  R$ {Number(offer.value_rescue).toFixed(2).replace(".", ",")}
                </p>
              </div>
              {Number(offer.min_purchase) > 0 && (
                <div className="text-right">
                  <p className="text-[10px] font-medium" style={{ color: `${fg}40` }}>
                    Compra mínima
                  </p>
                  <p className="text-sm font-bold" style={{ color: `${fg}70` }}>
                    R$ {Number(offer.min_purchase).toFixed(2).replace(".", ",")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rules section */}
        <div className="mx-4 mt-4 rounded-[20px] bg-white p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
          <h3 className="text-sm font-bold mb-3" style={{ fontFamily: fontHeading }}>
            Regras da oferta
          </h3>
          <div className="space-y-3">
            {offer.end_at && (
              <div className="flex items-start gap-3">
                <div
                  className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primary}10` }}
                >
                  <CalendarDays className="h-4 w-4" style={{ color: primary }} />
                </div>
                <div>
                  <p className="text-xs font-semibold">Válida até</p>
                  <p className="text-xs" style={{ color: `${fg}50` }}>
                    {new Date(offer.end_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}

            {offer.start_at && (
              <div className="flex items-start gap-3">
                <div
                  className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primary}10` }}
                >
                  <Clock className="h-4 w-4" style={{ color: primary }} />
                </div>
                <div>
                  <p className="text-xs font-semibold">Início</p>
                  <p className="text-xs" style={{ color: `${fg}50` }}>
                    {new Date(offer.start_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}

            {hasWeekdayRestriction && (
              <div className="flex items-start gap-3">
                <div
                  className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primary}10` }}
                >
                  <CalendarDays className="h-4 w-4" style={{ color: primary }} />
                </div>
                <div>
                  <p className="text-xs font-semibold">Dias válidos</p>
                  <div className="flex gap-1 mt-1">
                    {WEEKDAY_LABELS.map((label, i) => {
                      const isAllowed = (offer.allowed_weekdays as number[]).includes(i);
                      return (
                        <span
                          key={i}
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                          style={{
                            backgroundColor: isAllowed ? `${primary}15` : `${fg}06`,
                            color: isAllowed ? primary : `${fg}30`,
                          }}
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {offer.allowed_hours && (
              <div className="flex items-start gap-3">
                <div
                  className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primary}10` }}
                >
                  <Clock className="h-4 w-4" style={{ color: primary }} />
                </div>
                <div>
                  <p className="text-xs font-semibold">Horários</p>
                  <p className="text-xs" style={{ color: `${fg}50` }}>
                    {offer.allowed_hours}
                  </p>
                </div>
              </div>
            )}

            {Number(offer.min_purchase) > 0 && (
              <div className="flex items-start gap-3">
                <div
                  className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primary}10` }}
                >
                  <ShoppingBag className="h-4 w-4" style={{ color: primary }} />
                </div>
                <div>
                  <p className="text-xs font-semibold">Compra mínima</p>
                  <p className="text-xs" style={{ color: `${fg}50` }}>
                    R$ {Number(offer.min_purchase).toFixed(2).replace(".", ",")}
                  </p>
                </div>
              </div>
            )}

            {offer.max_daily_redemptions && (
              <div className="flex items-start gap-3">
                <div
                  className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primary}10` }}
                >
                  <AlertTriangle className="h-4 w-4" style={{ color: primary }} />
                </div>
                <div>
                  <p className="text-xs font-semibold">Limite diário</p>
                  <p className="text-xs" style={{ color: `${fg}50` }}>
                    {offer.max_daily_redemptions} resgates por dia
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      {customer && !redeemed && (
        <div
          className="fixed bottom-0 inset-x-0 z-[61] px-5 pb-6 pt-3"
          style={{
            background: `linear-gradient(to top, #FAFAFA 60%, transparent)`,
          }}
        >
          <div className="max-w-lg mx-auto">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowConfirm(true)}
              className="w-full py-4 rounded-2xl font-bold text-base text-white shadow-lg"
              style={{
                backgroundColor: primary,
                boxShadow: `0 8px 24px ${primary}40`,
              }}
            >
              Resgatar agora
            </motion.button>
          </div>
        </div>
      )}

      {/* Redeemed state */}
      {redeemed && (
        <div
          className="fixed bottom-0 inset-x-0 z-[61] px-5 pb-6 pt-3"
          style={{ background: `linear-gradient(to top, #FAFAFA 60%, transparent)` }}
        >
          <div className="max-w-lg mx-auto">
            <div className="w-full py-4 rounded-2xl font-bold text-base text-center flex items-center justify-center gap-2" style={{ backgroundColor: "#E8F5E9", color: "#2E7D32" }}>
              <CheckCircle2 className="h-5 w-5" />
              Resgate confirmado!
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm"
              onClick={() => !redeeming && setShowConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 inset-x-0 z-[71] mx-4 mb-4 rounded-[28px] bg-white p-6"
              style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.12)" }}
            >
              <div className="text-center mb-5">
                <div
                  className="h-14 w-14 mx-auto mb-3 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${primary}12` }}
                >
                  <ShoppingBag className="h-7 w-7" style={{ color: primary }} />
                </div>
                <h3 className="text-lg font-bold mb-1" style={{ fontFamily: fontHeading }}>
                  Confirmar resgate?
                </h3>
                <p className="text-sm" style={{ color: `${fg}50` }}>
                  Você está resgatando a oferta <strong>{offer.title}</strong>
                  {Number(offer.value_rescue) > 0 && (
                    <> no valor de <strong style={{ color: primary }}>
                      R$ {Number(offer.value_rescue).toFixed(2).replace(".", ",")}
                    </strong></>
                  )}
                </p>
                {Number(offer.min_purchase) > 0 && (
                  <p className="text-xs mt-2 px-3 py-1.5 rounded-full inline-block" style={{ backgroundColor: `${fg}06`, color: `${fg}50` }}>
                    Compra mínima: R$ {Number(offer.min_purchase).toFixed(2).replace(".", ",")}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={redeeming}
                  className="flex-1 py-3.5 rounded-2xl font-semibold text-sm"
                  style={{ backgroundColor: `${fg}08`, color: `${fg}70` }}
                >
                  Cancelar
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleRedeem}
                  disabled={redeeming}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2"
                  style={{ backgroundColor: primary }}
                >
                  {redeeming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Confirmar"
                  )}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
