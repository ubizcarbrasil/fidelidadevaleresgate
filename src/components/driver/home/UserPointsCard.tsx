import { Coins, ChevronRight, ShoppingCart } from "lucide-react";
import { formatPoints } from "@/lib/formatPoints";

interface Props {
  driverName: string;
  pointsBalance: number;
  onClick: () => void;
  showBuyPoints?: boolean;
  onBuyPoints?: () => void;
}

export default function UserPointsCard({ driverName, pointsBalance, onClick, showBuyPoints = false, onBuyPoints }: Props) {
  const cleanName = driverName.replace(/\[MOTORISTA\]\s*/gi, "").trim();

  return (
    <div
      className="mx-4 rounded-2xl overflow-hidden"
      style={{
        width: "calc(100% - 2rem)",
        background: "linear-gradient(135deg, hsl(var(--primary) / 0.18), hsl(var(--primary) / 0.06))",
        border: "1px solid hsl(var(--primary) / 0.25)",
      }}
    >
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between px-4 py-4 transition-transform active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "hsl(var(--primary) / 0.2)" }}
          >
            <Coins className="h-6 w-6" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[11px] font-medium text-muted-foreground leading-tight">
              {cleanName}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-2xl font-extrabold tracking-tight"
                style={{ color: "hsl(var(--primary))" }}
              >
                {formatPoints(pointsBalance)}
              </span>
              <span className="text-sm font-medium text-muted-foreground">pontos</span>
            </div>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </button>

      {showBuyPoints && (
        <button
          onClick={(e) => { e.stopPropagation(); onBuyPoints?.(); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors active:opacity-80"
          style={{
            borderTop: "1px solid hsl(var(--primary) / 0.15)",
            color: "hsl(var(--primary))",
          }}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Comprar Pontos
        </button>
      )}
    </div>
  );
}
