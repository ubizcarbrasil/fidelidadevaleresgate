import { Swords, ChevronRight } from "lucide-react";

interface Props {
  fontHeading?: string;
  onAbrir: () => void;
  temDesafioPendente?: boolean;
}

const NEON_GREEN = "#39FF14";

export default function BannerPromoDuelos({ fontHeading, onAbrir, temDesafioPendente }: Props) {
  return (
    <button
      onClick={onAbrir}
      className="relative w-full flex items-center gap-3 rounded-2xl p-4 transition-transform active:scale-[0.98] text-left"
      style={{
        background: temDesafioPendente
          ? `linear-gradient(135deg, ${NEON_GREEN}22, ${NEON_GREEN}0a)`
          : "linear-gradient(135deg, hsl(142 70% 45% / 0.15), hsl(142 70% 45% / 0.05))",
        border: temDesafioPendente
          ? `1.5px solid ${NEON_GREEN}66`
          : "1px solid hsl(142 70% 45% / 0.25)",
        boxShadow: temDesafioPendente ? `0 0 12px ${NEON_GREEN}33` : undefined,
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
          {temDesafioPendente
            ? "⚔️ Você tem um desafio pendente!"
            : "Desafie outros motoristas e suba no ranking da cidade!"}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />

      {/* Badge pulsante neon */}
      {temDesafioPendente && (
        <span
          className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full animate-pulse"
          style={{
            backgroundColor: NEON_GREEN,
            boxShadow: `0 0 8px ${NEON_GREEN}aa`,
          }}
        />
      )}
    </button>
  );
}
