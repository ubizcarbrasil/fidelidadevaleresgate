/**
 * Seção de gamificação do dashboard do motorista.
 * Visual de arena competitiva com gradientes e clima de disputa.
 */
import { useState } from "react";
import { Swords, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useDuelosCidade } from "../hook_duelos_publicos";
import { useDriverDuels, useDuelParticipation } from "../hook_duelos";
import { useConfigDuelos } from "../hook_config_duelos";
import { useRankingCidade, useMinhaPosicaoRanking } from "../hook_ranking_cidade";
import { useCinturaoCidade } from "../hook_cinturao_cidade";
import { useDriverReputation } from "../hook_avaliacao_duelo";
import CardDuelosAoVivo from "./CardDuelosAoVivo";
import CardRankingCidade from "./CardRankingCidade";
import CardCinturaoCidade from "./CardCinturaoCidade";
import CardDesempenhoPessoal from "./CardDesempenhoPessoal";
import CardPalpitesTorcida from "./CardPalpitesTorcida";
import ArenaAoVivo from "../ArenaAoVivo";
import RankingCidadeSheet from "../RankingCidadeSheet";
import CinturaoCidadeSheet from "../CinturaoCidadeSheet";
import DuelsHub from "../DuelsHub";
import type { Duel } from "../hook_duelos";

interface Props {
  branch: { id: string; brand_id?: string; branch_settings_json?: any } | null;
  customerId: string | undefined;
  fontHeading?: string;
}

export default function SecaoGamificacaoDashboard({ branch, customerId, fontHeading }: Props) {
  const config = useConfigDuelos(branch);
  const { participant } = useDuelParticipation();

  const { data: duelosCidade = [] } = useDuelosCidade(branch?.id);
  const { data: meusDuelos = [] } = useDriverDuels();
  const { data: ranking = [] } = useRankingCidade(config.rankingAtivo ? branch?.id : undefined);
  const { data: minhaPosicao } = useMinhaPosicaoRanking(config.rankingAtivo ? branch?.id : undefined, customerId);
  const { data: campeoes = [] } = useCinturaoCidade(config.cinturaoAtivo ? branch?.id : undefined);
  const { data: reputacao } = useDriverReputation(customerId || null);

  const [arenaDuel, setArenaDuel] = useState<Duel | null>(null);
  const [showRanking, setShowRanking] = useState(false);
  const [showCinturao, setShowCinturao] = useState(false);
  const [showDuelsHub, setShowDuelsHub] = useState(false);

  // Sprint 4A: useConfigDuelos virou wrapper assíncrono. Na primeira render,
  // os 4 booleans-feature retornam `false` enquanto resolvem. Sem este guard,
  // a seção piscaria oculta antes de aparecer.
  if (config.isLoading) return null;
  if (!config.duelosAtivos) return null;

  const participantId = participant?.id || null;

  if (arenaDuel) {
    const updated = duelosCidade.find((d) => d.id === arenaDuel.id) || arenaDuel;
    return <ArenaAoVivo duel={updated} onBack={() => setArenaDuel(null)} />;
  }
  if (showRanking) return <RankingCidadeSheet onBack={() => setShowRanking(false)} />;
  if (showCinturao) return <CinturaoCidadeSheet onBack={() => setShowCinturao(false)} />;
  if (showDuelsHub) return <DuelsHub onBack={() => setShowDuelsHub(false)} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-6 space-y-3"
    >
      {/* Section header — arena banner */}
      <div
        className="rounded-2xl px-4 py-3 flex items-center gap-3 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--destructive) / 0.08) 50%, hsl(var(--warning) / 0.1) 100%)",
          border: "1px solid hsl(var(--primary) / 0.2)",
        }}
      >
        {/* Decorative glow */}
        <div
          className="absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl opacity-30"
          style={{ backgroundColor: "hsl(var(--primary))" }}
        />
        <div className="h-9 w-9 rounded-xl flex items-center justify-center relative z-10" style={{ backgroundColor: "hsl(var(--primary) / 0.2)" }}>
          <Swords className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
        </div>
        <div className="flex-1 relative z-10">
          <h2 className="text-sm font-extrabold tracking-tight text-foreground" style={{ fontFamily: fontHeading }}>
            ⚔️ Arena Competitiva
          </h2>
          <p className="text-[10px] text-muted-foreground">Duelos, ranking e conquistas da cidade</p>
        </div>
      </div>


      {/* 1. Duelos ao vivo */}
      {config.visualizacaoPublica && (
        <CardDuelosAoVivo duelos={duelosCidade} onAbrirArena={setArenaDuel} fontHeading={fontHeading} />
      )}

      {/* 2+3: Ranking + Cinturão side by side on mobile */}
      <div className="grid grid-cols-2 gap-3">
        {config.rankingAtivo && ranking.length > 0 && (
          <CardRankingCidade ranking={ranking} minhaPosicao={minhaPosicao || null} onAbrir={() => setShowRanking(true)} fontHeading={fontHeading} />
        )}
        {config.cinturaoAtivo && campeoes.length > 0 && (
          <CardCinturaoCidade campeoes={campeoes} onAbrir={() => setShowCinturao(true)} fontHeading={fontHeading} />
        )}
      </div>

      {/* 4. Desempenho pessoal */}
      <CardDesempenhoPessoal duels={meusDuelos} participantId={participantId} reputacao={reputacao || null} onAbrir={() => setShowDuelsHub(true)} fontHeading={fontHeading} />

      {/* 5. Palpites / Torcida */}
      {config.visualizacaoPublica && (
        <CardPalpitesTorcida duelos={duelosCidade} onAbrirArena={setArenaDuel} fontHeading={fontHeading} />
      )}
    </motion.div>
  );
}
