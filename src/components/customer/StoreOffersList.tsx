import React from "react";
import { ShoppingBag, Clock, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import SafeImage from "@/components/customer/SafeImage";
import type { Tables } from "@/integrations/supabase/types";

type Offer = Tables<"offers">;

interface OfferCardProps {
  offer: Offer;
  storeName: string;
  storeLogoUrl: string | null;
  primary: string;
  fontHeading: string;
  isDark: boolean;
  isNew: boolean;
  index: number;
  onClick: () => void;
}

export const StoreOfferCard = React.memo(function StoreOfferCard({
  offer, storeName, storeLogoUrl, primary, fontHeading, isDark, isNew, index, onClick,
}: OfferCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="rounded-[18px] overflow-hidden bg-card cursor-pointer"
      style={{ boxShadow: "0 2px 12px hsl(var(--foreground) / 0.04)" }}
      onClick={onClick}
    >
      <div className="flex">
        <SafeImage
          src={offer.image_url}
          fallbackSrc={storeLogoUrl}
          alt={offer.title}
          className="w-28 h-28 object-cover flex-shrink-0"
          fallback={
            <div
              className="w-28 h-28 flex-shrink-0 flex items-center justify-center"
              style={{ backgroundColor: `${primary}06` }}
            >
              <ShoppingBag className="h-8 w-8" style={{ color: `${primary}30` }} />
            </div>
          }
        />
        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-sm line-clamp-2" style={{ fontFamily: fontHeading }}>
                {offer.title}
              </h4>
              {isNew && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
                  style={{ backgroundColor: primary }}
                >
                  Novo
                </span>
              )}
            </div>
            {offer.coupon_type !== "PRODUCT" && Number(offer.value_rescue) > 0 ? (
              <p className="text-[11px] line-clamp-1 mt-0.5 text-muted-foreground">
                {Math.floor(Number(offer.value_rescue))} pontos por R$ {Number(offer.value_rescue).toFixed(2)}
              </p>
            ) : offer.coupon_type === "PRODUCT" && Number(offer.value_rescue) > 0 ? (
              <p className="text-[11px] line-clamp-1 mt-0.5 text-muted-foreground">
                {Math.floor(Number(offer.value_rescue))} pts = R$ {Number(offer.value_rescue).toFixed(2)}
              </p>
            ) : null}
          </div>
          <div className="flex items-center justify-between mt-2">
            {offer.coupon_type === "PRODUCT" && Number(offer.value_rescue) > 0 && (
              <span
                className="font-bold text-sm"
                style={{ color: isDark ? "hsl(var(--vb-highlight))" : primary, fontFamily: fontHeading }}
              >
                {Number(offer.value_rescue).toLocaleString("pt-BR")} pts
              </span>
            )}
            {offer.end_at && (
              <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                {new Date(offer.end_at).toLocaleDateString("pt-BR")}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

interface OffersListProps {
  offers: Offer[];
  loading: boolean;
  storeName: string;
  storeLogoUrl: string | null;
  primary: string;
  fontHeading: string;
  fg: string;
  isDark: boolean;
  onOfferClick?: (offer: Offer) => void;
}

export const StoreOffersList = React.memo(function StoreOffersList({
  offers, loading, storeName, storeLogoUrl, primary, fontHeading, fg, isDark, onOfferClick,
}: OffersListProps) {
  return (
    <div className="mx-4 mt-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold" style={{ fontFamily: fontHeading }}>
          Ofertas deste parceiro
        </h3>
        {!loading && (
          <span className="text-xs" style={{ color: `${fg}40` }}>
            {offers.length} {offers.length === 1 ? "oferta" : "ofertas"}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-[18px] overflow-hidden bg-card" style={{ boxShadow: "0 2px 10px hsl(var(--foreground) / 0.03)" }}>
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
          <div className="h-14 w-14 mx-auto mb-3 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${primary}10` }}>
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
            <StoreOfferCard
              key={offer.id}
              offer={offer}
              storeName={storeName}
              storeLogoUrl={storeLogoUrl}
              primary={primary}
              fontHeading={fontHeading}
              isDark={isDark}
              isNew={idx < 2}
              index={idx}
              onClick={() => onOfferClick?.(Object.assign({}, offer, { stores: { name: storeName, logo_url: storeLogoUrl } }) as Offer & { stores: { name: string; logo_url: string | null } })}
            />
          ))}
        </div>
      )}
    </div>
  );
});
