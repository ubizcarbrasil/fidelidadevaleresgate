import React from "react";
import { ExternalLink, ShoppingBag, Star } from "lucide-react";
import { formatPrice, type AffiliateDeal } from "./DriverMarketplace";
import { formatPoints } from "@/lib/formatPoints";

interface Props {
  deal: AffiliateDeal;
  highlight: string;
  fontHeading: string;
  idx: number;
  pointsPerReal?: number;
  onClickDeal?: (deal: AffiliateDeal) => void;
}

function DriverDealCardGridInner({ deal, highlight, fontHeading, idx, pointsPerReal, onClickDeal }: Props) {
  const hasDiscount = deal.original_price && deal.price && deal.original_price > deal.price;
  const discountPercent = hasDiscount ? Math.round(((deal.original_price! - deal.price!) / deal.original_price!) * 100) : 0;
  const priceStr = formatPrice(deal.price);
  const originalPriceStr = formatPrice(deal.original_price);
  const badgeText = deal.badge_label || (hasDiscount && discountPercent > 0 ? `-${discountPercent}%` : null);
  const earnedPoints = pointsPerReal && deal.price ? Math.floor(deal.price * pointsPerReal) : 0;

  return (
    <div
      className="rounded-[18px] overflow-hidden bg-card cursor-pointer flex flex-col active:scale-[0.97] transition-transform animate-fade-in"
      style={{ boxShadow: "0 2px 12px hsl(var(--foreground) / 0.05)", scrollSnapAlign: "start" }}
      onClick={() => onClickDeal ? onClickDeal(deal) : window.open(deal.affiliate_url, "_blank", "noopener,noreferrer")}
    >
      <div className="relative bg-muted/30">
        {deal.image_url ? (
          <img src={deal.image_url} alt={deal.title} className={`w-full aspect-square ${deal.origin === 'dvlinks' ? 'object-cover' : 'object-contain'}`} loading="lazy" />
        ) : (
          <div className="w-full aspect-square flex items-center justify-center bg-muted/10">
            <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
        {badgeText && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-white text-[10px] font-bold shadow-sm" style={{ backgroundColor: highlight }}>
            {badgeText}
          </div>
        )}
        <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-card/80 backdrop-blur flex items-center justify-center overflow-hidden">
          {deal.store_logo_url ? (
            <img src={deal.store_logo_url} alt={deal.store_name || ""} className="h-5 w-5 object-contain rounded-full" />
          ) : (
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </div>
      <div className="p-3">
        {deal.store_name && <p className="text-[9px] font-medium mb-0.5 truncate text-muted-foreground">{deal.store_name}</p>}
        <h3 className="text-xs font-semibold line-clamp-2 mb-2" style={{ fontFamily: fontHeading }}>{deal.title}</h3>
        {(priceStr || originalPriceStr) && (
          <div className="flex items-baseline gap-1.5">
            {priceStr && <span className="text-sm font-bold" style={{ color: highlight, fontFamily: fontHeading }}>{priceStr}</span>}
            {hasDiscount && originalPriceStr && <span className="text-[10px] line-through text-muted-foreground">{originalPriceStr}</span>}
          </div>
        )}
        {earnedPoints > 0 && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium mt-1 w-fit" style={{ backgroundColor: "#22c55e15", color: "#22c55e" }}>
            <Star className="w-2.5 h-2.5" fill="#22c55e" />
            <span>Ganhe {formatPoints(earnedPoints)} pts</span>
          </div>
        )}
      </div>
    </div>
  );
}

const DriverDealCardGrid = React.memo(DriverDealCardGridInner);
export default DriverDealCardGrid;
