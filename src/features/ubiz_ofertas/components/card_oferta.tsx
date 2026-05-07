import { ExternalLink, ShoppingBag } from "lucide-react";
import type { OfertaPublica } from "../types/tipos_ofertas";

interface Props {
  oferta: OfertaPublica;
  fontHeading?: string;
  onClick?: (oferta: OfertaPublica) => void;
}

const formatarPreco = (val: number | null | undefined) => {
  if (val == null || val === 0) return null;
  return Number(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export default function CardOferta({ oferta, fontHeading, onClick }: Props) {
  const temDesconto = oferta.original_price && oferta.price && oferta.original_price > oferta.price;
  const percentualDesconto = temDesconto
    ? Math.round(((oferta.original_price! - oferta.price!) / oferta.original_price!) * 100)
    : 0;
  const preco = formatarPreco(oferta.price);
  const precoOriginal = formatarPreco(oferta.original_price);
  const badge = oferta.badge_label || (temDesconto && percentualDesconto > 0 ? `-${percentualDesconto}%` : null);
  const highlight = "hsl(var(--primary))";

  return (
    <div
      className="min-w-[160px] max-w-[180px] flex-shrink-0 rounded-[18px] overflow-hidden bg-card cursor-pointer flex flex-col active:scale-[0.97] transition-transform"
      style={{ boxShadow: "0 2px 12px hsl(var(--foreground) / 0.05)", scrollSnapAlign: "start" }}
      onClick={() =>
        onClick ? onClick(oferta) : window.open(oferta.affiliate_url, "_blank", "noopener,noreferrer")
      }
    >
      <div className="relative bg-muted/30">
        {oferta.image_url ? (
          <img
            src={oferta.image_url}
            alt={oferta.title}
            className={`w-full aspect-square ${oferta.origin === "dvlinks" ? "object-cover" : "object-contain"}`}
            loading="lazy"
          />
        ) : (
          <div className="w-full aspect-square flex items-center justify-center bg-muted/10">
            <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
        {badge && (
          <div
            className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-white text-[10px] font-bold shadow-sm"
            style={{ backgroundColor: highlight }}
          >
            {badge}
          </div>
        )}
        <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-card/80 backdrop-blur flex items-center justify-center overflow-hidden">
          {oferta.store_logo_url ? (
            <img src={oferta.store_logo_url} alt={oferta.store_name || ""} className="h-5 w-5 object-contain rounded-full" />
          ) : (
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </div>
      <div className="p-3">
        {oferta.store_name && (
          <p className="text-[9px] font-medium mb-0.5 truncate text-muted-foreground">{oferta.store_name}</p>
        )}
        <h3 className="text-xs font-semibold line-clamp-2 mb-2" style={{ fontFamily: fontHeading }}>
          {oferta.title}
        </h3>
        {(preco || precoOriginal) && (
          <div className="flex items-baseline gap-1.5">
            {preco && (
              <span className="text-sm font-bold" style={{ color: highlight, fontFamily: fontHeading }}>
                {preco}
              </span>
            )}
            {temDesconto && precoOriginal && (
              <span className="text-[10px] line-through text-muted-foreground">{precoOriginal}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}