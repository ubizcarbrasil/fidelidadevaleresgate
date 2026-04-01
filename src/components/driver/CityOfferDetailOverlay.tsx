import React from "react";
import { ArrowLeft, Store, Coins, ShoppingCart } from "lucide-react";
import { formatPoints } from "@/lib/formatPoints";
import type { OfertaCidade } from "./SecaoResgateCidade";

interface Props {
  oferta: OfertaCidade;
  fontHeading?: string;
  onBack: () => void;
}

export default function CityOfferDetailOverlay({ oferta, fontHeading, onBack }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      <div className="max-w-lg mx-auto pb-10">
        {/* Header */}
        <header className="sticky top-0 z-10 px-5 pt-4 pb-3" style={{ backgroundColor: "hsl(var(--background))" }}>
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </header>

        {/* Store image / logo */}
        <div className="px-5 flex justify-center py-6">
          <div
            className="h-32 w-32 rounded-2xl flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: "hsl(var(--muted) / 0.3)" }}
          >
            {oferta.store_logo_url ? (
              <img src={oferta.store_logo_url} alt={oferta.store_name || ""} className="h-full w-full object-contain p-3" />
            ) : oferta.image_url ? (
              <img src={oferta.image_url} alt={oferta.title} className="h-full w-full object-contain p-3" />
            ) : (
              <Store className="h-12 w-12 text-muted-foreground/30" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="px-5 space-y-4">
          {oferta.store_name && (
            <p className="text-xs font-medium text-muted-foreground text-center">{oferta.store_name}</p>
          )}
          <h1
            className="text-xl font-extrabold text-foreground text-center"
            style={{ fontFamily: fontHeading }}
          >
            {oferta.title}
          </h1>

          {/* Points cost */}
          <div
            className="flex items-center justify-center gap-2 py-3 rounded-2xl"
            style={{ backgroundColor: "hsl(var(--primary) / 0.1)" }}
          >
            <Coins className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
            <span className="text-lg font-bold" style={{ color: "hsl(var(--primary))" }}>
              {formatPoints(oferta.pointsCost)} pontos
            </span>
          </div>

          {/* Nota explicativa */}
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm"
            style={{ backgroundColor: "hsl(var(--muted) / 0.4)", color: "hsl(var(--muted-foreground))" }}
          >
            <Coins className="h-4 w-4 flex-shrink-0" style={{ color: "hsl(var(--primary))" }} />
            <span>Cada ponto vale <strong className="text-foreground">R$ 1,00</strong> de crédito nesta loja</span>
          </div>

          {/* Credit value */}
          {oferta.value_rescue != null && oferta.value_rescue > 0 && (
            <div
              className="flex items-center justify-between px-4 py-3 rounded-2xl"
              style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
            >
              <span className="text-sm text-muted-foreground">Crédito</span>
              <span className="text-base font-bold text-foreground">
                R$ {Number(oferta.value_rescue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* Min purchase — obrigatório */}
          {oferta.min_purchase != null && oferta.min_purchase > 0 && (
            <div
              className="px-4 py-3 rounded-2xl space-y-1"
              style={{ backgroundColor: "hsl(45 93% 47% / 0.08)", border: "1px solid hsl(45 93% 47% / 0.25)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" style={{ color: "hsl(45 93% 47%)" }} />
                  <span className="text-sm font-medium text-foreground">Compra mínima obrigatória</span>
                </div>
                <span className="text-base font-bold text-foreground">
                  R$ {Number(oferta.min_purchase).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground pl-6">
                O crédito só pode ser utilizado em compras a partir deste valor
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
