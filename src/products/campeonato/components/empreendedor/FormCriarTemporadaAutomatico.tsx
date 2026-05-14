import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";

import {
  TEMPLATES_CAMPEONATO,
  obterTemplatePorChave,
  POSICOES_PREMIAVEIS,
  DUELO_INICIO_HORA,
} from "../../constants/constantes_templates";
import { DURACOES_FASES_PADRAO_HORAS } from "../../constants/constantes_campeonato";
import {
  nomeAutomaticoTemporada,
  paraInputDateTimeLocal,
  type DuracoesFasesHoras,
} from "../../utils/utilitarios_campeonato";
import { minimoDiasClassificacao } from "../../utils/utilitarios_data_final_temporada";
import {
  useCriarTemporadaCompleta,
  useCancelarTemporada,
} from "../../hooks/hook_mutations_campeonato";
import { useCheckSeasonOverlap } from "../../hooks/hook_overlap_temporada";
import type { TemplateKey } from "../../types/tipos_empreendedor";
import PassoMotoristasESeries, {
  type PassoEstado,
} from "./criar_temporada/PassoMotoristasESeries";

interface Props {
  brandId: string;
  branchId: string;
  onClose: () => void;
}

function inicioPadrao(): string {
  const d = new Date();
  d.setHours(DUELO_INICIO_HORA, 0, 0, 0);
  if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
  return paraInputDateTimeLocal(d);
}

function normalizarPara06(valor: string): string {
  if (!valor) return valor;
  const d = new Date(valor);
  if (isNaN(d.getTime())) return valor;
  d.setHours(DUELO_INICIO_HORA, 0, 0, 0);
  return paraInputDateTimeLocal(d);
}

export default function FormCriarTemporadaAutomatico({
  brandId,
  branchId,
  onClose,
}: Props) {
  const [inicio, setInicio] = useState<string>(inicioPadrao());
  const [horas, setHoras] = useState<DuracoesFasesHoras>({
    ...DURACOES_FASES_PADRAO_HORAS,
  });
  const [templateKey, setTemplateKey] = useState<TemplateKey>("padrao");
  const [passo, setPasso] = useState<PassoEstado | null>(null);

  const template = useMemo(
    () => obterTemplatePorChave(templateKey),
    [templateKey],
  );
  const seriesEntrada = useMemo(
    () => template.series.map((s) => ({ name: s.name, size: s.size })),
    [template],
  );
  const maiorSerie = Math.max(0, ...seriesEntrada.map((s) => s.size));
  const [classificacaoDias, setClassificacaoDias] = useState<number>(
    minimoDiasClassificacao(maiorSerie),
  );

  const { mutate, isPending } = useCriarTemporadaCompleta();
  const { mutate: cancelarExistente, isPending: cancelando } =
    useCancelarTemporada(brandId);

  const datasCalculadas = useMemo(() => {
    if (!passo?.calculo) return null;
    return {
      classificationStartsAt: passo.calculo.classificationStartsAt.toISOString(),
      classificationEndsAt: passo.calculo.classificationEndsAt.toISOString(),
      knockoutStartsAt: passo.calculo.knockoutStartsAt.toISOString(),
      knockoutEndsAt: passo.calculo.knockoutEndsAt.toISOString(),
      year: passo.calculo.classificationStartsAt.getFullYear(),
      month: passo.calculo.classificationStartsAt.getMonth() + 1,
    };
  }, [passo]);

  // Conflito mês/ano (mesma queryKey do modo avançado → desduplica)
  const { data: temporadaConflitante } = useQuery({
    queryKey: [
      "check-season-conflict",
      brandId,
      branchId,
      datasCalculadas?.year,
      datasCalculadas?.month,
    ],
    enabled: !!brandId && !!branchId && !!datasCalculadas,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campeonato_seasons")
        .select("id, name")
        .eq("brand_id", brandId)
        .eq("branch_id", branchId)
        .eq("year", datasCalculadas!.year)
        .eq("month", datasCalculadas!.month)
        .is("cancelled_at", null)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 10_000,
  });
  const temConflitoMesAno = !!temporadaConflitante;

  const { data: temporadaSobreposta } = useCheckSeasonOverlap(
    brandId,
    branchId,
    datasCalculadas?.classificationStartsAt,
    datasCalculadas?.knockoutEndsAt,
  );
  const temSobreposicao = !!temporadaSobreposta;

  const inicioInvalido =
    !inicio || !datasCalculadas || isNaN(new Date(inicio).getTime());

  function aoCriar() {
    if (!datasCalculadas) {
      toast.error("Informe uma data de início válida.");
      return;
    }
    if (passo?.bloqueado) {
      toast.error("Resolva os erros do resumo antes de criar.");
      return;
    }
    if (temSobreposicao) {
      toast.error(
        "As datas calculadas se sobrepõem a outra temporada existente desta cidade.",
      );
      return;
    }
    const tpl = obterTemplatePorChave(templateKey);
    const prizesPerTier = tpl.series.reduce<
      Record<string, { position: any; points: number }[]>
    >((acc, s) => {
      acc[s.name] = POSICOES_PREMIAVEIS.map((p) => ({
        position: p,
        points: tpl.prizes.find((x) => x.position === p)?.points ?? 0,
      }));
      return acc;
    }, {});

    mutate(
      {
        brandId,
        branchId,
        name: nomeAutomaticoTemporada(
          datasCalculadas.year,
          datasCalculadas.month,
        ),
        year: datasCalculadas.year,
        month: datasCalculadas.month,
        classificationStartsAt: datasCalculadas.classificationStartsAt,
        classificationEndsAt: datasCalculadas.classificationEndsAt,
        knockoutStartsAt: datasCalculadas.knockoutStartsAt,
        knockoutEndsAt: datasCalculadas.knockoutEndsAt,
        series: tpl.series.map((s) => ({ ...s })),
        prizesPerTier,
        scoringMode: "total_points",
        scoringConfig: { win: 3, draw: 1, loss: 0 },
        enrollmentMode: "auto",
        entryFeeCents: 0,
        enrollmentOpensAt: null,
        enrollmentClosesAt: null,
        defaultMatchHours: horas.oitavas,
        publishToDrivers: true,
      },
      {
        onSuccess: () => {
          toast.success("Temporada criada automaticamente!");
          onClose();
        },
      },
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs sm:text-sm text-muted-foreground">
        <p className="flex items-center gap-2 font-medium text-foreground">
          <Sparkles className="h-4 w-4 text-primary" /> Criação assistida
        </p>
        <p className="mt-1 text-[11px] sm:text-xs">
          Escolha a data de início e o template, selecione os motoristas e veja
          a data final do campeonato calculada em tempo real.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="inicio-auto">Início da temporada</Label>
          <Input
            id="inicio-auto"
            type="datetime-local"
            value={inicio}
            onChange={(e) => setInicio(normalizarPara06(e.target.value))}
          />
          <p className="text-[11px] text-muted-foreground">
            Início às 06:00 (horário local)
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tpl-auto">Template de séries e prêmios</Label>
          <Select
            value={templateKey}
            onValueChange={(v) => setTemplateKey(v as TemplateKey)}
          >
            <SelectTrigger id="tpl-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATES_CAMPEONATO.map((t) => (
                <SelectItem key={t.key} value={t.key}>
                  {t.label} — {t.series.length} série(s)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <PassoMotoristasESeries
        branchId={branchId}
        inicio={inicio}
        series={seriesEntrada}
        horas={horas}
        classificacaoDias={classificacaoDias}
        aoMudarHoras={setHoras}
        aoMudarClassificacaoDias={setClassificacaoDias}
        aoMudar={setPasso}
      />

      {temConflitoMesAno && (
        <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          <p>
            Já existe a temporada{" "}
            <strong>{temporadaConflitante?.name}</strong> nesta cidade. Cancele
            para criar uma nova ou ajuste a data de início.
          </p>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="w-full sm:w-auto"
            disabled={cancelando}
            onClick={() => {
              if (!temporadaConflitante) return;
              cancelarExistente({
                seasonId: temporadaConflitante.id,
                reason: "Substituída por nova temporada",
              });
            }}
          >
            {cancelando && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Cancelar temporada existente
          </Button>
        </div>
      )}

      {temSobreposicao && temporadaSobreposta && (
        <p className="text-xs text-destructive">
          Conflito de período: a temporada{" "}
          <strong>{temporadaSobreposta.name}</strong> ocupa este período nesta
          cidade. Ajuste o início ou as durações para não sobrepor.
        </p>
      )}

      <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isPending}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={aoCriar}
          className="w-full sm:w-auto"
          disabled={
            isPending ||
            inicioInvalido ||
            !!passo?.bloqueado ||
            temConflitoMesAno ||
            temSobreposicao
          }
        >
          {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Criar temporada
        </Button>
      </DialogFooter>
    </div>
  );
}