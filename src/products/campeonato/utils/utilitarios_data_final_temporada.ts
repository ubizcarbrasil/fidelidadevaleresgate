import type { DuracoesFasesHoras } from "./utilitarios_campeonato";

export interface SerieResumo {
  name: string;
  size: number;
  alocados?: number;
}

export interface CalculoTemporadaResultado {
  classificationStartsAt: Date;
  classificationEndsAt: Date;
  knockoutStartsAt: Date;
  knockoutEndsAt: Date;
  classificationDays: number;
  knockoutHoursTotal: number;
  knockoutPhasesUsed: Array<"oitavas" | "quartas" | "semi" | "final">;
  duelosPorSerie: Array<{ name: string; size: number; duelos: number }>;
  totalDuelos: number;
}

/**
 * Determina quais fases do mata-mata são necessárias dada a maior série.
 * - >=16 → oitavas, quartas, semi, final
 * - >=8  → quartas, semi, final
 * - >=4  → semi, final
 * - >=2  → final
 */
export function fasesMataMataNecessarias(
  maiorSerie: number,
): Array<"oitavas" | "quartas" | "semi" | "final"> {
  const fases: Array<"oitavas" | "quartas" | "semi" | "final"> = [];
  if (maiorSerie >= 16) fases.push("oitavas");
  if (maiorSerie >= 8) fases.push("quartas");
  if (maiorSerie >= 4) fases.push("semi");
  if (maiorSerie >= 2) fases.push("final");
  return fases;
}

/**
 * Mínimo recomendado de dias para a fase de Classificação (round-robin):
 * `maiorSerie - 1` com piso de 7 dias.
 */
export function minimoDiasClassificacao(maiorSerie: number): number {
  if (!maiorSerie || maiorSerie < 2) return 7;
  return Math.max(7, maiorSerie - 1);
}

/** Round-robin: n*(n-1)/2 confrontos por série. */
export function duelosRoundRobin(n: number): number {
  if (!n || n < 2) return 0;
  return (n * (n - 1)) / 2;
}

/**
 * Calcula reativamente todas as datas, fases e duelos a partir
 * da configuração atual. Não bloqueia: retorna mesmo com séries vazias.
 */
export function calcularResumoTemporada(params: {
  inicio: string; // datetime-local
  classificacaoDias: number;
  horas: DuracoesFasesHoras;
  series: SerieResumo[];
}): CalculoTemporadaResultado | null {
  const start = new Date(params.inicio);
  if (isNaN(start.getTime())) return null;

  const HORA_MS = 60 * 60 * 1000;
  const DIA_MS = 24 * HORA_MS;

  const classDias = Math.max(1, Math.floor(params.classificacaoDias || 1));
  const classEnd = new Date(start.getTime() + classDias * DIA_MS);

  const maior = Math.max(0, ...params.series.map((s) => Number(s.size) || 0));
  const fasesUsadas = fasesMataMataNecessarias(maior);

  const horasTotalMataMata = fasesUsadas.reduce(
    (acc, k) => acc + (Number(params.horas[k]) || 0),
    0,
  );

  const knockStart = classEnd;
  const knockEnd = new Date(knockStart.getTime() + horasTotalMataMata * HORA_MS);

  const duelosPorSerie = params.series.map((s) => {
    const tamanhoEfetivo = Math.max(0, s.alocados ?? s.size);
    return {
      name: s.name,
      size: tamanhoEfetivo,
      duelos: duelosRoundRobin(tamanhoEfetivo),
    };
  });

  const totalDuelos = duelosPorSerie.reduce((acc, x) => acc + x.duelos, 0);

  return {
    classificationStartsAt: start,
    classificationEndsAt: classEnd,
    knockoutStartsAt: knockStart,
    knockoutEndsAt: knockEnd,
    classificationDays: classDias,
    knockoutHoursTotal: horasTotalMataMata,
    knockoutPhasesUsed: fasesUsadas,
    duelosPorSerie,
    totalDuelos,
  };
}

export interface AvisoTemporada {
  tipo: "erro" | "alerta" | "info";
  mensagem: string;
}

export function gerarAvisos(params: {
  classificacaoDias: number;
  series: Array<{ name: string; size: number; alocados: number }>;
  totalSelecionados: number;
}): AvisoTemporada[] {
  const avisos: AvisoTemporada[] = [];
  const maior = Math.max(0, ...params.series.map((s) => s.size));
  const minDias = minimoDiasClassificacao(maior);

  if (params.classificacaoDias < minDias) {
    avisos.push({
      tipo: "alerta",
      mensagem: `Classificação curta para a maior série (${maior} motoristas). Recomendado ao menos ${minDias} dias.`,
    });
  }

  for (const s of params.series) {
    if (s.alocados < 2) {
      avisos.push({
        tipo: "erro",
        mensagem: `Série ${s.name} tem ${s.alocados} motorista(s). Mínimo: 2.`,
      });
    } else if (s.alocados < s.size) {
      avisos.push({
        tipo: "info",
        mensagem: `Série ${s.name}: ${s.alocados}/${s.size} preenchida.`,
      });
    } else if (s.alocados > s.size) {
      avisos.push({
        tipo: "alerta",
        mensagem: `Série ${s.name} acima da capacidade (${s.alocados}/${s.size}).`,
      });
    }
  }

  const capacidadeTotal = params.series.reduce((a, s) => a + s.size, 0);
  if (params.totalSelecionados < capacidadeTotal) {
    avisos.push({
      tipo: "info",
      mensagem: `${params.totalSelecionados} motoristas selecionados para ${capacidadeTotal} vagas.`,
    });
  }

  return avisos;
}

/**
 * Distribui motoristas top-N por série, na ordem A → B → C ...
 * Sobras vão para a última série (ou ficam de fora se exceder em muito).
 */
export function distribuirTopNPorSerie<T extends { customer_id: string }>(
  motoristasOrdenados: T[],
  series: Array<{ name: string; size: number }>,
): Record<string, T[]> {
  const resultado: Record<string, T[]> = {};
  series.forEach((s) => (resultado[s.name] = []));
  let cursor = 0;
  for (const s of series) {
    const fim = Math.min(cursor + s.size, motoristasOrdenados.length);
    resultado[s.name] = motoristasOrdenados.slice(cursor, fim);
    cursor = fim;
  }
  if (cursor < motoristasOrdenados.length && series.length > 0) {
    const ultima = series[series.length - 1].name;
    resultado[ultima] = [
      ...resultado[ultima],
      ...motoristasOrdenados.slice(cursor),
    ];
  }
  return resultado;
}