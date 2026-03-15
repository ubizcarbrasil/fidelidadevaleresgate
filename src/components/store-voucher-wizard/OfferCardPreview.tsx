import { StoreVoucherData } from "./types";
import OfferPurposeBadge from "@/components/customer/OfferPurposeBadge";
import SafeImage from "@/components/customer/SafeImage";
import { ShoppingBag, Store, Sparkles, Eye } from "lucide-react";

interface Props {
  data: StoreVoucherData;
  storeName?: string;
  storeLogo?: string;
}

export default function OfferCardPreview({ data, storeName, storeLogo }: Props) {
  const isProduct = data.coupon_type === "PRODUCT";
  const isPercent = data.discount_mode === "PERCENT";
  const isEarnOnly = data.offer_purpose === "EARN";

  const creditBase = isEarnOnly ? 0 : isProduct
    ? isPercent
      ? (data.discount_percent / 100) * data.product_price
      : data.discount_fixed
    : isPercent
      ? (data.discount_percent / 100) * data.min_purchase
      : data.discount_fixed;

  const title = isProduct
    ? data.product_title || "Título do produto"
    : creditBase > 0
      ? `CRÉDITO DE R$ ${creditBase.toFixed(2)}`
      : "Sua oferta";

  const imageUrl = isProduct ? data.image_url : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Eye className="h-3.5 w-3.5" />
        Pré-visualização do card
      </div>

      <div
        className="flex gap-3 p-3 rounded-2xl bg-card border border-border"
        style={{ boxShadow: "0 1px 6px hsl(var(--foreground) / 0.05)" }}
      >
        {/* Image */}
        <div className="relative flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="h-20 w-20 rounded-xl object-cover"
            />
          ) : storeLogo ? (
            <img
              src={storeLogo}
              alt={storeName || ""}
              className="h-20 w-20 rounded-xl object-cover"
            />
          ) : (
            <div className="h-20 w-20 rounded-xl flex items-center justify-center bg-primary/10">
              <ShoppingBag className="h-8 w-8 text-primary/30" />
            </div>
          )}
          <div className="absolute top-1 left-1">
            <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md text-primary-foreground bg-primary">
              <Sparkles className="h-2.5 w-2.5" /> NOVO
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          {storeName && (
            <div className="flex items-center gap-1.5 mb-0.5">
              {storeLogo ? (
                <img src={storeLogo} alt="" className="h-4 w-4 rounded object-cover" />
              ) : (
                <Store className="h-3 w-3 text-muted-foreground" />
              )}
              <span className="text-[11px] font-medium truncate text-muted-foreground">
                {storeName}
              </span>
            </div>
          )}

          <h3 className="font-bold text-sm leading-tight line-clamp-2">
            {title}
          </h3>

          <div className="flex items-center gap-2 mt-auto flex-wrap">
            <OfferPurposeBadge purpose={data.offer_purpose} />
            {isProduct && data.product_price > 0 && (
              <span className="text-xs font-bold">
                R$ {data.product_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            )}
            {!isEarnOnly && creditBase > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
                {Math.floor(creditBase)} pts
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center italic">
        Assim o cliente verá sua oferta no app
      </p>
    </div>
  );
}
