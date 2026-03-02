import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Battery, Signal, Wifi, ChevronRight, Star, MapPin, Heart, Image, Tag, Store, Gift, Link2, Info, List } from "lucide-react";

interface TemplateSection {
  title: string;
  subtitle: string | null;
  cta_text: string | null;
  template_type: string;
  order_index: number;
  visual_json: Record<string, any>;
  sources: { source_type: string; filters_json: Record<string, any>; limit: number }[];
}

interface Props {
  sections: TemplateSection[];
  templateName?: string;
}

function SectionHeader({ title, subtitle, cta }: { title: string; subtitle?: string | null; cta?: string | null }) {
  return (
    <div className="px-4 pt-3 pb-1">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-bold text-foreground">{title}</h3>
        {cta && (
          <span className="text-[9px] text-primary flex items-center gap-0.5">
            {cta} <ChevronRight className="h-2.5 w-2.5" />
          </span>
        )}
      </div>
      {subtitle && <p className="text-[9px] text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}

function BannerCarouselPlaceholder() {
  return (
    <div className="px-4">
      <div className="h-28 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center relative overflow-hidden">
        <Image className="h-8 w-8 text-primary/40" />
        <div className="absolute bottom-2 flex gap-1">
          <div className="h-1.5 w-4 rounded-full bg-primary/60" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary/30" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary/30" />
        </div>
      </div>
    </div>
  );
}

function OffersCarouselPlaceholder() {
  return (
    <div className="flex gap-2 px-4 overflow-hidden">
      {[1, 2, 3].map(i => (
        <div key={i} className="min-w-[110px] rounded-lg border bg-card p-2 space-y-1.5 shrink-0">
          <div className="h-14 rounded-md bg-muted flex items-center justify-center">
            <Tag className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <Skeleton className="h-2 w-16" />
          <Skeleton className="h-2 w-10" />
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-primary">R$ 9,90</span>
            <Heart className="h-2.5 w-2.5 text-muted-foreground/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

function OffersGridPlaceholder() {
  return (
    <div className="grid grid-cols-2 gap-2 px-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="rounded-lg border bg-card p-2 space-y-1.5">
          <div className="h-12 rounded-md bg-muted flex items-center justify-center">
            <Tag className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <Skeleton className="h-2 w-full" />
          <span className="text-[8px] font-bold text-primary">R$ 14,90</span>
        </div>
      ))}
    </div>
  );
}

function StoresGridPlaceholder() {
  return (
    <div className="grid grid-cols-3 gap-2 px-4">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <Store className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <Skeleton className="h-1.5 w-10" />
        </div>
      ))}
    </div>
  );
}

function StoresListPlaceholder() {
  return (
    <div className="space-y-2 px-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-2 rounded-lg border bg-card p-2">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Store className="h-3.5 w-3.5 text-muted-foreground/50" />
          </div>
          <div className="flex-1 space-y-1">
            <Skeleton className="h-2 w-20" />
            <div className="flex items-center gap-1">
              <MapPin className="h-2 w-2 text-muted-foreground/40" />
              <Skeleton className="h-1.5 w-14" />
            </div>
          </div>
          <Star className="h-3 w-3 text-amber-400/60" />
        </div>
      ))}
    </div>
  );
}

function VouchersCardsPlaceholder() {
  return (
    <div className="flex gap-2 px-4 overflow-hidden">
      {[1, 2].map(i => (
        <div key={i} className="min-w-[140px] rounded-lg bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900 p-2.5 space-y-1 shrink-0 relative">
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-background" />
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-background" />
          <Gift className="h-4 w-4 text-pink-500" />
          <Skeleton className="h-2 w-16" />
          <Skeleton className="h-1.5 w-20" />
          <span className="text-[8px] font-bold text-pink-600 dark:text-pink-400">Resgatar →</span>
        </div>
      ))}
    </div>
  );
}

function ManualLinksGridPlaceholder() {
  return (
    <div className="grid grid-cols-4 gap-2 px-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Link2 className="h-4 w-4 text-primary/60" />
          </div>
          <Skeleton className="h-1.5 w-8" />
        </div>
      ))}
    </div>
  );
}

function ManualLinksCarouselPlaceholder() {
  return (
    <div className="flex gap-3 px-4 overflow-hidden">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex flex-col items-center gap-1 shrink-0">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Link2 className="h-4 w-4 text-primary/60" />
          </div>
          <Skeleton className="h-1.5 w-8" />
        </div>
      ))}
    </div>
  );
}

function GridLogosPlaceholder() {
  return (
    <div className="grid grid-cols-4 gap-2 px-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center border">
            <Image className="h-4 w-4 text-muted-foreground/40" />
          </div>
          <Skeleton className="h-1.5 w-8" />
        </div>
      ))}
    </div>
  );
}

function GridInfoPlaceholder() {
  return (
    <div className="grid grid-cols-2 gap-2 px-4">
      {[1, 2].map(i => (
        <div key={i} className="rounded-lg border bg-card p-2 space-y-1">
          <Info className="h-4 w-4 text-primary/60" />
          <Skeleton className="h-2 w-16" />
          <Skeleton className="h-1.5 w-full" />
        </div>
      ))}
    </div>
  );
}

function ListInfoPlaceholder() {
  return (
    <div className="space-y-1.5 px-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-2 rounded-lg border bg-card p-2">
          <List className="h-3.5 w-3.5 text-primary/60 shrink-0" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-2 w-24" />
            <Skeleton className="h-1.5 w-16" />
          </div>
          <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
        </div>
      ))}
    </div>
  );
}

const SECTION_RENDERERS: Record<string, React.FC> = {
  BANNER_CAROUSEL: BannerCarouselPlaceholder,
  OFFERS_CAROUSEL: OffersCarouselPlaceholder,
  OFFERS_GRID: OffersGridPlaceholder,
  STORES_GRID: StoresGridPlaceholder,
  STORES_LIST: StoresListPlaceholder,
  VOUCHERS_CARDS: VouchersCardsPlaceholder,
  MANUAL_LINKS_GRID: ManualLinksGridPlaceholder,
  MANUAL_LINKS_CAROUSEL: ManualLinksCarouselPlaceholder,
  GRID_LOGOS: GridLogosPlaceholder,
  GRID_INFO: GridInfoPlaceholder,
  LIST_INFO: ListInfoPlaceholder,
};

export default function HomeTemplateMobilePreview({ sections, templateName }: Props) {
  return (
    <div className="flex flex-col items-center">
      {/* Phone frame */}
      <div
        className="relative bg-background border-2 border-foreground/20 rounded-[2rem] shadow-2xl overflow-hidden"
        style={{ width: 320, height: 620 }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-foreground/10 rounded-b-2xl z-10" />

        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-1.5 pb-0.5 text-[8px] text-muted-foreground">
          <span className="font-semibold">9:41</span>
          <div className="flex items-center gap-1">
            <Signal className="h-2.5 w-2.5" />
            <Wifi className="h-2.5 w-2.5" />
            <Battery className="h-2.5 w-2.5" />
          </div>
        </div>

        <ScrollArea className="h-[590px]">
          <div className="space-y-3 pb-6">
            {/* Header greeting */}
            <div className="px-4 pt-3">
              <p className="text-[10px] text-muted-foreground">Bom dia 👋</p>
              <p className="text-[13px] font-bold text-foreground">Cliente Exemplo</p>
            </div>

            {/* Points hero */}
            <div className="mx-4 rounded-xl bg-gradient-to-r from-primary to-primary/70 p-3 text-primary-foreground">
              <p className="text-[9px] opacity-80">Seu saldo</p>
              <p className="text-lg font-bold">1.250 pts</p>
              <p className="text-[8px] opacity-70 mt-0.5">≈ R$ 12,50</p>
            </div>

            {/* Template sections */}
            {sections
              .sort((a, b) => a.order_index - b.order_index)
              .map((sec, i) => {
                const Renderer = SECTION_RENDERERS[sec.template_type];
                return (
                  <div key={i}>
                    <SectionHeader title={sec.title} subtitle={sec.subtitle} cta={sec.cta_text} />
                    {Renderer ? <Renderer /> : (
                      <div className="mx-4 rounded-lg border border-dashed p-3 text-center">
                        <span className="text-[9px] text-muted-foreground">{sec.template_type}</span>
                      </div>
                    )}
                  </div>
                );
              })}

            {sections.length === 0 && (
              <div className="flex items-center justify-center h-40">
                <p className="text-xs text-muted-foreground">Nenhuma seção no template</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {templateName && (
        <p className="text-xs text-muted-foreground mt-3 text-center">{templateName}</p>
      )}
    </div>
  );
}
