import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { LucideIcon } from "@/components/driver/DriverMarketplace";
import CardOferta from "./card_oferta";
import type { CategoriaOferta, OfertaPublica } from "../types/tipos_ofertas";

interface Props {
  categorias: CategoriaOferta[];
  ofertas: OfertaPublica[];
  fontHeading?: string;
  onClickOferta: (oferta: OfertaPublica) => void;
  onSelecionarCategoria: (id: string) => void;
  minimoPorCategoria?: number;
  maximoPorCarrossel?: number;
}

/**
 * Renderiza uma seção horizontal por categoria, no padrão Achadinhos:
 * cabeçalho com ícone/nome/contagem, botão "Ver todos" para focar a
 * categoria, e carrossel lateral próprio com snap.
 */
export default function SecoesPorCategoria({
  categorias,
  ofertas,
  fontHeading,
  onClickOferta,
  onSelecionarCategoria,
  minimoPorCategoria = 3,
  maximoPorCarrossel = 12,
}: Props) {
  const ofertasPorCategoria = useMemo(() => {
    const map = new Map<string, OfertaPublica[]>();
    for (const o of ofertas) {
      if (!o.category_id) continue;
      const arr = map.get(o.category_id) || [];
      arr.push(o);
      map.set(o.category_id, arr);
    }
    return map;
  }, [ofertas]);

  const categoriasViaveis = useMemo(
    () =>
      categorias.filter(
        (c) => (ofertasPorCategoria.get(c.id)?.length ?? 0) >= minimoPorCategoria,
      ),
    [categorias, ofertasPorCategoria, minimoPorCategoria],
  );

  if (!categoriasViaveis.length) return null;

  return (
    <div className="space-y-5">
      {categoriasViaveis.map((cat) => {
        const lista = ofertasPorCategoria.get(cat.id) ?? [];
        const visiveis = lista.slice(0, maximoPorCarrossel);
        return (
          <section key={cat.id}>
            <div className="px-4 mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-7 w-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  <LucideIcon name={cat.icon_name} className="h-4 w-4" style={{ color: cat.color }} />
                </div>
                <div>
                  <h2
                    className="text-base font-bold text-foreground"
                    style={{ fontFamily: fontHeading }}
                  >
                    {cat.name}
                  </h2>
                  <p className="text-[10px] text-muted-foreground">
                    {lista.length} oferta{lista.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onSelecionarCategoria(cat.id)}
                className="text-xs font-semibold flex items-center gap-0.5"
                style={{ color: cat.color }}
              >
                Ver todos
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div
              className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1"
              style={{ scrollSnapType: "x mandatory", touchAction: "pan-x pan-y" }}
            >
              {visiveis.map((oferta) => (
                <CardOferta
                  key={oferta.id}
                  oferta={oferta}
                  fontHeading={fontHeading}
                  onClick={onClickOferta}
                />
              ))}
              <div className="min-w-[16px] flex-shrink-0" />
            </div>
          </section>
        );
      })}
    </div>
  );
}