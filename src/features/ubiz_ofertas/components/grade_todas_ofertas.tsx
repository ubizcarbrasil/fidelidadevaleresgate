import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import CardOferta from "./card_oferta";
import type { OfertaPublica } from "../types/tipos_ofertas";

interface Props {
  titulo: string;
  ofertas: OfertaPublica[];
  fontHeading?: string;
  onClickOferta: (oferta: OfertaPublica) => void;
  tamanhoPagina?: number;
}

/**
 * Vitrine em grade com carregamento incremental (infinite scroll).
 * Reseta automaticamente quando a lista de ofertas muda (ex.: troca de
 * categoria), evitando renderizar centenas de cards de uma vez.
 */
export default function GradeTodasOfertas({
  titulo,
  ofertas,
  fontHeading,
  onClickOferta,
  tamanhoPagina = 12,
}: Props) {
  const [quantidadeVisivel, setQuantidadeVisivel] = useState(tamanhoPagina);
  const sentinelaRef = useRef<HTMLDivElement | null>(null);

  // Reseta ao trocar a lista (ex.: filtro de categoria mudou).
  useEffect(() => {
    setQuantidadeVisivel(tamanhoPagina);
  }, [ofertas, tamanhoPagina]);

  const ofertasVisiveis = useMemo(
    () => ofertas.slice(0, quantidadeVisivel),
    [ofertas, quantidadeVisivel],
  );

  const temMais = quantidadeVisivel < ofertas.length;

  // Infinite scroll via IntersectionObserver.
  useEffect(() => {
    if (!temMais) return;
    const alvo = sentinelaRef.current;
    if (!alvo) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setQuantidadeVisivel((q) => Math.min(q + tamanhoPagina, ofertas.length));
        }
      },
      { rootMargin: "300px 0px" },
    );

    observer.observe(alvo);
    return () => observer.disconnect();
  }, [temMais, tamanhoPagina, ofertas.length]);

  if (!ofertas.length) return null;

  return (
    <section>
      <div className="px-4 mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground" style={{ fontFamily: fontHeading }}>
          {titulo}
        </h2>
        <span className="text-[10px] text-muted-foreground">
          {ofertasVisiveis.length} de {ofertas.length}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 px-4">
        {ofertasVisiveis.map((oferta) => (
          <div key={oferta.id} className="w-full">
            <CardOferta oferta={oferta} fontHeading={fontHeading} onClick={onClickOferta} />
          </div>
        ))}
      </div>

      {temMais && (
        <div ref={sentinelaRef} className="flex flex-col items-center gap-2 py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <button
            type="button"
            onClick={() =>
              setQuantidadeVisivel((q) => Math.min(q + tamanhoPagina, ofertas.length))
            }
            className="text-xs font-semibold text-primary"
          >
            Carregar mais
          </button>
        </div>
      )}
    </section>
  );
}