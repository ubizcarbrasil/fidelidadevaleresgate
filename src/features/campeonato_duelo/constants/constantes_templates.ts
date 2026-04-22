import type {
  PosicaoPremio,
  TemplateCampeonato,
} from "../types/tipos_empreendedor";

/**
 * Rótulos das posições premiáveis do mata-mata.
 */
export const ROTULOS_POSICAO_PREMIO: Record<PosicaoPremio, string> = {
  champion: "Campeão",
  runner_up: "Vice-campeão",
  semifinalist: "Semifinalista",
  quarterfinalist: "Quartas",
  r16: "Oitavas",
};

export const POSICOES_PREMIAVEIS: PosicaoPremio[] = [
  "champion",
  "runner_up",
  "semifinalist",
  "quarterfinalist",
  "r16",
];

/**
 * 3 templates pré-configurados (P3 da especificação C.4).
 * Empreendedor pode editar qualquer campo após escolher o template.
 */
export const TEMPLATES_CAMPEONATO: TemplateCampeonato[] = [
  {
    key: "simples",
    label: "Simples",
    description:
      "2 séries (A e B) — formato enxuto, ideal para cidades menores. 2 sobem, 2 descem.",
    series: [
      { name: "A", size: 16, promote_count: 0, relegate_count: 2 },
      { name: "B", size: 16, promote_count: 2, relegate_count: 0 },
    ],
    prizes: [
      { position: "champion", points: 500 },
      { position: "runner_up", points: 250 },
      { position: "semifinalist", points: 100 },
      { position: "quarterfinalist", points: 50 },
      { position: "r16", points: 25 },
    ],
  },
  {
    key: "padrao",
    label: "Padrão",
    description:
      "3 séries (A, B, C) — equilíbrio entre engajamento e mobilidade entre divisões. 3 sobem/descem na intermediária.",
    series: [
      { name: "A", size: 16, promote_count: 0, relegate_count: 3 },
      { name: "B", size: 16, promote_count: 3, relegate_count: 3 },
      { name: "C", size: 16, promote_count: 3, relegate_count: 0 },
    ],
    prizes: [
      { position: "champion", points: 800 },
      { position: "runner_up", points: 400 },
      { position: "semifinalist", points: 150 },
      { position: "quarterfinalist", points: 80 },
      { position: "r16", points: 40 },
    ],
  },
  {
    key: "completo",
    label: "Completo",
    description:
      "5 séries (A, B, C, D, E) — máxima granularidade para operações grandes. 4 sobem/descem por divisão intermediária.",
    series: [
      { name: "A", size: 16, promote_count: 0, relegate_count: 4 },
      { name: "B", size: 16, promote_count: 4, relegate_count: 4 },
      { name: "C", size: 16, promote_count: 4, relegate_count: 4 },
      { name: "D", size: 16, promote_count: 4, relegate_count: 4 },
      { name: "E", size: 16, promote_count: 4, relegate_count: 0 },
    ],
    prizes: [
      { position: "champion", points: 1200 },
      { position: "runner_up", points: 600 },
      { position: "semifinalist", points: 250 },
      { position: "quarterfinalist", points: 120 },
      { position: "r16", points: 60 },
    ],
  },
];

export function obterTemplatePorChave(
  key: string | null | undefined,
): TemplateCampeonato {
  return (
    TEMPLATES_CAMPEONATO.find((t) => t.key === key) ?? TEMPLATES_CAMPEONATO[1]
  );
}

/**
 * Rótulos / cores dos formatos de engajamento (Duelo Motorista).
 */
export const ROTULOS_FORMATO: Record<string, string> = {
  duelo: "Duelo 1v1",
  mass_duel: "Desafio em Massa",
  campeonato: "Campeonato",
};

export const DESCRICOES_FORMATO: Record<string, string> = {
  duelo:
    "Gamificação contínua 1v1: motoristas se desafiam, ganham e perdem pontos diariamente.",
  mass_duel:
    "Desafio pontual configurável: empreendedor define um período e premia quem mais atender corridas.",
  campeonato:
    "Temporadas mensais com classificação por pontos corridos + mata-mata e séries hierárquicas (A, B, C…).",
};
