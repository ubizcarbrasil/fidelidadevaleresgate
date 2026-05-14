import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles, CalendarClock } from "lucide-react";
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
} from "../../constants/constantes_templates";
import { DURACOES_FASES_PADRAO_HORAS } from "../../constants/constantes_campeonato";
import {
  calcularDatasAutomaticas,
  formatarDataHora,
  nomeAutomaticoTemporada,
  paraInputDateTimeLocal,
  type DuracoesFasesHoras,
} from "../../utils/utilitarios_campeonato";
import { useCriarTemporadaCompleta } from "../../hooks/hook_mutations_campeonato";
import { useCheckSeasonOverlap } from "../../hooks/hook_overlap_temporada";
import type { TemplateKey } from "../../types/tipos_empreendedor";

interface Props {
  brandId: string;
  branchId: string;
  onClose: () => void;
}

function inicioPadrao(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
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

  const { mutate, isPending } = useCriarTemporadaCompleta();

  const datasCalculadas = useMemo(() => {
    if (!inicio) return null;
    try {
      return calcularDatasAutomaticas(inicio, horas);
    } catch {
      return null;
    }
  }, [inicio, horas]);

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

  function atualizarHoras(campo: keyof DuracoesFasesHoras, valor: string) {
    const n = Math.max(1, Math.min(720, Math.floor(Number(valor) || 0)));
    setHoras((h) => ({ ...h, [campo]: n }));
  }

  const horasInvalidas =
    !horas.duelo ||
    !horas.oitavas ||
    !horas.quartas ||
    !horas.semi ||
    !horas.final;

  const inicioInvalido =
    !inicio || !datasCalculadas || isNaN(new Date(inicio).getTime());

  function aoCriar() {
    if (!datasCalculadas) {
      toast.error("Informe uma data de início válida.");
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
        defaultMatchHours: horas.duelo,
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
    <div className="space-y-5">
      <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
        <p className="flex items-center gap-2 font-medium text-foreground">
          <Sparkles className="h-4 w-4 text-primary" /> Criação automática
        </p>
        <p className="mt-1 text-xs">
          Informe a data de início e a duração de cada fase. O sistema calcula
          tudo (nome, datas, séries e prêmios) usando o template escolhido.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="inicio-auto">Início da temporada</Label>
        <Input
          id="inicio-auto"
          type="datetime-local"
          value={inicio}
          onChange={(e) => setInicio(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Duração de cada fase (horas)</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(
            [
              { k: "duelo" as const, label: "Duelo" },
              { k: "oitavas" as const, label: "Oitavas" },
              { k: "quartas" as const, label: "Quartas" },
              { k: "semi" as const, label: "Semi" },
              { k: "final" as const, label: "Final" },
            ]
          ).map((f) => (
            <div key={f.k} className="space-y-1">
              <Label htmlFor={`h-${f.k}`} className="text-xs text-muted-foreground">
                {f.label}
              </Label>
              <Input
                id={`h-${f.k}`}
                type="number"
                min={1}
                max={720}
                value={horas[f.k]}
                onChange={(e) => atualizarHoras(f.k, e.target.value)}
              />
            </div>
          ))}
        </div>
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
        <p className="text-xs text-muted-foreground">
          {obterTemplatePorChave(templateKey).description}
        </p>
      </div>

      {datasCalculadas && (
        <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
          <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" /> Resumo calculado
          </p>
          <ul className="space-y-1 text-xs">
            <li>
              <span className="text-muted-foreground">Nome:</span>{" "}
              <span className="font-medium">
                {nomeAutomaticoTemporada(
                  datasCalculadas.year,
                  datasCalculadas.month,
                )}
              </span>
            </li>
            <li>
              <span className="text-muted-foreground">Classificação:</span>{" "}
              {formatarDataHora(datasCalculadas.classificationStartsAt)} →{" "}
              {formatarDataHora(datasCalculadas.classificationEndsAt)}
            </li>
            <li>
              <span className="text-muted-foreground">Mata-mata:</span>{" "}
              {formatarDataHora(datasCalculadas.knockoutStartsAt)} →{" "}
              {formatarDataHora(datasCalculadas.knockoutEndsAt)}
            </li>
          </ul>
        </div>
      )}

      {temConflitoMesAno && (
        <p className="text-xs text-destructive">
          Já existe uma temporada para este mês/ano nesta cidade. Ajuste a data
          de início ou cancele a temporada existente.
        </p>
      )}

      {temSobreposicao && temporadaSobreposta && (
        <p className="text-xs text-destructive">
          Conflito de período: a temporada{" "}
          <strong>{temporadaSobreposta.name}</strong> ocupa{" "}
          {formatarDataHora(temporadaSobreposta.classification_starts_at)} →{" "}
          {formatarDataHora(temporadaSobreposta.knockout_ends_at)} nesta cidade. Ajuste o
          início ou as durações para não sobrepor.
        </p>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={aoCriar}
          disabled={
            isPending ||
            inicioInvalido ||
            horasInvalidas ||
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