import React from "react";
import { Store, ChevronRight, Coins } from "lucide-react";
import { formatPoints } from "@/lib/formatPoints";

interface OfertaCidade {
  id: string;
  title: string;
  image_url: string | null;
  value_rescue: number | null;
  min_purchase: number | null;
  offer_purpose: string;
  store_name: string | null;
  store_logo_url: string | null;
  pointsCost: number;
}

interface Props {
  ofertas: OfertaCidade[];
  fontHeading?: string;
  onClickOferta: (oferta: OfertaCidade) => void;
  onVerHistorico?: () => void;
}

export type { OfertaCidade };

export default function SecaoResgateCidade({ ofertas, fontHeading, onClickOferta, onVerHistorico }: Props) {
  if (ofertas.length === 0) return null;

  return (
    <section className="pt-4">
      <div className="px-5 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "hsl(var(--primary) / 0.15)" }}
          >
            <Store className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div>
            <h2
              className="text-base font-bold text-foreground"
              style={{ fontFamily: fontHeading }}
            >
              Resgate na Cidade
            </h2>
            <p className="text-[10px] text-muted-foreground">
              Use seus pontos em lojas parceiras
            </p>
          </div>
        </div>
      </div>

      <div
        className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1"
        style={{ scrollSnapType: "x mandatory", touchAction: "pan-x pan-y" }}
      >
        {ofertas.map((oferta) => (
          <div
            key={oferta.id}
            className="min-w-[160px] max-w-[180px] flex-shrink-0 rounded-[18px] overflow-hidden bg-card cursor-pointer flex flex-col active:scale-[0.97] transition-transform"
            style={{
              boxShadow: "0 2px 12px hsl(var(--foreground) / 0.05)",
              scrollSnapAlign: "start",
            }}
            onClick={() => onClickOferta(oferta)}
          >
            {/* Store logo / image */}
            <div className="relative bg-muted/30 flex items-center justify-center p-4 aspect-square">
              {oferta.store_logo_url ? (
                <img
                  src={oferta.store_logo_url}
                  alt={oferta.store_name || "Loja"}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              ) : oferta.image_url ? (
                <img
                  src={oferta.image_url}
                  alt={oferta.title}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              ) : (
                <Store className="h-10 w-10 text-muted-foreground/30" />
              )}
              <div
                className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm"
                style={{
                  backgroundColor: "hsl(45 93% 47%)",
                  color: "#fff",
                }}
              >
                Crédito
              </div>
            </div>

            <div className="p-3">
              {oferta.store_name && (
                <p className="text-[9px] font-medium mb-0.5 truncate text-muted-foreground">
                  {oferta.store_name}
                </p>
              )}
              <h3
                className="text-xs font-semibold line-clamp-2 mb-2"
                style={{ fontFamily: fontHeading }}
              >
                {oferta.title}
              </h3>
              <div className="flex items-center gap-1">
                <Coins className="h-3 w-3" style={{ color: "hsl(var(--primary))" }} />
                <span
                  className="text-sm font-bold"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  {formatPoints(oferta.pointsCost)} pts
                </span>
              </div>
              {oferta.value_rescue != null && oferta.value_rescue > 0 && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Crédito de R$ {Number(oferta.value_rescue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
          </div>
        ))}
        <div className="min-w-[16px] flex-shrink-0" />
      </div>
    </section>
  );
}
