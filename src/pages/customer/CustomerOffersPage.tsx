import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomer } from "@/contexts/CustomerContext";
import { useOfferNav, useCustomerNav } from "@/components/customer/CustomerLayout";
import type { Tables } from "@/integrations/supabase/types";
import { Loader2, Tag, Clock, ShoppingBag, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

type Offer = Tables<"offers">;

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.07, duration: 0.35, ease: "easeOut" as const },
  }),
};

export default function CustomerOffersPage() {
  const { brand, selectedBranch, theme } = useBrand();
  const { customer } = useCustomer();
  const { openOffer, isFavorite, toggleFavorite } = useCustomerNav();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  const categories = useMemo(() => {
    const cats = offers.map((o: any) => o.stores?.name).filter(Boolean) as string[];
    return [...new Set(cats)].sort();
  }, [offers]);

  const filtered = useMemo(() => selectedCat ? offers.filter((o: any) => o.stores?.name === selectedCat) : offers, [offers, selectedCat]);
  useEffect(() => {
    if (!selectedBranch || !brand) return;
    const fetchOffers = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("offers")
        .select("*, stores(name, logo_url)")
        .eq("branch_id", selectedBranch.id)
        .eq("brand_id", brand.id)
        .eq("status", "ACTIVE")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setOffers(data || []);
      setLoading(false);
    };
    fetchOffers();
  }, [selectedBranch, brand]);

  // Redemption now happens via the detail page with CPF input
  // This quick-redeem handler is kept for backwards compat but will be removed
  const handleRedeem = async (offer: Offer) => {
    if (!customer || !brand || !selectedBranch) return;
    // Redirect to detail page for CPF-required flow
    toast({ title: "Abra a oferta para resgatar", description: "Toque na oferta para informar seu CPF e gerar o PIN." });
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-5 py-6 space-y-4">
        <Skeleton className="h-7 w-24 rounded-lg" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-[20px] overflow-hidden bg-white" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <Skeleton className="h-40 w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-full rounded-lg" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-28 rounded-lg" />
                <Skeleton className="h-10 w-24 rounded-2xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-6">
      <h2 className="text-xl font-bold mb-4" style={{ fontFamily: fontHeading }}>Ofertas</h2>

      {categories.length >= 2 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4 -mx-5 px-5">
          <button
            onClick={() => setSelectedCat(null)}
            className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              backgroundColor: !selectedCat ? primary : `${fg}06`,
              color: !selectedCat ? "#fff" : `${fg}60`,
            }}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(selectedCat === cat ? null : cat)}
              className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap"
              style={{
                backgroundColor: selectedCat === cat ? primary : `${fg}06`,
                color: selectedCat === cat ? "#fff" : `${fg}60`,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center py-20 opacity-40"
        >
          <div className="h-16 w-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primary}10` }}>
            <Tag className="h-7 w-7" style={{ color: primary }} />
          </div>
          <p className="font-semibold text-base mb-1">Nenhuma oferta disponível</p>
          <p className="text-sm">Volte em breve para novas ofertas!</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filtered.map((offer, idx) => {
            const isNew = idx < 2;
            return (
              <motion.div
                key={offer.id}
                custom={idx}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileTap={{ scale: 0.98 }}
                className="rounded-[20px] overflow-hidden bg-white cursor-pointer"
                style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}
                onClick={() => openOffer(offer)}
              >
                {offer.image_url && (
                  <div className="relative">
                    <img src={offer.image_url} alt={offer.title} className="w-full h-44 object-cover" />
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      {isNew && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: primary }}>
                          <Sparkles className="h-3 w-3" /> Novo
                        </span>
                      )}
                    </div>
                    <motion.button
                      whileTap={{ scale: 1.3 }}
                      transition={{ type: "spring", stiffness: 400, damping: 12 }}
                      className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-sm"
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(offer.id); }}
                    >
                      <Heart
                        className="h-4 w-4 transition-colors"
                        fill={isFavorite(offer.id) ? primary : "none"}
                        style={{ color: isFavorite(offer.id) ? primary : `${fg}50` }}
                      />
                    </motion.button>
                  </div>
                )}

                <div className="p-4">
                  <h3 className="font-bold text-base mb-1" style={{ fontFamily: fontHeading }}>{offer.title}</h3>
                  {offer.description && (
                    <p className="text-sm line-clamp-2 mb-3" style={{ color: `${fg}60` }}>{offer.description}</p>
                  )}

                  <div className="flex items-end justify-between">
                    <div className="space-y-1">
                      {Number(offer.value_rescue) > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium" style={{ color: `${fg}50` }}>Resgate:</span>
                          <span className="text-lg font-bold" style={{ color: primary, fontFamily: fontHeading }}>
                            R$ {Number(offer.value_rescue).toFixed(2)}
                          </span>
                        </div>
                      )}
                      {Number(offer.min_purchase) > 0 && (
                        <div className="flex items-center gap-1.5">
                          <ShoppingBag className="h-3 w-3" style={{ color: `${fg}40` }} />
                          <span className="text-xs" style={{ color: `${fg}40` }}>Mínimo: R$ {Number(offer.min_purchase).toFixed(2)}</span>
                        </div>
                      )}
                      {offer.end_at && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" style={{ color: `${fg}35` }} />
                          <span className="text-xs" style={{ color: `${fg}35` }}>Até {new Date(offer.end_at).toLocaleDateString("pt-BR")}</span>
                        </div>
                      )}
                    </div>

                    {customer && (
                      <Button
                        size="sm"
                        disabled={redeeming === offer.id}
                        onClick={() => handleRedeem(offer)}
                        className="rounded-2xl font-bold text-sm px-5 h-10 shadow-sm"
                        style={{ backgroundColor: primary, color: "#fff" }}
                      >
                        {redeeming === offer.id && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                        Resgatar
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
