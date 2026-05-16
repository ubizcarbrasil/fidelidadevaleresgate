import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Trophy, Crown } from "lucide-react";
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
    // Ordena cada fase por bracket_position
    for (const f of FASES) {
      const arr = m.get(f) ?? [];
      arr.sort((a, b) => a.bracket_position - b.bracket_position);
    }
    return m;
  }, [brackets]);

  // Divide bracket_position em metades superior (esq) e inferior (dir)
  const metades = useMemo(() => {
    function dividir(lista: BracketSlotV2[]): { esq: BracketSlotV2[]; dir: BracketSlotV2[] } {
      const meio = Math.ceil(lista.length / 2);
      return { esq: lista.slice(0, meio), dir: lista.slice(meio) };
    }
    return {
      r16: dividir(porFase.get("r16") ?? []),
      qf: dividir(porFase.get("qf") ?? []),
      sf: dividir(porFase.get("sf") ?? []),
      final: porFase.get("final") ?? [],
    };
  }, [porFase]);

  const campeao = useMemo(() => {
    const f = porFase.get("final") ?? [];
    if (f.length === 0) return null;
    const finalSlot = f[0];
    if (!finalSlot.winner_id) return null;
    if (finalSlot.winner_id === finalSlot.driver_a_id) {
      return { nome: finalSlot.driver_a_name, photo: finalSlot.driver_a_photo_url };
    }
    if (finalSlot.winner_id === finalSlot.driver_b_id) {
      return { nome: finalSlot.driver_b_name, photo: finalSlot.driver_b_photo_url };
    }
    return null;
  }, [porFase]);

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
          <div className="grid grid-cols-[minmax(170px,1fr)_minmax(170px,1fr)_minmax(170px,1fr)_minmax(180px,200px)_minmax(170px,1fr)_minmax(170px,1fr)_minmax(170px,1fr)] gap-2 min-w-[1200px]">
            {/* Cabeçalhos */}
            <FaseHeader fase="r16" />
            <FaseHeader fase="qf" />
            <FaseHeader fase="sf" />
            <FaseHeader fase="final" centro />
            <FaseHeader fase="sf" />
            <FaseHeader fase="qf" />
            <FaseHeader fase="r16" />

            {/* Coluna R16 esquerda */}
            <ColunaBracket
              slots={metades.r16.esq}
              gap="gap-2"
              destacado={faseDestaque === "r16"}
              onSelect={setConfrontoSelecionado}
            />
            {/* QF esquerda */}
            <ColunaBracket
              slots={metades.qf.esq}
              gap="gap-10"
              destacado={faseDestaque === "qf"}
              onSelect={setConfrontoSelecionado}
            />
            {/* SF esquerda */}
            <ColunaBracket
              slots={metades.sf.esq}
              gap="gap-24"
              destacado={faseDestaque === "sf"}
              onSelect={setConfrontoSelecionado}
            />

            {/* Coluna central — Final + Campeão */}
            <div className="flex flex-col items-center justify-center gap-3">
              <CampeaoCentro campeao={campeao} />
              {metades.final.map((b) => (
                <CardConfrontoBracket
                  key={b.id}
                  bracket={b}
                  destacado={faseDestaque === "final"}
                  onClick={() => {
                    if (b.driver_a_id && b.driver_b_id) {
                      setConfrontoSelecionado(b);
                    }
                  }}
                />
              ))}
            </div>

            {/* SF direita */}
            <ColunaBracket
              slots={metades.sf.dir}
              gap="gap-24"
              destacado={faseDestaque === "sf"}
              onSelect={setConfrontoSelecionado}
            />
            {/* QF direita */}
            <ColunaBracket
              slots={metades.qf.dir}
              gap="gap-10"
              destacado={faseDestaque === "qf"}
              onSelect={setConfrontoSelecionado}
            />
            {/* R16 direita */}
            <ColunaBracket
              slots={metades.r16.dir}
              gap="gap-2"
              destacado={faseDestaque === "r16"}
              onSelect={setConfrontoSelecionado}
            />
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

/* ───────────── Cabeçalho de fase ───────────── */

function FaseHeader({ fase, centro }: { fase: FasePhase; centro?: boolean }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-wide text-center text-muted-foreground flex items-center justify-center gap-1 pb-1 border-b border-border/40">
      {(fase === "final" || centro) && <Trophy className="h-3 w-3 text-primary" />}
      {FASE_LABEL[fase]}
    </p>
  );
}

/* ───────────── Coluna de slots ───────────── */

function ColunaBracket({
  slots,
  gap,
  destacado,
  onSelect,
}: {
  slots: BracketSlotV2[];
  gap: string;
  destacado: boolean;
  onSelect: (b: BracketSlotV2) => void;
}) {
  if (slots.length === 0) {
    return <div className="border-r border-border/30" />;
  }
  return (
    <div className={`flex flex-col justify-around flex-1 ${gap} border-r border-border/30 pr-2`}>
      {slots.map((b) => (
        <CardConfrontoBracket
          key={b.id}
          bracket={b}
          destacado={destacado}
          onClick={() => {
            if (b.driver_a_id && b.driver_b_id) {
              onSelect(b);
            }
          }}
        />
      ))}
    </div>
  );
}

/* ───────────── Centro do bracket — Campeão / Trophy ───────────── */

function CampeaoCentro({
  campeao,
}: {
  campeao: { nome: string | null; photo: string | null } | null;
}) {
  if (campeao) {
    return (
      <div className="rounded-lg border-2 border-primary bg-primary/10 p-3 flex flex-col items-center gap-2 w-full">
        <Crown className="h-5 w-5 text-primary" />
        <AvatarMotorista nome={campeao.nome} url={campeao.photo} size={56} />
        <p className="text-xs font-bold text-center truncate w-full">
          {campeao.nome ?? "—"}
        </p>
        <p className="text-[10px] uppercase tracking-wider text-primary font-bold">
          🏆 Campeão
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border-2 border-dashed border-border bg-card p-3 flex flex-col items-center gap-2 w-full">
      <Trophy className="h-10 w-10 text-primary/70" />
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
        🏆 a definir
      </p>
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
          ? "border-primary ring-2 ring-primary/50 neon-glow"
          : "border-primary/40"
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
      <div className="flex items-center gap-2 px-2 py-2">
        <div className="h-10 w-10 rounded-full bg-muted animate-pulse shrink-0" />
        <span className="flex-1 text-xs italic text-muted-foreground truncate">
          A definir
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">—</span>
      </div>
    );
  }
  return (
    <div
      className={`flex items-center gap-2 px-2 py-2 ${
        venceu ? "bg-primary/15" : ""
      }`}
    >
      <AvatarMotorista nome={nome} url={photo} size={40} />
      <span
        className={`flex-1 text-xs truncate ${venceu ? "font-bold" : "font-medium"}`}
      >
        {nome ?? "—"}
      </span>
      <span className="text-xs tabular-nums font-semibold">{rides}</span>
    </div>
  );
}