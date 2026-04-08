/**
 * Tela principal do módulo de Duelos entre Motoristas.
 */
import React, { useState, useMemo } from "react";
import { useListenerNotificacoesDuelo } from "./hook_listener_notificacoes";
import { ArrowLeft, Swords, Plus, Shield, Clock, Trophy, Flame, Crown, HelpCircle, BarChart3, MessageSquare, Eye, UserCircle, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useDriverSession } from "@/contexts/DriverSessionContext";
import { useDuelParticipation, useDriverDuels } from "./hook_duelos";
import { useDuelosCidade } from "./hook_duelos_publicos";
import DuelCard from "./DuelCard";
import DuelChallengeCard from "./DuelChallengeCard";
import NegociacaoContrapropostaCard from "./NegociacaoContrapropostaCard";
import DuelDetailSheet from "./DuelDetailSheet";
import CreateDuelSheet from "./CreateDuelSheet";
import MeuDesempenhoSheet from "./MeuDesempenhoSheet";
import RankingCidadeSheet from "./RankingCidadeSheet";
import CinturaoCidadeSheet from "./CinturaoCidadeSheet";
import AjudaDuelosSheet from "./AjudaDuelosSheet";
import CardDueloPublico from "./CardDueloPublico";
import ArenaAoVivo from "./ArenaAoVivo";
import PerfilMotoristaSheet from "./PerfilMotoristaSheet";
import FeedAtividadeCidade from "./FeedAtividadeCidade";
import { Skeleton } from "@/components/ui/skeleton";
import type { ConfigDuelos } from "./hook_config_duelos";
import type { Duel } from "./hook_duelos";

interface Props {
  onBack: () => void;
  configDuelos?: ConfigDuelos;
}

export default function DuelsHub({ onBack, configDuelos }: Props) {
  const { driver } = useDriverSession();
  useListenerNotificacoesDuelo();
  const { participant, isLoading: loadingPart, toggleParticipation, toggling } = useDuelParticipation();
  const { data: duels, isLoading: loadingDuels } = useDriverDuels();
  const { data: duelosCidade, isLoading: loadingCidade } = useDuelosCidade(driver?.branch_id);

  const [showCreate, setShowCreate] = useState(false);
  const [showDesempenho, setShowDesempenho] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [showCinturao, setShowCinturao] = useState(false);
  const [showAjuda, setShowAjuda] = useState(false);
  const [selectedDuel, setSelectedDuel] = useState<string | null>(null);
  const [arenaDuel, setArenaDuel] = useState<Duel | null>(null);
  const [showPerfil, setShowPerfil] = useState(false);

  const isEnabled = participant?.duels_enabled === true;
  const participantId = participant?.id || null;

  // Duelos públicos ao vivo na cidade (excluindo os próprios do motorista)
  const meusIds = useMemo(() => new Set((duels || []).map((d) => d.id)), [duels]);

  const duelosCidadeAoVivo = useMemo(() => {
    if (!duelosCidade) return [];
    return duelosCidade.filter((d) => d.status === "live" && !meusIds.has(d.id));
  }, [duelosCidade, meusIds]);

  const duelosCidadeAgendados = useMemo(() => {
    if (!duelosCidade) return [];
    return duelosCidade.filter((d) => d.status === "accepted" && !meusIds.has(d.id));
  }, [duelosCidade, meusIds]);

  // Feed de atividade: todos os duelos da cidade (últimos 30 dias)
  const feedAtividade = useMemo(() => {
    if (!duelosCidade) return [];
    // Excluir duelos já exibidos nas seções "Ao vivo" e "Agendados" da cidade
    const idsDestaque = new Set([
      ...duelosCidadeAoVivo.map((d) => d.id),
      ...duelosCidadeAgendados.map((d) => d.id),
    ]);
    return duelosCidade.filter((d) => !idsDestaque.has(d.id));
  }, [duelosCidade, duelosCidadeAoVivo, duelosCidadeAgendados]);

  const pendingChallenges = useMemo(
    () => (duels || []).filter((d) => d.status === "pending" && d.challenged_id === participantId && d.negotiation_status !== "counter_proposed"),
    [duels, participantId]
  );

  const counterProposals = useMemo(
    () => (duels || []).filter((d) => {
      if (d.status !== "pending" || d.negotiation_status !== "counter_proposed") return false;
      if (d.counter_proposal_by === "challenged" && participantId === d.challenger_id) return true;
      if (d.counter_proposal_by === "challenger" && participantId === d.challenged_id) return true;
      return false;
    }),
    [duels, participantId]
  );

  const liveDuels = useMemo(
    () => (duels || []).filter((d) => d.status === "live" || d.status === "accepted"),
    [duels]
  );

  const scheduledDuels = useMemo(
    () => (duels || []).filter((d) => d.status === "pending" && d.challenger_id === participantId && d.negotiation_status !== "counter_proposed"),
    [duels, participantId]
  );

  const historyDuels = useMemo(
    () => (duels || []).filter((d) => ["finished", "declined", "canceled"].includes(d.status)),
    [duels]
  );

  const selectedDuelData = useMemo(
    () => (duels || []).find((d) => d.id === selectedDuel) || null,
    [duels, selectedDuel]
  );

  const totalDuels = (duels || []).length;
  const hasAnything = totalDuels > 0 || duelosCidadeAoVivo.length > 0 || duelosCidadeAgendados.length > 0 || feedAtividade.length > 0;

  // Arena ao vivo (espectador)
  if (arenaDuel) {
    const updated = (duelosCidade || []).find((d) => d.id === arenaDuel.id) || arenaDuel;
    return <ArenaAoVivo duel={updated} onBack={() => setArenaDuel(null)} />;
  }

  if (showCreate) {
    return <CreateDuelSheet onBack={() => setShowCreate(false)} onSuccess={() => setShowCreate(false)} duracaoMinimaHoras={configDuelos?.duracaoMinimaHoras} />;
  }

  if (showDesempenho) {
    return <MeuDesempenhoSheet duels={duels} participantId={participantId} onBack={() => setShowDesempenho(false)} />;
  }

  if (showRanking) {
    return <RankingCidadeSheet onBack={() => setShowRanking(false)} />;
  }

  if (showPerfil) {
    return <PerfilMotoristaSheet onBack={() => setShowPerfil(false)} />;
  }

  if (showCinturao) {
    return <CinturaoCidadeSheet onBack={() => setShowCinturao(false)} />;
  }

  if (selectedDuelData) {
    return <DuelDetailSheet duel={selectedDuelData} participantId={participantId} onBack={() => setSelectedDuel(null)} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-auto" style={{ backgroundColor: "hsl(var(--background))" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3" style={{ backgroundColor: "hsl(var(--background))" }}>
        <button onClick={onBack} className="h-9 w-9 flex items-center justify-center rounded-xl" style={{ backgroundColor: "hsl(var(--muted))" }}>
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground flex items-center gap-2">
          <Swords className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
          Duelos
        </h1>
        <div className="flex-1" />
        <button
          onClick={() => setShowAjuda(true)}
          className="h-9 w-9 flex items-center justify-center rounded-xl"
          style={{ backgroundColor: "hsl(var(--muted))" }}
          aria-label="Como funciona?"
        >
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
        </button>
      </header>

      <div className="flex-1 px-4 pb-8 space-y-5 max-w-lg mx-auto w-full">
        {/* Status badge — auto-enrolled */}
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "hsl(var(--success) / 0.15)" }}
          >
            <Shield className="h-5 w-5" style={{ color: "hsl(var(--success))" }} />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Duelos Ativos</p>
            <p className="text-[11px] text-muted-foreground">Você está visível para desafios ⚔️</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button onClick={() => setShowCreate(true)} className="flex-1 gap-2">
                <Plus className="h-4 w-4" />
                Desafiar
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDesempenho(true)}
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Desempenho
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPerfil(true)}
                className="gap-2"
                size="icon"
                title="Meu perfil de duelos"
              >
                <UserCircle className="h-4 w-4" />
              </Button>
            </div>
            {configDuelos?.rankingAtivo !== false && (
              <Button
                variant="outline"
                onClick={() => setShowRanking(true)}
                className="w-full gap-2"
              >
                <Trophy className="h-4 w-4" />
                Ranking da Cidade
              </Button>
            )}
            {configDuelos?.cinturaoAtivo !== false && (
              <Button
                variant="outline"
                onClick={() => setShowCinturao(true)}
                className="w-full gap-2"
                style={{ borderColor: "hsl(45 100% 50% / 0.3)", color: "hsl(45, 100%, 50%)" }}
              >
                <Crown className="h-4 w-4" />
                Cinturão da Cidade
              </Button>
            )}
          </div>
        </div>

        {/* ── Duelos ao vivo na cidade (público) ── */}
        {duelosCidadeAoVivo.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Eye className="h-4 w-4" style={{ color: "hsl(var(--success))" }} />
              🔴 Ao vivo na cidade
            </h2>
            <p className="text-[11px] text-muted-foreground -mt-1">
              Assista e dê seu palpite nos duelos acontecendo agora!
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
              {duelosCidadeAoVivo.map((d) => (
                <CardDueloPublico key={d.id} duelo={d} onOpenArena={setArenaDuel} contextoSecao="ao_vivo" />
              ))}
            </div>
          </section>
        )}
        {/* ── Duelos agendados na cidade (público) ── */}
        {duelosCidadeAgendados.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" style={{ color: "hsl(var(--info))" }} />
              📅 Agendados na cidade
            </h2>
            <p className="text-[11px] text-muted-foreground -mt-1">
              Duelos confirmados que vão rolar em breve!
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
              {duelosCidadeAgendados.map((d) => (
                <CardDueloPublico key={d.id} duelo={d} onOpenArena={setArenaDuel} />
              ))}
            </div>
          </section>
        )}


        {pendingChallenges.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Swords className="h-4 w-4" style={{ color: "hsl(var(--warning))" }} />
              Desafios Recebidos
            </h2>
            {pendingChallenges.map((d) => (
              <DuelChallengeCard key={d.id} duel={d} />
            ))}
          </section>
        )}

        {/* Counter-proposals received */}
        {counterProposals.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4" style={{ color: "hsl(var(--info))" }} />
              Contrapropostas
            </h2>
            {counterProposals.map((d) => (
              <NegociacaoContrapropostaCard key={d.id} duel={d} participantId={participantId} />
            ))}
          </section>
        )}

        {liveDuels.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Flame className="h-4 w-4" style={{ color: "hsl(var(--success))" }} />
              Meus Duelos Ao Vivo
            </h2>
            {liveDuels.map((d) => (
              <DuelCard key={d.id} duel={d} participantId={participantId} onClick={() => setSelectedDuel(d.id)} />
            ))}
          </section>
        )}

        {/* Scheduled (sent by me, pending) */}
        {scheduledDuels.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" style={{ color: "hsl(var(--info))" }} />
              Aguardando Resposta
            </h2>
            {scheduledDuels.map((d) => (
              <DuelCard key={d.id} duel={d} participantId={participantId} onClick={() => setSelectedDuel(d.id)} />
            ))}
          </section>
        )}

        {/* History */}
        {historyDuels.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />
              Histórico
            </h2>
            {historyDuels.map((d) => (
              <DuelCard key={d.id} duel={d} participantId={participantId} onClick={() => setSelectedDuel(d.id)} />
            ))}
          </section>
        )}

        {/* ── Feed de Atividade da Cidade ── */}
        <FeedAtividadeCidade
          duelos={feedAtividade}
          onOpenDuel={(d) => {
            const meuDuel = (duels || []).find((md) => md.id === d.id);
            if (meuDuel) {
              setSelectedDuel(d.id);
            } else {
              setArenaDuel(d);
            }
          }}
        />

        {/* Loading state */}
        {(loadingDuels || loadingCidade) && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        )}

        {/* Empty state — only when no personal AND no public duels */}
        {!loadingDuels && !loadingCidade && !hasAnything && (
          <div className="text-center py-8">
            <Swords className="h-12 w-12 mx-auto mb-3" style={{ color: "hsl(var(--muted-foreground) / 0.3)" }} />
            <p className="text-sm text-muted-foreground">Nenhum duelo ainda</p>
            <p className="text-xs text-muted-foreground mt-1">Desafie um motorista e mostre quem manda! 🥊</p>
          </div>
        )}
      </div>

      <AjudaDuelosSheet open={showAjuda} onOpenChange={setShowAjuda} />
    </div>
  );
}
