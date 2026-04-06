/**
 * Catálogo de conquistas futuras com chaves pré-definidas.
 * Cada entrada serve como referência para o sistema de medalhas.
 */

export interface DefinicaoConquista {
  key: string;
  label: string;
  description: string;
  iconName: string;
}

export const CATALOGO_CONQUISTAS: DefinicaoConquista[] = [
  {
    key: "first_duel_win",
    label: "Primeira Vitória",
    description: "Venceu seu primeiro duelo",
    iconName: "Swords",
  },
  {
    key: "five_wins_streak",
    label: "5 Vitórias Seguidas",
    description: "Venceu 5 duelos consecutivos",
    iconName: "Flame",
  },
  {
    key: "belt_holder",
    label: "Dono do Cinturão",
    description: "Conquistou o cinturão da cidade",
    iconName: "Crown",
  },
  {
    key: "top1_ranking",
    label: "Número 1",
    description: "Alcançou o primeiro lugar no ranking",
    iconName: "Medal",
  },
  {
    key: "rematch_winner",
    label: "Vingança Completa",
    description: "Venceu a revanche após uma derrota",
    iconName: "RotateCcw",
  },
  {
    key: "season_champion",
    label: "Campeão da Temporada",
    description: "Terminou a temporada em primeiro lugar",
    iconName: "Trophy",
  },
  {
    key: "ten_duels_completed",
    label: "Veterano de Duelos",
    description: "Completou 10 duelos",
    iconName: "Target",
  },
  {
    key: "first_duel_participated",
    label: "Estreia no Ringue",
    description: "Participou do seu primeiro duelo",
    iconName: "Zap",
  },
];
