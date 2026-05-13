import { Radio, RadioTower } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  connected: boolean;
  ultimaAtualizacao: Date | null;
}

function formatarHora(data: Date) {
  return data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function IndicadorTempoReal({ connected, ultimaAtualizacao }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className={`gap-1.5 px-2 py-0.5 text-[10px] font-medium ${
          connected
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-muted-foreground/30 text-muted-foreground"
        }`}
      >
        {connected ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Ao vivo
          </>
        ) : (
          <>
            <RadioTower className="h-3 w-3" />
            Conectando…
          </>
        )}
      </Badge>
      {ultimaAtualizacao && (
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Radio className="h-3 w-3" />
          Última atualização: {formatarHora(ultimaAtualizacao)}
        </span>
      )}
    </div>
  );
}