import React, { useState } from "react";
import {
  ArrowLeft,
  Trophy,
  Swords,
  XCircle,
  Percent,
  Flame,
  Crown,
  Send,
  Inbox,
  Ban,
  Equal,
  BarChart3,
  Eye,
} from "lucide-react";
import { useEstatisticasDuelos } from "./hook_estatisticas_duelos";
import CardEstatistica from "./CardEstatistica";
import PerfilCompetitivoSheet from "./PerfilCompetitivoSheet";
import type { DuelParticipant } from "./hook_duelos";

interface Duel {
  id: string;
  status: string;
  challenger_id: string | null;
  challenged_id: string | null;
  winner_id: string | null;
  finished_at?: string | null;
  declined_at?: string | null;
  challenger_rides_count?: number | null;
  challenged_rides_count?: number | null;
  challenger?: { public_nickname?: string | null } | null;
  challenged?: { public_nickname?: string | null } | null;
}

interface Props {
  duels: Duel[] | undefined;
  participantId: string | null;
  onBack: () => void;
}

export default function MeuDesempenhoSheet({ duels, participantId, onBack }: Props) {
  const stats = useEstatisticasDuelos(duels, participantId);
  const [viewingProfile, setViewingProfile] = useState<DuelParticipant | null>(null);

  const historico = (duels || [])
    .filter((d) => d.status === "finished")
    .sort((a, b) => {
      const da = a.finished_at ? new Date(a.finished_at).getTime() : 0;
      const db = b.finished_at ? new Date(b.finished_at).getTime() : 0;
      return db - da;
    });

  const getAdversario = (d: Duel) => {
    if (d.challenger_id === participantId) {
      return d.challenged?.public_nickname || "Adversário";
    }
    return d.challenger?.public_nickname || "Adversário";
  };

  const getAdversarioParticipant = (d: Duel): DuelParticipant | null => {
    if (d.challenger_id === participantId) {
      return d.challenged as DuelParticipant | null;
    }
    return d.challenger as DuelParticipant | null;
  };

  const getMeuPlacar = (d: Duel) => {
    if (d.challenger_id === participantId) return d.challenger_rides_count ?? 0;
    return d.challenged_rides_count ?? 0;
  };

  const getPlacarAdversario = (d: Duel) => {
    if (d.challenger_id === participantId) return d.challenged_rides_count ?? 0;
    return d.challenger_rides_count ?? 0;
  };

  const getResultado = (d: Duel) => {
    if (d.winner_id === participantId) return "vitoria";
    if (d.winner_id === null) return "empate";
    return "derrota";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-auto"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3"
        style={{ backgroundColor: "hsl(var(--background))" }}
      >
        <button
          onClick={onBack}
          className="h-9 w-9 flex items-center justify-center rounded-xl"
          style={{ backgroundColor: "hsl(var(--muted))" }}
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
          Meu Desempenho
        </h1>
      </header>

      <div className="flex-1 px-4 pb-8 space-y-5 max-w-lg mx-auto w-full">
        {/* Grid principal */}
        <div className="grid grid-cols-2 gap-3">
          <CardEstatistica
            icon={Swords}
            valor={stats.totalDisputados}
            label="Duelos"
            cor="hsl(var(--primary))"
          />
          <CardEstatistica
            icon={Trophy}
            valor={stats.vitorias}
            label="Vitórias"
            cor="hsl(var(--success))"
          />
          <CardEstatistica
            icon={XCircle}
            valor={stats.derrotas}
            label="Derrotas"
            cor="hsl(var(--destructive))"
          />
          <CardEstatistica
            icon={Percent}
            valor={`${stats.taxaVitoria}%`}
            label="Taxa de Vitória"
            cor="hsl(var(--warning))"
          />
        </div>

        {/* Streaks */}
        <div className="grid grid-cols-2 gap-3">
          <CardEstatistica
            icon={Flame}
            valor={stats.sequenciaAtual}
            label="Sequência Atual"
            cor="hsl(var(--warning))"
          />
          <CardEstatistica
            icon={Crown}
            valor={stats.maiorSequencia}
            label="Maior Sequência"
            cor="hsl(var(--primary))"
          />
        </div>

        {/* Enviados / Recebidos / Recusas */}
        <div className="grid grid-cols-3 gap-3">
          <CardEstatistica
            icon={Send}
            valor={stats.desafiosEnviados}
            label="Enviados"
            cor="hsl(var(--info))"
          />
          <CardEstatistica
            icon={Inbox}
            valor={stats.desafiosRecebidos}
            label="Recebidos"
            cor="hsl(var(--info))"
          />
          <CardEstatistica
            icon={Ban}
            valor={stats.recusas}
            label="Recusas"
            cor="hsl(var(--muted-foreground))"
          />
        </div>

        {/* Histórico */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Trophy className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />
            Histórico de Confrontos
          </h2>

          {historico.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              Nenhum duelo finalizado ainda
            </p>
          )}

          {historico.map((d) => {
            const resultado = getResultado(d);
            const borderColor =
              resultado === "vitoria"
                ? "hsl(var(--success))"
                : resultado === "derrota"
                ? "hsl(var(--destructive))"
                : "hsl(var(--warning))";

            return (
              <div
                key={d.id}
                className="rounded-xl p-3 flex items-center gap-3"
                style={{
                  backgroundColor: "hsl(var(--card))",
                  borderLeft: `3px solid ${borderColor}`,
                }}
              >
                {/* Resultado icon */}
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor:
                      resultado === "vitoria"
                        ? "hsl(var(--success) / 0.15)"
                        : resultado === "derrota"
                        ? "hsl(var(--destructive) / 0.15)"
                        : "hsl(var(--warning) / 0.15)",
                  }}
                >
                  {resultado === "vitoria" && (
                    <Crown className="h-4 w-4" style={{ color: "hsl(var(--success))" }} />
                  )}
                  {resultado === "derrota" && (
                    <XCircle className="h-4 w-4" style={{ color: "hsl(var(--destructive))" }} />
                  )}
                  {resultado === "empate" && (
                    <Equal className="h-4 w-4" style={{ color: "hsl(var(--warning))" }} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-bold text-foreground truncate cursor-pointer hover:underline flex items-center gap-1"
                    onClick={() => {
                      const p = getAdversarioParticipant(d);
                      if (p) setViewingProfile(p);
                    }}
                  >
                    vs {getAdversario(d)}
                    <Eye className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {d.finished_at
                      ? new Date(d.finished_at).toLocaleDateString("pt-BR")
                      : "—"}
                  </p>
                </div>

                {/* Placar */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-foreground">
                    {getMeuPlacar(d)} × {getPlacarAdversario(d)}
                  </p>
                  <p
                    className="text-[10px] font-semibold"
                    style={{ color: borderColor }}
                  >
                    {resultado === "vitoria"
                      ? "Vitória"
                      : resultado === "derrota"
                      ? "Derrota"
                      : "Empate"}
                  </p>
                </div>
              </div>
            );
          })}
        </section>
      </div>

      {viewingProfile && (
        <PerfilCompetitivoSheet
          participant={viewingProfile}
          onBack={() => setViewingProfile(null)}
        />
      )}
    </div>
  );
}
