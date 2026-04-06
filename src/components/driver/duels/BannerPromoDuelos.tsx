import { Swords, ChevronRight } from "lucide-react";

interface Props {
  fontHeading?: string;
  onAbrir: () => void;
}

export default function BannerPromoDuelos({ fontHeading, onAbrir }: Props) {
  return (
    <button
      onClick={onAbrir}
      className="w-full flex items-center gap-3 rounded-2xl p-4 transition-transform active:scale-[0.98] text-left"
      style={{
        background: "linear-gradient(135deg, hsl(142 70% 45% / 0.15), hsl(142 70% 45% / 0.05))",
        border: "1px solid hsl(142 70% 45% / 0.25)",
      }}
    >
      <div
        className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "hsl(142 70% 45% / 0.2)" }}
      >
        <Swords className="h-5.5 w-5.5" style={{ color: "hsl(142 70% 45%)" }} />
      </div>
      <div className="flex-1 min-w-0">
        <h3
          className="text-sm font-bold text-foreground leading-tight"
          style={fontHeading ? { fontFamily: fontHeading } : undefined}
        >
          Duelos entre Motoristas
        </h3>
        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
          Desafie outros motoristas e suba no ranking da cidade!
        </p>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
    </button>
  );
}
