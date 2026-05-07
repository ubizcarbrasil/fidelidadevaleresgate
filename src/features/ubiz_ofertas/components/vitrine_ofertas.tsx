import { ChevronRight } from "lucide-react";
import CardOferta from "./card_oferta";
import type { OfertaPublica } from "../types/tipos_ofertas";

interface Props {
  titulo: string;
  subtitulo?: string;
  icone?: React.ReactNode;
  ofertas: OfertaPublica[];
  fontHeading?: string;
  onVerTodos?: () => void;
  onClickOferta: (oferta: OfertaPublica) => void;
}

export default function VitrineOfertas({ titulo, subtitulo, icone, ofertas, fontHeading, onVerTodos, onClickOferta }: Props) {
  if (!ofertas.length) return null;
  return (
    <section>
      <div className="px-4 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icone}
          <div>
            <h2 className="text-base font-bold text-foreground" style={{ fontFamily: fontHeading }}>
              {titulo}
            </h2>
            {subtitulo && <p className="text-[10px] text-muted-foreground">{subtitulo}</p>}
          </div>
        </div>
        {onVerTodos && (
          <button onClick={onVerTodos} className="text-xs font-semibold flex items-center gap-0.5 text-primary">
            Ver todos
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div
        className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1"
        style={{ scrollSnapType: "x mandatory", touchAction: "pan-x pan-y" }}
      >
        {ofertas.slice(0, 30).map((oferta) => (
          <CardOferta key={oferta.id} oferta={oferta} fontHeading={fontHeading} onClick={onClickOferta} />
        ))}
        <div className="min-w-[16px] flex-shrink-0" />
      </div>
    </section>
  );
}