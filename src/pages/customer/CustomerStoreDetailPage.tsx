import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import type { Tables } from "@/integrations/supabase/types";
import {
  ArrowLeft,
  Store as StoreIcon,
  MapPin,
  Clock,
  ShoppingBag,
  Heart,
  MessageCircle,
  Phone,
  Tag,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

type StoreRow = Tables<"stores">;
type Offer = Tables<"offers">;

interface Props {
  store: StoreRow;
  onBack: () => void;
  onOfferClick?: (offer: any) => void;
}

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

export default function CustomerStoreDetailPage({ store, onBack, onOfferClick }: Props) {
  const { brand, selectedBranch, theme } = useBrand();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  useEffect(() => {
    const fetchOffers = async () => {
      setLoadingOffers(true);
      const { data } = await supabase
        .from("offers")
        .select("*")
        .eq("store_id", store.id)
        .eq("is_active", true)
        .eq("status", "ACTIVE")
        .order("created_at", { ascending: false })
        .limit(20);
      setOffers(data || []);
      setLoadingOffers(false);
    };
    fetchOffers();
  }, [store.id]);

  const whatsappUrl = store.whatsapp
    ? `https://wa.me/${store.whatsapp.replace(/\D/g, "")}`
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
      <div className="flex-1 overflow-y-auto pb-28">
        {/* Hero header */}
        <div
          className="relative w-full pt-14 pb-8 px-5"
          style={{
            background: `linear-gradient(135deg, ${primary}18 0%, ${primary}06 100%)`,
          }}
        >
          {/* Back button */}
          <button
            onClick={onBack}
            className="absolute top-4 left-4 h-10 w-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-md"
          >
            <ArrowLeft className="h-5 w-5" style={{ color: fg }} />
          </button>

          <div className="max-w-lg mx-auto flex flex-col items-center text-center">
            {store.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.name}
                className="h-20 w-20 rounded-2xl object-cover mb-3 shadow-md"
              />
            ) : (
              <div
                className="h-20 w-20 rounded-2xl flex items-center justify-center mb-3 shadow-md"
                style={{ backgroundColor: `${primary}15` }}
              >
                <StoreIcon className="h-10 w-10" style={{ color: primary }} />
              </div>
            )}

            <h1 className="text-xl font-bold mb-1" style={{ fontFamily: fontHeading }}>
              {store.name}
            </h1>

            {store.category && (
              <span
                className="text-xs font-medium px-3 py-1 rounded-full mb-2"
                style={{ backgroundColor: `${primary}12`, color: primary }}
              >
                {store.category}
              </span>
            )}
          </div>
        </div>

        {/* Info card */}
        <div
          className="relative -mt-4 mx-4 rounded-[20px] bg-white p-5"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
        >
          {store.address && (
            <div className="flex items-start gap-3 mb-3">
              <div
                className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${primary}10` }}
              >
                <MapPin className="h-4 w-4" style={{ color: primary }} />
              </div>
              <div>
                <p className="text-xs font-semibold">Endereço</p>
                <p className="text-xs" style={{ color: `${fg}55` }}>
                  {store.address}
                </p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm text-white"
                style={{ backgroundColor: "#25D366" }}
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            )}
            {store.whatsapp && (
              <a
                href={`tel:${store.whatsapp}`}
                className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-semibold text-sm"
                style={{ backgroundColor: `${fg}08`, color: `${fg}70` }}
              >
                <Phone className="h-4 w-4" />
                Ligar
              </a>
            )}
          </div>
        </div>

        {/* Offers section */}
        <div className="mx-4 mt-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold" style={{ fontFamily: fontHeading }}>
              Ofertas desta loja
            </h3>
            {!loadingOffers && (
              <span className="text-xs" style={{ color: `${fg}40` }}>
                {offers.length} {offers.length === 1 ? "oferta" : "ofertas"}
              </span>
            )}
          </div>

          {loadingOffers ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-[18px] overflow-hidden bg-white"
                  style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}
                >
                  <Skeleton className="h-32 w-full" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4 rounded-lg" />
                    <Skeleton className="h-3 w-1/2 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : offers.length === 0 ? (
            <div className="text-center py-12 opacity-40">
              <div
                className="h-14 w-14 mx-auto mb-3 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${primary}10` }}
              >
                <Tag className="h-6 w-6" style={{ color: primary }} />
              </div>
              <p className="text-sm font-medium">Nenhuma oferta disponível</p>
              <p className="text-xs mt-1" style={{ color: `${fg}40` }}>
                Fique de olho, novas ofertas podem surgir!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {offers.map((offer, idx) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  className="rounded-[18px] overflow-hidden bg-white cursor-pointer"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
                  onClick={() => onOfferClick?.({ ...offer, stores: { name: store.name, logo_url: store.logo_url } })}
                >
                  <div className="flex">
                    {offer.image_url ? (
                      <img
                        src={offer.image_url}
                        alt={offer.title}
                        className="w-28 h-28 object-cover flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="w-28 h-28 flex-shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: `${primary}06` }}
                      >
                        <ShoppingBag className="h-8 w-8" style={{ color: `${primary}30` }} />
                      </div>
                    )}

                    <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            className="font-semibold text-sm line-clamp-2"
                            style={{ fontFamily: fontHeading }}
                          >
                            {offer.title}
                          </h4>
                          {idx < 2 && (
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
                              style={{ backgroundColor: primary }}
                            >
                              Novo
                            </span>
                          )}
                        </div>
                        {offer.description && (
                          <p
                            className="text-[11px] line-clamp-1 mt-0.5"
                            style={{ color: `${fg}45` }}
                          >
                            {offer.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        {Number(offer.value_rescue) > 0 && (
                          <span
                            className="font-bold text-sm"
                            style={{ color: primary, fontFamily: fontHeading }}
                          >
                            R$ {Number(offer.value_rescue).toFixed(2).replace(".", ",")}
                          </span>
                        )}
                        {offer.end_at && (
                          <div
                            className="flex items-center gap-0.5 text-[10px]"
                            style={{ color: `${fg}35` }}
                          >
                            <Clock className="h-2.5 w-2.5" />
                            {new Date(offer.end_at).toLocaleDateString("pt-BR")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
