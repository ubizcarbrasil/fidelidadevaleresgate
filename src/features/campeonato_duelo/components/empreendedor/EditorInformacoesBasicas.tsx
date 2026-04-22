import { useEffect, useMemo, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, AlertTriangle, Info, Trophy, Swords } from "lucide-react";
import { NOMES_MESES } from "../../constants/constantes_campeonato";
import type { FormCriarTemporadaInput } from "../../schemas/schema_criar_temporada";
import {
  calcularDuracaoMinimaClassificacao,
  calcularFimMinimoClassificacao,
  compararInputDate,
  diferencaEmDiasInclusiva,
  somarDiasInputDate,
} from "../../utils/utilitarios_campeonato";
import LabelComAjuda from "./LabelComAjuda";

interface Props {
  brandId?: string;
  branchId?: string;
}

export default function EditorInformacoesBasicas({ brandId, branchId }: Props = {}) {
  const form = useFormContext<FormCriarTemporadaInput>();
  const errors = form.formState.errors;
  const anoAtual = new Date().getFullYear();
  const anos = [anoAtual - 1, anoAtual, anoAtual + 1];

  const mesAtual = form.watch("month");
  const anoSelecionado = form.watch("year");

  // Checagem prévia: já existe temporada para (brand, branch, year, month)?
  const { data: temporadaExistente } = useQuery({
    queryKey: [
      "check-season-conflict",
      brandId,
      branchId,
      anoSelecionado,
      mesAtual,
    ],
    enabled: !!brandId && !!branchId && !!anoSelecionado && !!mesAtual,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("duelo_seasons")
        .select("id, name, phase, paused_at, cancelled_at")
        .eq("brand_id", brandId!)
        .eq("branch_id", branchId!)
        .eq("year", anoSelecionado as number)
        .eq("month", mesAtual as number)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 10_000,
  });
  const temConflitoMesAno = !!temporadaExistente;

  // Datas atuais para encadear limites e validar conflitos reativos.
  const classStart = form.watch("classificationStartsAt") ?? "";
  const classEnd = form.watch("classificationEndsAt") ?? "";
  const knockStart = form.watch("knockoutStartsAt") ?? "";
  const knockEnd = form.watch("knockoutEndsAt") ?? "";
  const series = form.watch("series") ?? [];
  const scoringMode = form.watch("scoringMode");

  // Duração mínima da classificação calculada a partir das séries e do modo.
  const duracaoMinima = useMemo(
    () => calcularDuracaoMinimaClassificacao(series, scoringMode),
    [series, scoringMode],
  );
  const maiorSerie = useMemo(() => {
    const tams = (series ?? [])
      .map((s: any) => Number(s?.size) || 0)
      .filter((n: number) => n > 0);
    return tams.length ? Math.max(...tams) : 0;
  }, [series]);

  const conflitoClassificacao =
    !!classStart && !!classEnd && compararInputDate(classEnd, classStart) <= 0;
  const conflitoFases =
    !!classEnd && !!knockStart && compararInputDate(knockStart, classEnd) <= 0;
  const conflitoMataMata =
    !!knockStart && !!knockEnd && compararInputDate(knockEnd, knockStart) <= 0;

  // Limites mínimos encadeados (YYYY-MM-DD) para os inputs nativos.
  // Fim da Classificação: respeita início + (duração mínima - 1).
  const minClassEnd = classStart
    ? calcularFimMinimoClassificacao(classStart, duracaoMinima)
    : undefined;
  const minKnockStart = classEnd ? somarDiasInputDate(classEnd, 1) : undefined;
  const minKnockEnd = knockStart ? somarDiasInputDate(knockStart, 1) : undefined;

  const duracaoAtual = diferencaEmDiasInclusiva(classStart, classEnd);
  const duracaoSuficiente =
    !classStart || !classEnd || duracaoAtual >= duracaoMinima;

  /**
   * Ao alterar uma data "âncora", empurra a próxima dependente para manter a
   * sequência válida. Evita estados quebrados em que o usuário corrige um campo
   * mas outro continua inválido silenciosamente.
   */
  function aoMudarClassEnd(valor: string) {
    form.setValue("classificationEndsAt", valor, { shouldValidate: true });
    if (valor && knockStart && compararInputDate(knockStart, valor) <= 0) {
      const novoKnockStart = somarDiasInputDate(valor, 1);
      form.setValue("knockoutStartsAt", novoKnockStart, { shouldValidate: true });
      if (knockEnd && compararInputDate(knockEnd, novoKnockStart) <= 0) {
        form.setValue("knockoutEndsAt", somarDiasInputDate(novoKnockStart, 1), {
          shouldValidate: true,
        });
      }
    }
  }

  function aoMudarKnockStart(valor: string) {
    form.setValue("knockoutStartsAt", valor, { shouldValidate: true });
    if (valor && knockEnd && compararInputDate(knockEnd, valor) <= 0) {
      form.setValue("knockoutEndsAt", somarDiasInputDate(valor, 1), {
        shouldValidate: true,
      });
    }
  }

  function aoMudarClassStart(valor: string) {
    form.setValue("classificationStartsAt", valor, { shouldValidate: true });
    if (valor && classEnd && compararInputDate(classEnd, valor) <= 0) {
      const novoClassEnd = somarDiasInputDate(valor, 1);
      form.setValue("classificationEndsAt", novoClassEnd, { shouldValidate: true });
      // propaga para frente
      aoMudarClassEnd(novoClassEnd);
    }
  }

  /**
   * Propaga automaticamente a duração mínima da Classificação para frente
   * quando o usuário altera o tamanho de uma série, o modo de pontuação ou
   * o início da Classificação. Nunca encurta uma janela já maior que a mínima.
   */
  const ultimaPropagacaoRef = useRef<string>("");
  useEffect(() => {
    if (!classStart) return;
    const fimMinimo = calcularFimMinimoClassificacao(classStart, duracaoMinima);
    if (!fimMinimo) return;
    // chave para evitar loops quando o estado já está coerente
    const chave = `${classStart}|${duracaoMinima}|${classEnd}|${knockStart}|${knockEnd}`;
    if (ultimaPropagacaoRef.current === chave) return;

    let novoClassEnd = classEnd;
    if (!classEnd || compararInputDate(classEnd, fimMinimo) < 0) {
      novoClassEnd = fimMinimo;
      form.setValue("classificationEndsAt", novoClassEnd, { shouldValidate: true });
    }

    if (novoClassEnd) {
      const minKS = somarDiasInputDate(novoClassEnd, 1);
      let novoKnockStart = knockStart;
      if (!knockStart || compararInputDate(knockStart, minKS) < 0) {
        novoKnockStart = minKS;
        form.setValue("knockoutStartsAt", novoKnockStart, { shouldValidate: true });
      }
      if (novoKnockStart) {
        const minKE = somarDiasInputDate(novoKnockStart, 1);
        if (!knockEnd || compararInputDate(knockEnd, minKE) < 0) {
          form.setValue("knockoutEndsAt", minKE, { shouldValidate: true });
        }
      }
    }

    ultimaPropagacaoRef.current = chave;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classStart, duracaoMinima, maiorSerie]);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <LabelComAjuda
          htmlFor="nome-temporada"
          ajuda="Nome de exibição da temporada (ex: 'Brasileirão Janeiro/2026'). Aparece para os motoristas e nos rankings."
        >
          Nome da temporada
        </LabelComAjuda>
        <Input id="nome-temporada" {...form.register("name")} />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <LabelComAjuda ajuda="Mês de referência da temporada. Cada cidade só pode ter uma temporada ativa por mês.">
            Mês
          </LabelComAjuda>
          <Select
            value={String(form.watch("month"))}
            onValueChange={(v) => form.setValue("month", Number(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NOMES_MESES.map((nome, idx) => (
                <SelectItem key={idx} value={String(idx + 1)}>
                  {nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <LabelComAjuda ajuda="Ano de referência da temporada.">Ano</LabelComAjuda>
          <Select
            value={String(form.watch("year"))}
            onValueChange={(v) => form.setValue("year", Number(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anos.map((a) => (
                <SelectItem key={a} value={String(a)}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {temConflitoMesAno && temporadaExistente && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-1">
            <p>
              Já existe a temporada{" "}
              <strong>"{temporadaExistente.name}"</strong> ({temporadaExistente.status}){" "}
              em <strong>{NOMES_MESES[(mesAtual ?? 1) - 1]}/{anoSelecionado}</strong>{" "}
              nesta cidade.
            </p>
            <p className="text-[11px] opacity-80">
              Para criar uma nova, escolha outro mês ou remova a existente em
              "Temporadas Anteriores".
            </p>
          </div>
        </div>
      )}

      <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Fase 1 — Classificação
          </p>
        </div>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Período de pontos corridos. Os motoristas acumulam pontos pelas
          corridas concluídas para definir a colocação inicial em cada série.
        </p>
        {maiorSerie > 0 && (
          <div
            className={`flex items-start gap-1.5 rounded-sm p-2 text-[11px] leading-snug ${
              duracaoSuficiente
                ? "bg-primary/10 text-foreground/80"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              {scoringMode === "daily_matchup" ? (
                <>
                  Esta temporada precisa de no mínimo{" "}
                  <strong>{duracaoMinima} dias</strong> de classificação para que
                  todos os <strong>{maiorSerie} motoristas</strong> da maior
                  série se enfrentem (Confronto diário).
                </>
              ) : (
                <>
                  Recomenda-se no mínimo{" "}
                  <strong>{duracaoMinima} dias</strong> de classificação para
                  uma corrida por pontos justa com{" "}
                  <strong>{maiorSerie} motoristas</strong> na maior série.
                </>
              )}
              {classStart && classEnd && (
                <>
                  {" "}
                  Janela atual: <strong>{duracaoAtual} dias</strong>.
                </>
              )}
            </span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <LabelComAjuda ajuda="Data em que começa a contagem de pontos da fase de classificação.">
              Início
            </LabelComAjuda>
            <Input
              type="date"
              value={classStart}
              onChange={(e) => aoMudarClassStart(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <LabelComAjuda ajuda="Último dia válido para acumular pontos. Após essa data o ranking da série é congelado e o mata-mata começa.">
              Fim
            </LabelComAjuda>
            <Input
              type="date"
              min={minClassEnd}
              value={classEnd}
              aria-invalid={conflitoClassificacao || undefined}
              className={
                conflitoClassificacao
                  ? "border-destructive focus-visible:ring-destructive"
                  : undefined
              }
              onChange={(e) => aoMudarClassEnd(e.target.value)}
            />
          </div>
        </div>
        {conflitoClassificacao && (
          <div className="flex items-start gap-1.5 rounded-sm bg-destructive/10 p-2 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              O fim da Classificação precisa ser <strong>depois</strong> do
              início.
            </span>
          </div>
        )}
        {errors.classificationStartsAt && (
          <p className="text-xs text-destructive">
            {errors.classificationStartsAt.message as string}
          </p>
        )}
        {errors.classificationEndsAt && (
          <p className="text-xs text-destructive">
            {errors.classificationEndsAt.message as string}
          </p>
        )}
      </div>

      <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Fase 2 — Mata-mata
        </p>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Confrontos eliminatórios entre os classificados de cada série. Precisa
          começar <strong>depois</strong> do fim da Fase 1, e o fim precisa ser
          depois do início.
        </p>
        <div className="flex items-start gap-1.5 rounded-sm bg-primary/10 p-2 text-[11px] leading-snug text-foreground/80">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            O Mata-mata começa automaticamente <strong>após o fim da
            Classificação</strong>. Você pode estender a data final, mas não
            antecipá-la.
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <LabelComAjuda ajuda="Início dos confrontos eliminatórios. Deve ser após o fim da fase de classificação.">
              Início
            </LabelComAjuda>
            <Input
              type="date"
              min={minKnockStart}
              value={knockStart}
              aria-invalid={conflitoFases || undefined}
              className={
                conflitoFases
                  ? "border-destructive focus-visible:ring-destructive"
                  : undefined
              }
              onChange={(e) => aoMudarKnockStart(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <LabelComAjuda ajuda="Data limite para concluir o mata-mata e encerrar a temporada. Os prêmios são distribuídos automaticamente após essa data.">
              Fim
            </LabelComAjuda>
            <Input
              type="date"
              min={minKnockEnd}
              value={knockEnd}
              aria-invalid={conflitoMataMata || undefined}
              className={
                conflitoMataMata
                  ? "border-destructive focus-visible:ring-destructive"
                  : undefined
              }
              onChange={(e) =>
                form.setValue("knockoutEndsAt", e.target.value, {
                  shouldValidate: true,
                })
              }
            />
          </div>
        </div>
        {conflitoFases && (
          <div className="flex items-start gap-1.5 rounded-sm bg-destructive/10 p-2 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              O Mata-mata precisa começar <strong>depois</strong> do fim da
              Classificação.
            </span>
          </div>
        )}
        {conflitoMataMata && (
          <div className="flex items-start gap-1.5 rounded-sm bg-destructive/10 p-2 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              O fim do Mata-mata precisa ser <strong>depois</strong> do início.
            </span>
          </div>
        )}
        {errors.knockoutStartsAt && (
          <p className="text-xs text-destructive">
            {errors.knockoutStartsAt.message as string}
          </p>
        )}
        {errors.knockoutEndsAt && (
          <p className="text-xs text-destructive">
            {errors.knockoutEndsAt.message as string}
          </p>
        )}
      </div>

      <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Modo de pontuação da Classificação
          </p>
          <p className="text-[11px] leading-snug text-muted-foreground mt-1">
            Define como os motoristas acumulam pontos durante a fase de
            classificação. Não pode ser alterado depois.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => form.setValue("scoringMode", "total_points")}
            className={`text-left rounded-md border p-3 transition-colors ${
              scoringMode === "total_points"
                ? "border-primary bg-primary/10"
                : "border-border bg-background hover:border-primary/40"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Pontos corridos</span>
            </div>
            <p className="text-[11px] leading-snug text-muted-foreground">
              +1 ponto por corrida finalizada. Modelo padrão e simples.
            </p>
          </button>

          <button
            type="button"
            onClick={() => form.setValue("scoringMode", "daily_matchup")}
            className={`text-left rounded-md border p-3 transition-colors ${
              scoringMode === "daily_matchup"
                ? "border-primary bg-primary/10"
                : "border-border bg-background hover:border-primary/40"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Swords className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Confronto diário</span>
            </div>
            <p className="text-[11px] leading-snug text-muted-foreground">
              Round-robin diário: todos contra todos da série. Vitória/Empate/Derrota
              configuráveis.
            </p>
          </button>
        </div>

        {scoringMode === "daily_matchup" && (
          <div className="space-y-2 pt-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Pontos por resultado diário
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Vitória</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  {...form.register("scoringConfig.win", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Empate</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  {...form.register("scoringConfig.draw", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Derrota</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  {...form.register("scoringConfig.loss", { valueAsNumber: true })}
                />
              </div>
            </div>
            <p className="text-[11px] leading-snug text-muted-foreground">
              No fim de cada dia, cada motorista da série é comparado com todos os
              demais por número de corridas finalizadas. Ganha quem tiver mais
              corridas; empata se for igual.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
