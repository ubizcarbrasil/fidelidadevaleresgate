import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NOMES_MESES } from "../../constants/constantes_campeonato";
import type { FormCriarTemporadaInput } from "../../schemas/schema_criar_temporada";
import LabelComAjuda from "./LabelComAjuda";

export default function EditorInformacoesBasicas() {
  const form = useFormContext<FormCriarTemporadaInput>();
  const errors = form.formState.errors;
  const anoAtual = new Date().getFullYear();
  const anos = [anoAtual - 1, anoAtual, anoAtual + 1];

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
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <LabelComAjuda ajuda="Data em que começa a contagem de pontos da fase de classificação.">
              Início
            </LabelComAjuda>
            <Input type="date" {...form.register("classificationStartsAt")} />
          </div>
          <div className="space-y-1">
            <LabelComAjuda ajuda="Último dia válido para acumular pontos. Após essa data o ranking da série é congelado e o mata-mata começa.">
              Fim
            </LabelComAjuda>
            <Input type="date" {...form.register("classificationEndsAt")} />
          </div>
        </div>
        {errors.classificationStartsAt && (
          <p className="text-xs text-destructive">
            {errors.classificationStartsAt.message as string}
          </p>
        )}
      </div>

      <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Fase 2 — Mata-mata
        </p>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Confrontos eliminatórios entre os classificados de cada série. Precisa
          começar depois do fim da Fase 1.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <LabelComAjuda ajuda="Início dos confrontos eliminatórios. Deve ser após o fim da fase de classificação.">
              Início
            </LabelComAjuda>
            <Input type="date" {...form.register("knockoutStartsAt")} />
          </div>
          <div className="space-y-1">
            <LabelComAjuda ajuda="Data limite para concluir o mata-mata e encerrar a temporada. Os prêmios são distribuídos automaticamente após essa data.">
              Fim
            </LabelComAjuda>
            <Input type="date" {...form.register("knockoutEndsAt")} />
          </div>
        </div>
        {errors.knockoutStartsAt && (
          <p className="text-xs text-destructive">
            {errors.knockoutStartsAt.message as string}
          </p>
        )}
      </div>
    </div>
  );
}
