import React from "react";
import { ExternalLink, ShoppingBag } from "lucide-react";
import { formatPrice, type AffiliateDeal } from "./DriverMarketplace";

interface Props {
  deal: AffiliateDeal;
  highlight: string;
  fontHeading: string;
  onClickDeal?: (deal: AffiliateDeal) => void;
}

function DriverDealCardInner({ deal, highlight, fontHeading, onClickDeal }: Props) {
  const hasDiscount = deal.original_price && deal.price && deal.original_price > deal.price;
  const discountPercent = hasDiscount ? Math.round(((deal.original_price! - deal.price!) / deal.original_price!) * 100) : 0;
  const priceStr = formatPrice(deal.price);
  const originalPriceStr = formatPrice(deal.original_price);
  const badgeText = deal.badge_label || (hasDiscount && discountPercent > 0 ? `-${discountPercent}%` : null);

  return (
    <div
      className="min-w-[160px] max-w-[180px] flex-shrink-0 rounded-[18px] overflow-hidden bg-card cursor-pointer flex flex-col active:scale-[0.97] transition-transform"
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
      </div>
    </div>
  );
}

const DriverDealCard = React.memo(DriverDealCardInner);
export default DriverDealCard;
