import {
  Trophy,
  RefreshCcw,
  Swords,
  Crown,
  Target,
  Newspaper,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  useNoticiasCampeonato,
  type NoticiaCampeonatoEvento,
} from "../../hooks/hook_noticias_campeonato";

interface Props {
  seasonId: string | null;
}

const ICONE_EVENTO: Record<NoticiaCampeonatoEvento, typeof Trophy> = {
  season_created: Trophy,
  phase_changed: RefreshCcw,
  knockout_started: Swords,
  champion_crowned: Crown,
  tier_seeded: Target,
};

const LABEL_EVENTO: Record<NoticiaCampeonatoEvento, string> = {
  season_created: "Campeonato criado",
  phase_changed: "Nova fase iniciada",
  knockout_started: "Mata-mata começou!",
  champion_crowned: "Campeão coroado!",
  tier_seeded: "Séries definidas",
};

function formatarDataHora(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AbaNoticias({ seasonId }: Props) {
  if (!seasonId) {
    return (
      <EstadoVazio
        titulo="Aguardando temporada ativa"
        descricao="Quando uma nova temporada começar, as novidades aparecem aqui."
      />
    );
  }

  return <ListaNoticias seasonId={seasonId} />;
}

function ListaNoticias({ seasonId }: { seasonId: string }) {
  const { data, isLoading, isError, refetch } = useNoticiasCampeonato(seasonId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
        <p className="text-sm text-foreground mb-4">
          Não foi possível carregar as novidades.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EstadoVazio
        titulo="Nenhuma novidade por enquanto"
        descricao="Os eventos do campeonato aparecerão aqui assim que acontecerem."
      />
    );
  }

  return (
    <ul className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
      {data.map((n) => {
        const Icon = ICONE_EVENTO[n.event_type] ?? Newspaper;
        const label = LABEL_EVENTO[n.event_type] ?? "Atualização do campeonato";
        return (
          <li key={n.id} className="flex items-start gap-3 px-4 py-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {formatarDataHora(n.created_at)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function EstadoVazio({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Newspaper className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-base font-bold mb-1">{titulo}</p>
      <p className="text-sm text-muted-foreground max-w-xs">{descricao}</p>
    </div>
  );
}