import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import AvatarMotorista from "../shared/AvatarMotorista";
import ModalConfrontoChaveamento from "./ModalConfrontoChaveamento";
import { useBracketCampeonatoV2 } from "../../hooks/hook_chaveamento_motorista";
import type {
  BracketSlotV2,
  FasePhase,
  PhaseConfigItem,
} from "../../types/tipos_chaveamento_motorista";

interface Props {
  seasonId: string | null;
  tierId: string | null;
  driverId: string | null;
  faseDestaque?: FasePhase;
}

const FASES: FasePhase[] = ["r16", "qf", "sf", "final"];

const FASE_LABEL: Record<FasePhase, string> = {
  r16: "Oitavas",
  qf: "Quartas",
  sf: "Semifinal",
  final: "Final",
};

const CONFIG_LABEL: Record<PhaseConfigItem["phase"], { label: string; icon: string }> = {
  R16: { label: "Oitavas", icon: "⚔️" },
  QF: { label: "Quartas", icon: "⚔️" },
  SF: { label: "Semifinal", icon: "⚔️" },
  Final: { label: "Final", icon: "🏆" },
};

function formatarDataCurta(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function AbaChaveamento({
  seasonId,
  tierId,
  driverId,
  faseDestaque,
}: Props) {
  const { data, isLoading, error, refetch } = useBracketCampeonatoV2(
    seasonId,
    tierId,
    driverId,
  );

  const [regrasAbertas, setRegrasAbertas] = useState(true);
  const [confrontoSelecionado, setConfrontoSelecionado] = useState<BracketSlotV2 | null>(null);

  const brackets = data?.brackets ?? [];
  const seasonInfo = data?.season_info ?? null;

  const porFase = useMemo(() => {
    const m = new Map<FasePhase, BracketSlotV2[]>();
    for (const f of FASES) m.set(f, []);
    brackets.forEach((b) => {
      const lista = m.get(b.phase);
      if (lista) lista.push(b);
    });
    return m;
  }, [brackets]);

  if (!seasonId || !tierId || !driverId) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-center space-y-2">
        <p className="text-sm text-destructive">Erro ao carregar o chaveamento.</p>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* SEÇÃO 1 — Regras */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <button
          onClick={() => setRegrasAbertas((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors"
        >
          <span className="text-sm font-bold">Regras do Mata-Mata</span>
          {regrasAbertas ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {regrasAbertas && (
          <div className="px-4 pb-4 space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
            {(seasonInfo?.phase_config ?? []).map((pc) => {
              const meta = CONFIG_LABEL[pc.phase];
              return (
                <p key={pc.phase}>
                  {meta.icon} {meta.label} — {pc.duration_hours}h por confronto
                </p>
              );
            })}
            <p>📅 Início: {formatarDataCurta(seasonInfo?.knockout_starts_at ?? null)}</p>
            <p>🏁 Final estimada: {formatarDataCurta(seasonInfo?.knockout_ends_at ?? null)}</p>
          </div>
        )}
      </div>

      {/* SEÇÃO 2 — Bracket */}
      {brackets.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          O chaveamento ainda não foi gerado. Aguarde o fim da fase de classificação.
        </div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {FASES.map((fase) => {
              const lista = porFase.get(fase) ?? [];
              if (lista.length === 0) return null;
              const isDestaque = faseDestaque === fase;
              return (
                <div key={fase} className="flex flex-col gap-3 min-w-[180px]">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-center text-muted-foreground flex items-center justify-center gap-1">
                    {fase === "final" && <Trophy className="h-3 w-3 text-primary" />}
                    {FASE_LABEL[fase]}
                  </p>
                  <div
                    className={`flex flex-col justify-around flex-1 ${
                      fase === "r16"
                        ? "gap-2"
                        : fase === "qf"
                          ? "gap-10"
                          : fase === "sf"
                            ? "gap-24"
                            : "gap-0"
                    }`}
                  >
                    {lista.map((b) => (
                      <CardConfrontoBracket
                        key={b.id}
                        bracket={b}
                        destacado={isDestaque}
                        onClick={() => {
                          if (b.driver_a_id && b.driver_b_id) {
                            setConfrontoSelecionado(b);
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ModalConfrontoChaveamento
        open={!!confrontoSelecionado}
        onOpenChange={(v) => !v && setConfrontoSelecionado(null)}
        confronto={confrontoSelecionado}
        phaseConfig={seasonInfo?.phase_config ?? []}
      />
    </div>
  );
}

/* ───────────── Card de confronto ───────────── */

interface CardProps {
  bracket: BracketSlotV2;
  destacado: boolean;
  onClick: () => void;
}

function CardConfrontoBracket({ bracket, destacado, onClick }: CardProps) {
  const definido = !!bracket.driver_a_id && !!bracket.driver_b_id;
  const isMy = bracket.is_my_match;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!definido}
      className={`w-full rounded-md border bg-card text-left transition-colors ${
        isMy
          ? "border-primary ring-1 ring-primary/40"
          : "border-border/40"
      } ${destacado ? "ring-2 ring-accent/40" : ""} ${
        definido ? "hover:bg-muted/40 cursor-pointer" : "cursor-default opacity-90"
      }`}
    >
      <SlotMotorista
        nome={bracket.driver_a_name}
        photo={bracket.driver_a_photo_url}
        rides={bracket.driver_a_rides}
        venceu={bracket.winner_id === bracket.driver_a_id}
        vago={!bracket.driver_a_id}
      />
      <div className="border-t border-border/40" />
      <SlotMotorista
        nome={bracket.driver_b_name}
        photo={bracket.driver_b_photo_url}
        rides={bracket.driver_b_rides}
        venceu={bracket.winner_id === bracket.driver_b_id}
        vago={!bracket.driver_b_id}
      />
    </button>
  );
}

function SlotMotorista({
  nome,
  photo,
  rides,
  venceu,
  vago,
}: {
  nome: string | null;
  photo: string | null;
  rides: number;
  venceu: boolean;
  vago: boolean;
}) {
  if (vago) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5">
        <div className="h-7 w-7 rounded-full bg-muted animate-pulse shrink-0" />
        <span className="flex-1 text-xs italic text-muted-foreground truncate">
          A definir
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">—</span>
      </div>
    );
  }
  return (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 ${
        venceu ? "bg-primary/10" : ""
      }`}
    >
      <AvatarMotorista nome={nome} url={photo} size={28} />
      <span
        className={`flex-1 text-xs truncate ${venceu ? "font-bold" : "font-medium"}`}
      >
        {nome ?? "—"}
      </span>
      <span className="text-xs tabular-nums font-semibold">{rides}</span>
    </div>
  );
}