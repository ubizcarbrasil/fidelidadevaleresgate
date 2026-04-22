import { useState, useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Settings, Trophy, ListChecks } from "lucide-react";
import { schemaCriarTemporada, type FormCriarTemporadaInput } from "../../schemas/schema_criar_temporada";
import {
  obterTemplatePorChave,
  POSICOES_PREMIAVEIS,
} from "../../constants/constantes_templates";
import {
  deInputDate,
  gerarDatasSugeridas,
  nomeAutomaticoTemporada,
  paraInputDate,
} from "../../utils/utilitarios_campeonato";
import { useCriarTemporadaCompleta } from "../../hooks/hook_mutations_campeonato";
import type { TemplateKey } from "../../types/tipos_empreendedor";
import SeletorTemplate from "./SeletorTemplate";
import EditorInformacoesBasicas from "./EditorInformacoesBasicas";
import EditorSeries from "./EditorSeries";
import EditorPremios from "./EditorPremios";
import RevisaoCriacao from "./RevisaoCriacao";

interface Props {
  open: boolean;
  onClose: () => void;
  brandId: string;
  branchId: string;
}

function gerarValoresIniciais(template: TemplateKey): FormCriarTemporadaInput {
  const t = obterTemplatePorChave(template);
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth() + 1;
  const datas = gerarDatasSugeridas(ano, mes);
  return {
    name: nomeAutomaticoTemporada(ano, mes),
    year: ano,
    month: mes,
    classificationStartsAt: paraInputDate(datas.classificationStartsAt),
    classificationEndsAt: paraInputDate(datas.classificationEndsAt),
    knockoutStartsAt: paraInputDate(datas.knockoutStartsAt),
    knockoutEndsAt: paraInputDate(datas.knockoutEndsAt),
    series: t.series.map((s) => ({ ...s })),
    prizesPerTier: t.series.map((s) => ({
      tier_name: s.name,
      prizes: POSICOES_PREMIAVEIS.map((p) => ({
        position: p,
        points: t.prizes.find((x) => x.position === p)?.points ?? 0,
      })),
    })),
  };
}

export default function FormCriarTemporada({
  open,
  onClose,
  brandId,
  branchId,
}: Props) {
  const [template, setTemplate] = useState<TemplateKey>("padrao");
  const valoresIniciais = useMemo(() => gerarValoresIniciais(template), [template]);
  const form = useForm<FormCriarTemporadaInput>({
    resolver: zodResolver(schemaCriarTemporada) as any,
    defaultValues: valoresIniciais,
    values: valoresIniciais,
    mode: "onBlur",
  });

  const { mutate, isPending } = useCriarTemporadaCompleta();

  // Bloqueia o submit quando o início do mata-mata é anterior/igual ao fim
  // da classificação — feedback imediato sem precisar tentar criar.
  const classEndWatch = form.watch("classificationEndsAt");
  const knockStartWatch = form.watch("knockoutStartsAt");
  const conflitoFases =
    !!classEndWatch &&
    !!knockStartWatch &&
    new Date(knockStartWatch) <= new Date(classEndWatch);

  function aoSubmeter(values: FormCriarTemporadaInput) {
    const prizesObj = values.prizesPerTier.reduce<
      Record<string, { position: any; points: number }[]>
    >((acc, t) => {
      acc[t.tier_name] = t.prizes.map((p) => ({
        position: p.position as any,
        points: p.points,
      }));
      return acc;
    }, {});
    mutate(
      {
        brandId,
        branchId,
        name: values.name,
        year: values.year,
        month: values.month,
        classificationStartsAt: deInputDate(values.classificationStartsAt),
        classificationEndsAt: deInputDate(values.classificationEndsAt, true),
        knockoutStartsAt: deInputDate(values.knockoutStartsAt),
        knockoutEndsAt: deInputDate(values.knockoutEndsAt, true),
        series: values.series.map((s) => ({
          name: s.name.trim(),
          size: s.size,
          promote_count: s.promote_count,
          relegate_count: s.relegate_count,
        })),
        prizesPerTier: prizesObj,
      },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Temporada</DialogTitle>
          <DialogDescription>
            Escolha um template para acelerar o processo. Você pode editar
            qualquer campo antes de criar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Template inicial
            </p>
            <SeletorTemplate valor={template} aoMudar={setTemplate} />
          </div>

          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(aoSubmeter)} className="space-y-4">
              <Accordion
                type="multiple"
                defaultValue={["basicas", "series", "premios", "revisao"]}
                className="w-full"
              >
                <AccordionItem value="basicas">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <Settings className="h-4 w-4" /> 1. Informações básicas
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <EditorInformacoesBasicas />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="series">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> 2. Séries
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <EditorSeries />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="premios">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <Trophy className="h-4 w-4" /> 3. Prêmios
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <EditorPremios />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="revisao">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <ListChecks className="h-4 w-4" /> 4. Revisão
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <RevisaoCriacao />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                <Button type="submit" disabled={isPending || conflitoFases}>
                  {isPending && (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  )}
                  Criar temporada
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}
