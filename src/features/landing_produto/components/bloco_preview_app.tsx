import { Check } from "lucide-react";
import type { LandingScreenshot } from "@/features/produtos_comerciais/types/tipos_produto";

interface Props {
  screenshots: LandingScreenshot[];
  heroImageUrl?: string;
  productName: string;
  primaryColor: string;
}

const BULLETS = [
  "Funciona 100% pelo navegador — sem app para instalar",
  "Setup guiado em poucos minutos",
  "Painel completo de acompanhamento e relatórios",
];

export default function BlocoPreviewApp({
  screenshots,
  heroImageUrl,
  productName,
  primaryColor,
}: Props) {
  const items = (screenshots ?? []).filter((s) => s.url);
  const fallback = !items.length && heroImageUrl ? [{ url: heroImageUrl, caption: productName }] : [];
  const finalItems = items.length > 0 ? items : fallback;
  if (finalItems.length === 0) return null;

  return (
    <section id="preview" className="px-4 py-12 sm:py-16 bg-muted/30 scroll-mt-20">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.3fr] gap-8 lg:gap-12 items-center">
        <div className="space-y-5">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Veja como funciona <span style={{ color: primaryColor }}>na prática</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Uma interface pensada para ser intuitiva — tanto pra quem opera quanto pro motorista que vai usar.
          </p>
          <ul className="space-y-2.5">
            {BULLETS.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: `${primaryColor}22` }}
                >
                  <Check className="h-3 w-3" style={{ color: primaryColor }} />
                </span>
                <span className="font-medium">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex sm:grid sm:grid-cols-2 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {finalItems.slice(0, 4).map((s, i) => (
            <figure
              key={i}
              className="flex-shrink-0 w-[80%] sm:w-auto snap-center rounded-xl overflow-hidden border-2 bg-card shadow-lg"
              style={{ borderColor: `${primaryColor}33` }}
            >
              <img
                src={s.url}
                alt={s.caption || `Preview ${i + 1}`}
                className="w-full aspect-[4/3] object-cover"
                loading="lazy"
              />
              {s.caption && (
                <figcaption className="px-3 py-2 text-xs text-muted-foreground text-center bg-card">
                  {s.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}