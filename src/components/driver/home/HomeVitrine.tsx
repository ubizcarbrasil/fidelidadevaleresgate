import { ChevronRight, Gift } from "lucide-react";
import { formatPoints } from "@/lib/formatPoints";

interface Deal {
  id: string;
  title: string;
  image_url: string | null;
  price: number | null;
  store_name: string | null;
  is_redeemable?: boolean;
  redeem_points_cost?: number | null;
}

interface Props {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  deals: Deal[];
  fontHeading?: string;
  onVerTodos: () => void;
  onClickDeal: (deal: Deal) => void;
  showPointsCost?: boolean;
}

export default function HomeVitrine({ title, subtitle, icon, deals, fontHeading, onVerTodos, onClickDeal, showPointsCost }: Props) {
  if (!deals.length) return null;

  return (
    <section>
      <div className="px-4 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h2 className="text-base font-bold text-foreground" style={{ fontFamily: fontHeading }}>
              {title}
            </h2>
            {subtitle && (
              <p className="text-[10px] text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        <button
          onClick={onVerTodos}
          className="text-xs font-semibold flex items-center gap-0.5 text-primary"
        >
          Ver todos
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div
        className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1"
        style={{ scrollSnapType: "x mandatory", touchAction: "pan-x pan-y" }}
      >
        {deals.slice(0, 20).map((deal) => {
          const pointsCost = deal.redeem_points_cost || Math.ceil(deal.price || 0);
          return (
            <div
              key={deal.id}
              onClick={() => onClickDeal(deal)}
              className="min-w-[150px] max-w-[170px] flex-shrink-0 rounded-2xl overflow-hidden bg-card cursor-pointer flex flex-col transition-transform active:scale-[0.97]"
              style={{
                boxShadow: "0 2px 12px hsl(var(--foreground) / 0.05)",
                scrollSnapAlign: "start",
              }}
            >
              <div className="relative bg-muted/30">
                {deal.image_url ? (
                  <img src={deal.image_url} alt={deal.title} className="w-full aspect-square object-contain" loading="lazy" />
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center bg-muted/10">
                    <Gift className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
                {showPointsCost && (
                  <div
                    className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm"
                    style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                  >
                    Resgate
                  </div>
                )}
              </div>
              <div className="p-3">
                {deal.store_name && (
                  <p className="text-[9px] font-medium mb-0.5 truncate text-muted-foreground">{deal.store_name}</p>
                )}
                <h3 className="text-xs font-semibold line-clamp-2 mb-2" style={{ fontFamily: fontHeading }}>
                  {deal.title}
                </h3>
                {showPointsCost ? (
                  <span className="text-sm font-bold" style={{ color: "hsl(var(--primary))" }}>
                    {formatPoints(pointsCost)} pts
                  </span>
                ) : deal.price ? (
                  <span className="text-sm font-bold text-foreground">
                    {Number(deal.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
        <div className="min-w-[16px] flex-shrink-0" />
      </div>
    </section>
  );
}
