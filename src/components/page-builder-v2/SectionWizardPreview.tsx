import { cn } from "@/lib/utils";
import { Tag, Store, ShoppingBag, Link2, Image as ImageIcon, Star, Info, FolderTree } from "lucide-react";

interface PreviewProps {
  contentType: string;
  layoutType: string;
  columnsCount: number;
  rowsCount: number;
  maxItems: number;
  cardRadius: number;
  cardShadow: boolean;
  iconSize: string;
  title: string;
  subtitle: string;
  hasSubtitle: boolean;
  ctaText: string;
  hasCta: boolean;
}

const CONTENT_ICONS: Record<string, React.ReactNode> = {
  offers: <Tag className="h-3.5 w-3.5" />,
  stores: <Store className="h-3.5 w-3.5" />,
  vouchers: <ShoppingBag className="h-3.5 w-3.5" />,
  links: <Link2 className="h-3.5 w-3.5" />,
  banners: <ImageIcon className="h-3.5 w-3.5" />,
  info: <Info className="h-3.5 w-3.5" />,
  highlights: <Star className="h-3.5 w-3.5" />,
  by_category: <FolderTree className="h-3.5 w-3.5" />,
};

const PLACEHOLDER_NAMES = [
  "Café Aroma", "Burger King", "Pet Shop", "Pizzaria", "Doceria",
  "Farmácia", "Padaria", "Livraria", "Ótica Sol", "Açaí Mix",
  "Sushi Bar", "Floricultura",
];

function PlaceholderCard({
  index,
  contentType,
  cardRadius,
  cardShadow,
  iconSize,
}: {
  index: number;
  contentType: string;
  cardRadius: number;
  cardShadow: boolean;
  iconSize: string;
}) {
  const name = PLACEHOLDER_NAMES[index % PLACEHOLDER_NAMES.length];
  const iconPx = iconSize === "small" ? 28 : iconSize === "large" ? 44 : 36;

  if (contentType === "stores" || contentType === "by_category") {
    return (
      <div
        className="flex flex-col items-center gap-1 p-1.5"
        style={{
          borderRadius: `${Math.min(cardRadius, 16)}px`,
          boxShadow: cardShadow ? "0 1px 4px -1px hsl(var(--foreground) / 0.08)" : "none",
        }}
      >
        <div
          className="bg-muted flex items-center justify-center"
          style={{
            width: iconPx,
            height: iconPx,
            borderRadius: `${Math.min(cardRadius, iconPx / 2)}px`,
          }}
        >
          <Store className="h-3 w-3 text-muted-foreground/50" />
        </div>
        <span className="text-[7px] text-muted-foreground truncate w-full text-center leading-tight">{name}</span>
      </div>
    );
  }

  if (contentType === "banners") {
    return (
      <div
        className="bg-muted/80 w-full flex items-center justify-center"
        style={{
          borderRadius: `${cardRadius}px`,
          boxShadow: cardShadow ? "0 1px 4px -1px hsl(var(--foreground) / 0.08)" : "none",
          height: 56,
        }}
      >
        <ImageIcon className="h-4 w-4 text-muted-foreground/30" />
      </div>
    );
  }

  if (contentType === "links") {
    return (
      <div className="flex flex-col items-center gap-0.5 p-1">
        <div
          className="bg-primary/10 flex items-center justify-center"
          style={{
            width: iconPx,
            height: iconPx,
            borderRadius: "50%",
          }}
        >
          <Link2 className="h-3 w-3 text-primary/50" />
        </div>
        <span className="text-[6px] text-muted-foreground truncate w-full text-center">Link {index + 1}</span>
      </div>
    );
  }

  if (contentType === "vouchers") {
    return (
      <div
        className="bg-card border border-border/50 p-1.5 flex flex-col gap-0.5"
        style={{
          borderRadius: `${cardRadius}px`,
          boxShadow: cardShadow ? "0 1px 4px -1px hsl(var(--foreground) / 0.08)" : "none",
        }}
      >
        <div className="bg-muted rounded h-6 w-full flex items-center justify-center">
          <ShoppingBag className="h-2.5 w-2.5 text-muted-foreground/40" />
        </div>
        <span className="text-[6px] text-muted-foreground font-medium">Cupom #{index + 1}</span>
        <span className="text-[7px] text-primary font-bold">10% OFF</span>
      </div>
    );
  }

  // Default: offers, highlights, info
  return (
    <div
      className="bg-card border border-border/50 p-1.5 flex flex-col gap-0.5"
      style={{
        borderRadius: `${cardRadius}px`,
        boxShadow: cardShadow ? "0 1px 4px -1px hsl(var(--foreground) / 0.08)" : "none",
      }}
    >
      <div className="bg-muted rounded h-8 w-full flex items-center justify-center">
        {CONTENT_ICONS[contentType] || <Tag className="h-3 w-3 text-muted-foreground/40" />}
      </div>
      <span className="text-[7px] text-foreground font-medium truncate">{name}</span>
      <span className="text-[6px] text-muted-foreground">Descrição breve</span>
    </div>
  );
}

export default function SectionWizardPreview(props: PreviewProps) {
  const {
    contentType, layoutType, columnsCount, rowsCount, maxItems,
    cardRadius, cardShadow, iconSize, title, subtitle, hasSubtitle,
    ctaText, hasCta,
  } = props;

  const isCarousel = layoutType === "carousel" || layoutType === "carousel_offers";
  const isList = layoutType === "list";
  const itemCount = Math.min(isCarousel ? 4 : columnsCount * rowsCount, maxItems, 12);

  return (
    <div className="flex flex-col items-center">
      {/* Phone frame */}
      <div className="relative w-[220px] h-[420px] rounded-[28px] border-[3px] border-foreground/20 bg-background overflow-hidden shadow-lg flex flex-col">
        {/* Status bar */}
        <div className="h-6 bg-foreground/5 flex items-center justify-between px-4 shrink-0">
          <span className="text-[7px] text-muted-foreground font-medium">9:41</span>
          <div className="flex gap-0.5">
            <div className="w-2.5 h-1.5 rounded-sm bg-muted-foreground/30" />
            <div className="w-2.5 h-1.5 rounded-sm bg-muted-foreground/30" />
            <div className="w-2.5 h-1.5 rounded-sm bg-muted-foreground/30" />
          </div>
        </div>

        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-foreground/20 rounded-b-xl" />

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
          {/* Existing section placeholder */}
          <div className="space-y-1">
            <div className="h-2 w-16 bg-muted rounded-full" />
            <div className="flex gap-1.5">
              <div className="h-10 w-14 bg-muted/50 rounded-lg" />
              <div className="h-10 w-14 bg-muted/50 rounded-lg" />
              <div className="h-10 w-14 bg-muted/50 rounded-lg" />
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Active section preview */}
          <div
            className={cn(
              "rounded-xl border-2 border-primary/30 bg-primary/[0.02] p-2 transition-all",
              !contentType && "opacity-40"
            )}
          >
            {/* Section header */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="min-w-0">
                {title ? (
                  <p className="text-[8px] font-bold text-foreground truncate">{title}</p>
                ) : (
                  <div className="h-2 w-14 bg-muted rounded-full" />
                )}
                {hasSubtitle && subtitle ? (
                  <p className="text-[6px] text-muted-foreground truncate mt-0.5">{subtitle}</p>
                ) : hasSubtitle ? (
                  <div className="h-1.5 w-20 bg-muted/60 rounded-full mt-0.5" />
                ) : null}
              </div>
              {hasCta && (
                <span className="text-[6px] text-primary font-semibold shrink-0 ml-1">
                  {ctaText || "Ver todos"}
                </span>
              )}
            </div>

            {/* Items */}
            {!contentType ? (
              <div className="flex items-center justify-center h-16 text-[8px] text-muted-foreground">
                Selecione um conteúdo
              </div>
            ) : isCarousel ? (
              <div className="flex gap-1.5 overflow-hidden">
                {Array.from({ length: itemCount }).map((_, i) => (
                  <div key={i} className="shrink-0" style={{ width: contentType === "banners" ? "85%" : 52 }}>
                    <PlaceholderCard
                      index={i}
                      contentType={contentType}
                      cardRadius={cardRadius}
                      cardShadow={cardShadow}
                      iconSize={iconSize}
                    />
                  </div>
                ))}
              </div>
            ) : isList ? (
              <div className="space-y-1">
                {Array.from({ length: Math.min(3, itemCount) }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 p-1 border border-border/40 bg-card"
                    style={{
                      borderRadius: `${Math.min(cardRadius, 12)}px`,
                      boxShadow: cardShadow ? "0 1px 3px -1px hsl(var(--foreground) / 0.06)" : "none",
                    }}
                  >
                    <div className="w-7 h-7 bg-muted rounded-md shrink-0 flex items-center justify-center">
                      <Store className="h-2.5 w-2.5 text-muted-foreground/40" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[7px] font-medium text-foreground truncate">
                        {PLACEHOLDER_NAMES[i % PLACEHOLDER_NAMES.length]}
                      </p>
                      <p className="text-[5px] text-muted-foreground">★ 4.{5 + i} · Aberto</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Grid */
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${columnsCount}, 1fr)` }}
              >
                {Array.from({ length: itemCount }).map((_, i) => (
                  <PlaceholderCard
                    key={i}
                    index={i}
                    contentType={contentType}
                    cardRadius={cardRadius}
                    cardShadow={cardShadow}
                    iconSize={iconSize}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Below section placeholder */}
          <div className="space-y-1 opacity-40">
            <div className="h-2 w-20 bg-muted rounded-full" />
            <div className="grid grid-cols-3 gap-1">
              <div className="h-8 bg-muted/50 rounded-lg" />
              <div className="h-8 bg-muted/50 rounded-lg" />
              <div className="h-8 bg-muted/50 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Bottom nav bar */}
        <div className="h-8 border-t border-border bg-card flex items-center justify-around px-2 shrink-0">
          {["Início", "Ofertas", "Carteira", "Perfil"].map((tab) => (
            <div key={tab} className="flex flex-col items-center gap-0.5">
              <div className="w-3 h-3 rounded-full bg-muted-foreground/20" />
              <span className="text-[5px] text-muted-foreground">{tab}</span>
            </div>
          ))}
        </div>

        {/* Home indicator */}
        <div className="h-4 flex items-center justify-center shrink-0">
          <div className="w-16 h-1 rounded-full bg-foreground/15" />
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground mt-2 text-center">
        Pré-visualização em tempo real
      </p>
    </div>
  );
}
