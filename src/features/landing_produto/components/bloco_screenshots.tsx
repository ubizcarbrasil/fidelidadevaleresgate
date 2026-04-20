import type { LandingScreenshot } from "@/features/produtos_comerciais/types/tipos_produto";

interface Props {
  screenshots: LandingScreenshot[];
  primaryColor?: string;
}

export default function BlocoScreenshots({ screenshots, primaryColor }: Props) {
  const items = (screenshots ?? []).filter((s) => s.url);
  if (items.length === 0) return null;

  return (
    <section className="px-4 py-12 sm:py-16 bg-muted/30">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2
            className="text-2xl sm:text-3xl font-extrabold tracking-tight"
            style={primaryColor ? { color: primaryColor } : undefined}
          >
            Veja na prática
          </h2>
          <p className="text-sm text-muted-foreground">
            Algumas telas do que você vai usar no dia a dia.
          </p>
        </div>

        {/* Mobile: horizontal scroll. Desktop: grid */}
        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {items.map((s, i) => (
            <figure
              key={i}
              className="flex-shrink-0 w-[80%] sm:w-auto snap-center rounded-xl overflow-hidden border bg-card shadow-sm"
            >
              <img
                src={s.url}
                alt={s.caption || `Screenshot ${i + 1}`}
                className="w-full aspect-[16/10] object-cover"
                loading="lazy"
              />
              {s.caption && (
                <figcaption className="px-3 py-2 text-xs text-muted-foreground text-center">
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
