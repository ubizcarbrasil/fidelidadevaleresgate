import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLogEventosTemporada } from "../hooks/hook_log_eventos";
import FiltrosLogEventos from "./filtros_log_eventos";
import LinhaLogEvento from "./linha_log_evento";
import type { RodadaMataMata } from "../types/tipos_campeonato";
import { ROTULOS_RODADA } from "../constants/constantes_campeonato";
import BotaoExportarLog from "./botao_exportar_log";
import {
  validarIntervaloDatas,
  type ResumoFiltrosExport,
} from "../utils/utilitarios_exportacao_log";

interface Props {
  seasonId: string;
}

export default function PainelLogEventos({ seasonId }: Props) {
  const { data, isLoading } = useLogEventosTemporada(seasonId, 200);
  const [rodada, setRodada] = useState<RodadaMataMata | "todas">("todas");
  const [driverId, setDriverId] = useState<string | "todos">("todos");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");

  const motoristas = useMemo(() => {
    if (!data) return [];
    const mapa = new Map<string, string>();
    for (const ev of data) {
      if (ev.driver_name) mapa.set(ev.driver_id, ev.driver_name);
    }
    return Array.from(mapa, ([id, nome]) => ({ id, nome })).sort((a, b) =>
      a.nome.localeCompare(b.nome),
    );
  }, [data]);

  const filtrados = useMemo(() => {
    if (!data) return [];
    const inicioMs = dataInicio ? new Date(dataInicio).getTime() : null;
    const fimMs = dataFim ? new Date(dataFim).getTime() : null;
    return data.filter((ev) => {
      if (rodada !== "todas" && ev.bracket_round !== rodada) return false;
      if (driverId !== "todos" && ev.driver_id !== driverId) return false;
      if (inicioMs != null || fimMs != null) {
        const tsEv = new Date(ev.occurred_at).getTime();
        if (inicioMs != null && tsEv < inicioMs) return false;
        if (fimMs != null && tsEv > fimMs) return false;
      }
      return true;
    });
  }, [data, rodada, driverId, dataInicio, dataFim]);

  // Marcação de "novo" para o item recém-chegado destacar com ring por 3s
  const idsAnteriores = useRef<Set<string>>(new Set());
  const [idsNovos, setIdsNovos] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!data) return;
    const idsAtuais = new Set(data.map((d) => d.id));
    const novos = new Set<string>();
    for (const id of idsAtuais) {
      if (!idsAnteriores.current.has(id)) novos.add(id);
    }
    if (idsAnteriores.current.size > 0 && novos.size > 0) {
      setIdsNovos(novos);
      const t = setTimeout(() => setIdsNovos(new Set()), 3000);
      idsAnteriores.current = idsAtuais;
      return () => clearTimeout(t);
    }
    idsAnteriores.current = idsAtuais;
  }, [data]);

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-lg" />;
  }

  const total = data?.length ?? 0;
  const totalFiltrado = filtrados.length;

  const motoristaSelecionado = motoristas.find((m) => m.id === driverId);
  const validacaoIntervalo = validarIntervaloDatas(dataInicio, dataFim);
  const resumoExport: ResumoFiltrosExport = {
    rodadaLabel: rodada === "todas" ? "Todas as rodadas" : ROTULOS_RODADA[rodada],
    motoristaLabel:
      driverId === "todos" ? "Todos os motoristas" : motoristaSelecionado?.nome ?? driverId,
    dataInicio: dataInicio ? new Date(dataInicio).toISOString() : null,
    dataFim: dataFim ? new Date(dataFim).toISOString() : null,
    total: totalFiltrado,
    totalGeral: total,
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Log de eventos</h3>
          <Badge variant="outline" className="text-[10px]">
            {totalFiltrado}
            {totalFiltrado !== total ? ` de ${total}` : ""}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FiltrosLogEventos
            rodada={rodada}
            aoMudarRodada={setRodada}
            driverId={driverId}
            aoMudarDriver={setDriverId}
            motoristas={motoristas}
            dataInicio={dataInicio}
            aoMudarDataInicio={setDataInicio}
            dataFim={dataFim}
            aoMudarDataFim={setDataFim}
          />
          <BotaoExportarLog
            eventos={filtrados}
            resumo={resumoExport}
            desabilitado={!validacaoIntervalo.valido}
            motivoBloqueio={validacaoIntervalo.motivo}
          />
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <Inbox className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-1 text-base font-semibold">
            {total === 0 ? "Nenhum evento ainda" : "Nenhum evento para o filtro"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {total === 0
              ? "Os eventos aparecerão aqui assim que motoristas começarem a pontuar nos confrontos."
              : "Ajuste os filtros para ver outros eventos da temporada."}
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[60vh] rounded-lg border border-border">
          <div className="space-y-2 p-2">
            {filtrados.map((evento) => (
              <LinhaLogEvento
                key={evento.id}
                evento={evento}
                novo={idsNovos.has(evento.id)}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}