/**
 * Tela completa com perfil competitivo de um motorista.
 */
import React from "react";
import {
  ArrowLeft,
  Trophy,
  Target,
  TrendingUp,
  TrendingDown,
  Flame,
  Zap,
  Coins,
  Swords,
  Minus,
  Star,
} from "lucide-react";
import { useDriverCompetitiveProfile, cleanDriverName } from "./hook_duelos";
import { useDriverReputation } from "./hook_avaliacao_duelo";
import type { DuelParticipant } from "./hook_duelos";
import { formatPoints } from "@/lib/formatPoints";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  participant: DuelParticipant;
  onBack: () => void;
}

export default function PerfilCompetitivoSheet({ participant, onBack }: Props) {
  const name = cleanDriverName((participant.customers as any)?.name);
  const nickname = participant.public_nickname;
  const { data: profile, isLoading } = useDriverCompetitiveProfile(participant.customer_id);
  const { data: reputation } = useDriverReputation(participant.customer_id);

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
        <h1 className="text-base font-bold text-foreground">Perfil Competitivo</h1>
      </header>

      <div className="flex-1 px-4 pb-8 max-w-lg mx-auto w-full space-y-4">
        {/* Avatar + Name */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{
              backgroundColor: "hsl(var(--primary) / 0.15)",
              color: "hsl(var(--primary))",
            }}
          >
            {participant.avatar_url ? (
              <img
                src={participant.avatar_url}
                alt={name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{name}</p>
            {nickname && (
              <p className="text-sm text-muted-foreground">@{nickname}</p>
            )}
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Carregando perfil...
          </p>
        ) : !profile ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum dado disponível
          </p>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                icon={<Swords className="h-4 w-4" />}
                label="Duelos"
                value={profile.total_duels.toString()}
                color="primary"
              />
              <StatCard
                icon={<Trophy className="h-4 w-4" />}
                label="Vitórias"
                value={profile.wins.toString()}
                color="primary"
              />
              <StatCard
                icon={<TrendingDown className="h-4 w-4" />}
                label="Derrotas"
                value={profile.losses.toString()}
                color="destructive"
              />
              <StatCard
                icon={<Target className="h-4 w-4" />}
                label="Taxa de Vitória"
                value={`${profile.win_rate}%`}
                color="primary"
              />
            </div>

            {/* Streaks */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
              }}
            >
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Flame className="h-4 w-4" style={{ color: "hsl(var(--warning))" }} />
                Sequências
              </h3>
              <div className="flex justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground">Sequência atual</p>
                  <p className="text-lg font-bold text-foreground flex items-center gap-1">
                    {profile.current_streak > 0 && (
                      <TrendingUp
                        className="h-4 w-4"
                        style={{ color: "hsl(var(--primary))" }}
                      />
                    )}
                    {profile.current_streak < 0 && (
                      <TrendingDown
                        className="h-4 w-4"
                        style={{ color: "hsl(var(--destructive))" }}
                      />
                    )}
                    {profile.current_streak === 0 && (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    )}
                    {Math.abs(profile.current_streak)}
                    <span className="text-xs text-muted-foreground">
                      {profile.current_streak > 0
                        ? "vitórias"
                        : profile.current_streak < 0
                        ? "derrotas"
                        : ""}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground">Melhor sequência</p>
                  <p className="text-lg font-bold text-foreground flex items-center justify-end gap-1">
                    <Zap
                      className="h-4 w-4"
                      style={{ color: "hsl(var(--warning))" }}
                    />
                    {profile.best_streak}
                    <span className="text-xs text-muted-foreground">vitórias</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Points */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
              }}
            >
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Coins className="h-4 w-4" style={{ color: "hsl(var(--warning))" }} />
                Pontos em Duelos
              </h3>
              <div className="flex justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground">Pontos ganhos</p>
                  <p
                    className="text-lg font-bold"
                    style={{ color: "hsl(var(--primary))" }}
                  >
                    +{formatPoints(profile.points_won)} pts
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground">Pontos perdidos</p>
                  <p
                    className="text-lg font-bold"
                    style={{ color: "hsl(var(--destructive))" }}
                  >
                    -{formatPoints(profile.points_lost)} pts
                  </p>
                </div>
              </div>
            </div>

            {/* Recent History */}
            {profile.recent && profile.recent.length > 0 && (
              <div
                className="rounded-xl p-4 space-y-3"
                style={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                <h3 className="text-sm font-bold text-foreground">
                  Histórico Recente
                </h3>
                <div className="space-y-2">
                  {profile.recent.map((d) => {
                    const opName = cleanDriverName(d.opponent_name);
                    const resultColor =
                      d.result === "win"
                        ? "hsl(var(--primary))"
                        : d.result === "loss"
                        ? "hsl(var(--destructive))"
                        : "hsl(var(--muted-foreground))";
                    const resultLabel =
                      d.result === "win"
                        ? "Vitória"
                        : d.result === "loss"
                        ? "Derrota"
                        : "Empate";
                    const resultIcon =
                      d.result === "win" ? "🏆" : d.result === "loss" ? "💀" : "🤝";

                    return (
                      <div
                        key={d.id}
                        className="flex items-center justify-between rounded-lg p-2.5"
                        style={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{resultIcon}</span>
                          <div>
                            <p className="text-xs font-medium text-foreground">
                              vs {opName}
                            </p>
                            {d.finished_at && (
                              <p className="text-[10px] text-muted-foreground">
                                {format(new Date(d.finished_at), "dd/MM/yyyy", {
                                  locale: ptBR,
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className="text-xs font-bold"
                            style={{ color: resultColor }}
                          >
                            {resultLabel}
                          </p>
                          {(d.challenger_points_bet > 0 || d.challenged_points_bet > 0) && (
                            <p className="text-[10px] text-muted-foreground">
                              {formatPoints(d.challenger_points_bet + d.challenged_points_bet)} pts
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "primary" | "destructive";
}) {
  return (
    <div
      className="rounded-xl p-3 flex items-center gap-3"
      style={{
        backgroundColor: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
      }}
    >
      <div
        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
        style={{
          backgroundColor: `hsl(var(--${color}) / 0.15)`,
          color: `hsl(var(--${color}))`,
        }}
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}
