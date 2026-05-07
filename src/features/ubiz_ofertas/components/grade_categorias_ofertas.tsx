import { LayoutGrid } from "lucide-react";
import { LucideIcon } from "@/components/driver/DriverMarketplace";
import type { CategoriaOferta } from "../types/tipos_ofertas";

interface Props {
  categorias: CategoriaOferta[];
  fontHeading?: string;
  selecionadaId: string | null;
  onSelecionar: (id: string | null) => void;
}

export default function GradeCategoriasOfertas({ categorias, fontHeading, selecionadaId, onSelecionar }: Props) {
  if (!categorias.length) return null;
  return (
    <section className="px-4">
      <h2 className="text-base font-bold text-foreground mb-3" style={{ fontFamily: fontHeading }}>
        Categorias
      </h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1" style={{ scrollSnapType: "x mandatory" }}>
        <button
          onClick={() => onSelecionar(null)}
          className="flex flex-col items-center gap-1.5 flex-shrink-0 transition-transform active:scale-95"
          style={{ scrollSnapAlign: "start", minWidth: 68 }}
        >
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center"
            style={{
              backgroundColor: selecionadaId === null ? "hsl(var(--primary))" : "hsl(var(--muted))",
            }}
          >
            <LayoutGrid
              className="h-6 w-6"
              style={{ color: selecionadaId === null ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))" }}
            />
          </div>
          <span className="text-[10px] font-medium text-foreground/80 text-center leading-tight line-clamp-2 max-w-[68px]">
            Todos
          </span>
        </button>
        {categorias.map((cat) => {
          const ativa = selecionadaId === cat.id;
          return (
          <button
            key={cat.id}
            onClick={() => onSelecionar(ativa ? null : cat.id)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 transition-transform active:scale-95"
            style={{ scrollSnapAlign: "start", minWidth: 68 }}
          >
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: ativa ? cat.color : `${cat.color}18`,
                boxShadow: ativa ? `0 4px 12px ${cat.color}40` : "none",
              }}
            >
              <LucideIcon name={cat.icon_name} className="h-6 w-6" style={{ color: ativa ? "#fff" : cat.color }} />
            </div>
            <span className="text-[10px] font-medium text-foreground/80 text-center leading-tight line-clamp-2 max-w-[68px]">
              {cat.name}
            </span>
          </button>
          );
        })}
        <div className="min-w-[8px] flex-shrink-0" />
      </div>
    </section>
  );
}