import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Loader2, Trophy, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useProximosCampeonatos,
  type ProximaTemporada,
} from "../../hooks/hook_proximos_campeonatos";
import { inscreverMotoristaTemporada } from "../../services/servico_inscricao_temporada";

interface Props {
  branchId: string;
  driverId: string;
}

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return "—";
  }
}

function formatarMoeda(cents: number, currency: string | null): string {
  const valor = (cents ?? 0) / 100;
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "BRL",
    }).format(valor);
  } catch {
    return `R$ ${valor.toFixed(2)}`;
  }
}

function classificarFase(t: ProximaTemporada): {
  label: string;
  variant: "outline" | "secondary" | "default";
} {
  const agora = Date.now();
  const abre = t.enrollment_opens_at ? new Date(t.enrollment_opens_at).getTime() : null;
  const fecha = t.enrollment_closes_at
    ? new Date(t.enrollment_closes_at).getTime()
    : null;

  if (abre && agora < abre) {
    return { label: "Aguardando inscrições", variant: "outline" };
  }
  if (abre && fecha && agora >= abre && agora <= fecha) {
    return { label: "Inscrições abertas", variant: "default" };
  }
  return { label: "Em breve", variant: "secondary" };
}

export default function AbaProximosCampeonatos({ branchId, driverId: _driverId }: Props) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch, isFetching } =
    useProximosCampeonatos(branchId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
        <p className="text-sm text-foreground mb-4">
          Não foi possível carregar os próximos campeonatos.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-4">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <CalendarDays className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-base font-bold mb-1">Nenhum campeonato programado</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Quando sua cidade abrir um novo campeonato, ele aparecerá aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isFetching && (
        <p className="text-[11px] text-muted-foreground text-center">
          Atualizando…
        </p>
      )}
      {data.map((t) => (
        <CardProximaTemporada
          key={t.season_id}
          temporada={t}
          onInscricaoOk={() =>
            queryClient.invalidateQueries({
              queryKey: ["campeonato-proximos", branchId],
            })
          }
        />
      ))}
    </div>
  );
}

function CardProximaTemporada({
  temporada,
  onInscricaoOk,
}: {
  temporada: ProximaTemporada;
  onInscricaoOk: () => void;
}) {
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const fase = classificarFase(temporada);
  const ehPaga = (temporada.entry_fee_cents ?? 0) > 0;

  const inscrever = useMutation({
    mutationFn: () => inscreverMotoristaTemporada(temporada.season_id),
    onSuccess: (res) => {
      if (!res.success) {
        const msg = res.error || "Não foi possível inscrever-se.";
        setErroLocal(msg);
        toast.error(msg);
        return;
      }
      setErroLocal(null);
      if (res.status === "approved") {
        toast.success("Inscrição confirmada!");
      } else {
        toast.success("Inscrição enviada — aguardando aprovação.");
      }
      onInscricaoOk();
    },
    onError: (err: any) => {
      const msg = err?.message ?? "Erro ao inscrever-se.";
      setErroLocal(msg);
      toast.error(msg);
    },
  });

  return (
    <article className="rounded-lg border border-border bg-card p-4 space-y-3">
      <header className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <Trophy className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="font-bold text-sm truncate">{temporada.name}</p>
        </div>
        <Badge variant={fase.variant} className="text-[10px] flex-shrink-0">
          {fase.label}
        </Badge>
      </header>

      <div className="text-xs text-muted-foreground">
        Inscrições: {formatarData(temporada.enrollment_opens_at)} até{" "}
        {formatarData(temporada.enrollment_closes_at)}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {ehPaga ? (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 border border-amber-500/30">
            {formatarMoeda(temporada.entry_fee_cents, temporada.entry_fee_currency)}
          </Badge>
        ) : (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 border border-emerald-500/30">
            GRÁTIS
          </Badge>
        )}
        <Badge variant="outline" className="text-[10px]">
          {temporada.tiers_count} séries
        </Badge>
      </div>

      {temporada.prizes_summary && temporada.prizes_summary.length > 0 && (
        <div className="rounded-md bg-muted/40 p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            Premiação
          </p>
          <ul className="space-y-1">
            {temporada.prizes_summary.slice(0, 3).map((p) => (
              <li
                key={`${temporada.season_id}-${p.position}`}
                className="text-xs text-foreground flex items-center gap-2"
              >
                <span className="font-bold text-primary">{p.position}º</span>
                <span className="truncate">
                  {p.description ||
                    [p.prize_kind, p.prize_value].filter(Boolean).join(" · ") ||
                    "Premiação"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <StatusInscricao
        status={temporada.my_enrollment_status}
        ehPaga={ehPaga}
        loading={inscrever.isPending}
        erroLocal={erroLocal}
        onInscrever={() => {
          setErroLocal(null);
          inscrever.mutate();
        }}
      />
    </article>
  );
}

function StatusInscricao({
  status,
  ehPaga,
  loading,
  erroLocal,
  onInscrever,
}: {
  status: ProximaTemporada["my_enrollment_status"];
  ehPaga: boolean;
  loading: boolean;
  erroLocal: string | null;
  onInscrever: () => void;
}) {
  if (status === "approved") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 border border-emerald-500/30">
        Inscrito ✓
      </Badge>
    );
  }
  if (status === "pending") {
    return (
      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 border border-amber-500/30">
        Aguardando aprovação
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <div className="flex flex-col gap-2">
        <Badge variant="destructive" className="self-start">
          Inscrição recusada
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="self-start text-xs"
          onClick={() =>
            toast.error(
              erroLocal ||
                "Sua inscrição foi recusada. Procure o suporte para mais detalhes.",
            )
          }
        >
          Ver motivo
        </Button>
      </div>
    );
  }

  if (ehPaga) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block">
              <Button size="sm" disabled className="w-full sm:w-auto">
                Inscrever-me
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Inscrição paga — disponível em breve</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      size="sm"
      onClick={onInscrever}
      disabled={loading}
      className="w-full sm:w-auto"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Enviando…
        </>
      ) : (
        "Inscrever-me"
      )}
    </Button>
  );
}