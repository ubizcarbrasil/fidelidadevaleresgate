/**
 * Seção de gamificação do dashboard do motorista.
 * Reúne os 5 cards de duelos, ranking, cinturão, desempenho e palpites.
 * Respeita a configuração do módulo de duelos da cidade.
 */
import { useState } from "react";
import { Swords, Zap } from "lucide-react";
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
  branch: { id: string; branch_settings_json?: any } | null;
  customerId: string | undefined;
  fontHeading?: string;
}

export default function SecaoGamificacaoDashboard({ branch, customerId, fontHeading }: Props) {
  const config = useConfigDuelos(branch);
  const { participant } = useDuelParticipation();

  // Data hooks
  const { data: duelosCidade = [] } = useDuelosCidade(branch?.id);
  const { data: meusDuelos = [] } = useDriverDuels();
  const { data: ranking = [] } = useRankingCidade(config.rankingAtivo ? branch?.id : undefined);
  const { data: minhaPosicao } = useMinhaPosicaoRanking(config.rankingAtivo ? branch?.id : undefined, customerId);
  const { data: campeoes = [] } = useCinturaoCidade(config.cinturaoAtivo ? branch?.id : undefined);
  const { data: reputacao } = useDriverReputation(customerId || null);

  // Overlays
  const [arenaDuel, setArenaDuel] = useState<Duel | null>(null);
  const [showRanking, setShowRanking] = useState(false);
  const [showCinturao, setShowCinturao] = useState(false);
  const [showDuelsHub, setShowDuelsHub] = useState(false);

  // Module off => nothing
  if (!config.duelosAtivos) return null;

  const participou = !!participant?.duels_enabled;
  const participantId = participant?.id || null;

  // Overlays
  if (arenaDuel) {
    const updated = duelosCidade.find((d) => d.id === arenaDuel.id) || arenaDuel;
    return <ArenaAoVivo duel={updated} onBack={() => setArenaDuel(null)} />;
  }
  if (showRanking) return <RankingCidadeSheet onBack={() => setShowRanking(false)} />;
  if (showCinturao) return <CinturaoCidadeSheet onBack={() => setShowCinturao(false)} />;
  if (showDuelsHub) return <DuelsHub onBack={() => setShowDuelsHub(false)} />;

  return (
    <div className="space-y-3 mt-5">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Swords className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />
        <h2 className="text-sm font-bold text-foreground" style={{ fontFamily: fontHeading }}>
          Arena Competitiva
        </h2>
      </div>

      {/* Convite para ativar se não participou */}
      {!participou && (
        <div
          className="rounded-2xl p-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.03))",
            border: "1px solid hsl(var(--primary) / 0.25)",
          }}
          onClick={() => setShowDuelsHub(true)}
        >
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "hsl(var(--primary) / 0.15)" }}>
            <Zap className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">Entre na arena!</p>
            <p className="text-[11px] text-muted-foreground">
              Ative os duelos e desafie outros motoristas da cidade
            </p>
          </div>
        </div>
      )}

      {/* 1. Duelos ao vivo */}
      {config.visualizacaoPublica && (
        <CardDuelosAoVivo
          duelos={duelosCidade}
          onAbrirArena={setArenaDuel}
          fontHeading={fontHeading}
        />
      )}

      {/* 2. Ranking */}
      {config.rankingAtivo && ranking.length > 0 && (
        <CardRankingCidade
          ranking={ranking}
          minhaPosicao={minhaPosicao || null}
          onAbrir={() => setShowRanking(true)}
          fontHeading={fontHeading}
        />
      )}

      {/* 3. Cinturão */}
      {config.cinturaoAtivo && campeoes.length > 0 && (
        <CardCinturaoCidade
          campeoes={campeoes}
          onAbrir={() => setShowCinturao(true)}
          fontHeading={fontHeading}
        />
      )}

      {/* 4. Desempenho pessoal */}
      {participou && (
        <CardDesempenhoPessoal
          duels={meusDuelos}
          participantId={participantId}
          reputacao={reputacao || null}
          onAbrir={() => setShowDuelsHub(true)}
          fontHeading={fontHeading}
        />
      )}

      {/* 5. Palpites / Torcida */}
      {config.visualizacaoPublica && (
        <CardPalpitesTorcida
          duelos={duelosCidade}
          onAbrirArena={setArenaDuel}
          fontHeading={fontHeading}
        />
      )}
    </div>
  );
}
