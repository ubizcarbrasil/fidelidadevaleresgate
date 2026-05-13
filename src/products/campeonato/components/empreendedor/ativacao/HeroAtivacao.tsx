import { Trophy, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function HeroAtivacao() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/20">
          <Trophy className="h-8 w-8 text-primary-foreground" />
        </div>
        <div className="space-y-2">
          <Badge
            variant="secondary"
            className="gap-1 border border-primary/30 bg-primary/10 text-primary"
          >
            <Sparkles className="h-3 w-3" /> Recurso recomendado
          </Badge>
          <h2 className="text-xl font-bold leading-tight sm:text-2xl">
            Campeonato Duelo Motorista
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Transforme seus motoristas em competidores. Temporadas mensais,
            séries hierárquicas e prêmios reais — tudo automatizado.
          </p>
        </div>
      </div>
    </div>
  );
}