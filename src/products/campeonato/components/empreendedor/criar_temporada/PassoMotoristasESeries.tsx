import { useEffect, useMemo, useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TabelaMotoristasRanqueados from "./TabelaMotoristasRanqueados";
import PainelResumoTemporada from "./PainelResumoTemporada";
import EditorManualSeries from "./EditorManualSeries";
import {
  useMotoristasRanqueados,
  type MotoristaRanqueado,
} from "../../../hooks/hook_motoristas_ranqueados";
import {
  calcularResumoTemporada,
  distribuirTopNPorSerie,
  gerarAvisos,
  minimoDiasClassificacao,
  type CalculoTemporadaResultado,
} from "../../../utils/utilitarios_data_final_temporada";
import type { DuracoesFasesHoras } from "../../../utils/utilitarios_campeonato";

export interface SerieEntrada {
  name: string;
  size: number;
}

export interface PassoEstado {
  selecionados: string[];
  distribuicao: Record<string, string[]>; // tier name → customer_ids
  classificacaoDias: number;
  horas: DuracoesFasesHoras;
  calculo: CalculoTemporadaResultado | null;
  bloqueado: boolean;
}

interface Props {
  branchId: string;
  inicio: string; // datetime-local
  series: SerieEntrada[];
  horas: DuracoesFasesHoras;
  classificacaoDias: number;
  aoMudarHoras: (h: DuracoesFasesHoras) => void;
  aoMudarClassificacaoDias: (d: number) => void;
  aoMudar: (estado: PassoEstado) => void;
}

export default function PassoMotoristasESeries({
  branchId,
  inicio,
  series,
  horas,
  classificacaoDias,
  aoMudarHoras,
  aoMudarClassificacaoDias,
  aoMudar,
}: Props) {
  const { data: ranking } = useMotoristasRanqueados(branchId, 30);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [distribuicao, setDistribuicao] = useState<Record<string, string[]>>(
    {},
  );

  // Mantém só ids ainda existentes na cidade quando o ranking muda.
  useEffect(() => {
    if (!ranking) return;
    const ids = new Set(ranking.map((m) => m.customer_id));
    setSelecionados((prev) => new Set([...prev].filter((id) => ids.has(id))));
    setDistribuicao((prev) => {
      const next: Record<string, string[]> = {};
      for (const [k, arr] of Object.entries(prev)) {
        next[k] = arr.filter((id) => ids.has(id));
      }
      return next;
    });
  }, [ranking]);

  // Quando séries mudam, mantém só tiers válidos.
  useEffect(() => {
    setDistribuicao((prev) => {
      const next: Record<string, string[]> = {};
      for (const s of series) next[s.name] = prev[s.name] ?? [];
      return next;
    });
  }, [series.map((s) => s.name).join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  function alternar(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        // remove da distribuição também
        setDistribuicao((d) => {
          const r: Record<string, string[]> = {};
          for (const [k, arr] of Object.entries(d))
            r[k] = arr.filter((x) => x !== id);
          return r;
        });
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selecionarTodos(ids: string[]) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }

  function limparSelecao() {
    setSelecionados(new Set());
    setDistribuicao(() => {
      const next: Record<string, string[]> = {};
      for (const s of series) next[s.name] = [];
      return next;
    });
  }

  function distribuirAutomaticamente() {
    if (!ranking) return;
    const ordenados = ranking
      .filter((m) => selecionados.has(m.customer_id))
      .sort((a, b) => a.rank_position - b.rank_position);
    const dist = distribuirTopNPorSerie(
      ordenados as MotoristaRanqueado[],
      series,
    );
    const map: Record<string, string[]> = {};
    for (const [k, arr] of Object.entries(dist))
      map[k] = arr.map((m) => m.customer_id);
    setDistribuicao(map);
  }

  function selecionarECompletarTopN() {
    if (!ranking) return;
    const total = series.reduce((a, s) => a + s.size, 0);
    const topN = ranking.slice(0, total).map((m) => m.customer_id);
    setSelecionados(new Set(topN));
    const ordenados = ranking
      .filter((m) => topN.includes(m.customer_id))
      .sort((a, b) => a.rank_position - b.rank_position);
    const dist = distribuirTopNPorSerie(ordenados, series);
    const map: Record<string, string[]> = {};
    for (const [k, arr] of Object.entries(dist))
      map[k] = arr.map((m) => m.customer_id);
    setDistribuicao(map);
  }

  function moverManual(
    driverId: string,
    de: string | null,
    para: string | null,
  ) {
    setDistribuicao((prev) => {
      const next: Record<string, string[]> = {};
      for (const [k, arr] of Object.entries(prev))
        next[k] = arr.filter((id) => id !== driverId);
      if (para) {
        next[para] = [...(next[para] ?? []), driverId];
      }
      return next;
    });
    if (para) {
      setSelecionados((prev) => {
        if (prev.has(driverId)) return prev;
        const n = new Set(prev);
        n.add(driverId);
        return n;
      });
    }
    void de;
  }

  function reordenarManual(
    serie: string,
    driverId: string,
    acao: "subir" | "descer" | "topo" | "fundo",
  ) {
    setDistribuicao((prev) => {
      const arr = [...(prev[serie] ?? [])];
      const idx = arr.indexOf(driverId);
      if (idx === -1) return prev;
      arr.splice(idx, 1);
      let destino = idx;
      if (acao === "subir") destino = Math.max(0, idx - 1);
      else if (acao === "descer") destino = Math.min(arr.length, idx + 1);
      else if (acao === "topo") destino = 0;
      else if (acao === "fundo") destino = arr.length;
      arr.splice(destino, 0, driverId);
      return { ...prev, [serie]: arr };
    });
  }

  function ordenarPorRanking(serie: string) {
    if (!ranking) return;
    const ordemRank = new Map(
      ranking.map((m) => [m.customer_id, m.rank_position] as const),
    );
    setDistribuicao((prev) => {
      const arr = [...(prev[serie] ?? [])];
      arr.sort(
        (a, b) =>
          (ordemRank.get(a) ?? Number.MAX_SAFE_INTEGER) -
          (ordemRank.get(b) ?? Number.MAX_SAFE_INTEGER),
      );
      return { ...prev, [serie]: arr };
    });
  }

  // Mapa customer_id → série
  const serieDe = useMemo(() => {
    const m = new Map<string, string>();
    for (const [tier, ids] of Object.entries(distribuicao)) {
      for (const id of ids) m.set(id, tier);
    }
    return m;
  }, [distribuicao]);

  const indiceMotoristas = useMemo(() => {
    const m = new Map<string, { driver_name: string | null }>();
    for (const x of ranking ?? [])
      m.set(x.customer_id, { driver_name: x.driver_name });
    return m;
  }, [ranking]);

  const seriesAlocadas = useMemo(
    () =>
      series.map((s) => {
        const ids = distribuicao[s.name] ?? [];
        return {
          name: s.name,
          size: s.size,
          alocados: ids.length,
          ordem: ids.map((id) => ({
            customer_id: id,
            driver_name: indiceMotoristas.get(id)?.driver_name ?? null,
          })),
        };
      }),
    [series, distribuicao, indiceMotoristas],
  );

  const calculo = useMemo(
    () =>
      calcularResumoTemporada({
        inicio,
        classificacaoDias,
        horas,
        series: seriesAlocadas.map((s) => ({
          name: s.name,
          size: s.size,
          alocados: s.alocados,
        })),
      }),
    [inicio, classificacaoDias, horas, seriesAlocadas],
  );

  const avisos = useMemo(
    () =>
      gerarAvisos({
        classificacaoDias,
        series: seriesAlocadas,
        totalSelecionados: selecionados.size,
      }),
    [classificacaoDias, seriesAlocadas, selecionados.size],
  );

  const bloqueado = avisos.some((a) => a.tipo === "erro");

  // Notifica o pai quando algo relevante muda
  useEffect(() => {
    aoMudar({
      selecionados: Array.from(selecionados),
      distribuicao,
      classificacaoDias,
      horas,
      calculo,
      bloqueado,
    });
  }, [selecionados, distribuicao, classificacaoDias, horas, calculo, bloqueado]); // eslint-disable-line react-hooks/exhaustive-deps

  const maiorSerie = Math.max(0, ...series.map((s) => s.size));
  const minDias = minimoDiasClassificacao(maiorSerie);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2 rounded-md border border-primary/20 bg-primary/5 p-3">
        <div className="space-y-1">
          <Label htmlFor="class-dias" className="text-xs">
            Classificação (dias)
          </Label>
          <Input
            id="class-dias"
            type="number"
            min={1}
            max={60}
            className="h-9 w-24"
            value={classificacaoDias}
            onChange={(e) =>
              aoMudarClassificacaoDias(
                Math.max(1, Math.min(60, Math.floor(Number(e.target.value) || 1))),
              )
            }
          />
          <p className="text-[10px] text-muted-foreground">
            Mínimo recomendado: {minDias}d
          </p>
        </div>
        {(["oitavas", "quartas", "semi", "final"] as const).map((k) => (
          <div key={k} className="space-y-1">
            <Label htmlFor={`fase-${k}`} className="text-xs capitalize">
              {k} (h)
            </Label>
            <Input
              id={`fase-${k}`}
              type="number"
              min={1}
              max={720}
              className="h-9 w-20"
              value={horas[k]}
              onChange={(e) =>
                aoMudarHoras({
                  ...horas,
                  [k]: Math.max(1, Math.min(720, Math.floor(Number(e.target.value) || 1))),
                })
              }
            />
          </div>
        ))}
        <div className="ml-auto flex flex-col gap-1.5 sm:flex-row">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={selecionarECompletarTopN}
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Top {series.reduce((a, s) => a + s.size, 0)} automático
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={distribuirAutomaticamente}
            disabled={selecionados.size === 0}
          >
            <Wand2 className="mr-1.5 h-3.5 w-3.5" />
            Distribuir nas séries
          </Button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
        <div className="h-[480px]">
          <TabelaMotoristasRanqueados
            branchId={branchId}
            selecionados={selecionados}
            serieDe={serieDe}
            aoAlternar={alternar}
            aoSelecionarTodos={selecionarTodos}
            aoLimparSelecao={limparSelecao}
          />
        </div>
        <PainelResumoTemporada
          totalSelecionados={selecionados.size}
          series={seriesAlocadas}
          calculo={calculo}
          avisos={avisos}
        />
      </div>

      <EditorManualSeries
        series={series}
        distribuicao={distribuicao}
        selecionados={selecionados}
        motoristas={ranking ?? []}
        aoMover={moverManual}
        aoReordenar={reordenarManual}
        aoOrdenarPorRanking={ordenarPorRanking}
      />
    </div>
  );
}