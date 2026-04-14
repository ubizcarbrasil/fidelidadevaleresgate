import { BookOpen, ChevronRight } from "lucide-react";

interface Props {
  fontHeading?: string;
  onClick: () => void;
}

export default function HomeManualSection({ fontHeading, onClick }: Props) {
  return (
    <div className="px-4">
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 rounded-2xl p-4 transition-transform active:scale-[0.98] text-left"
        style={{
          backgroundColor: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <div
          className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "hsl(var(--accent) / 0.15)" }}
        >
          <BookOpen className="h-5 w-5 text-accent-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground" style={{ fontFamily: fontHeading }}>
            Como funciona o programa
          </p>
          <p className="text-[11px] text-muted-foreground">
            Entenda como ganhar e usar seus pontos
          </p>
        </div>
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      </button>
    </div>
  );
}
