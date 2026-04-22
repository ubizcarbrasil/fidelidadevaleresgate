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

export default function EditorInformacoesBasicas() {
  const form = useFormContext<FormCriarTemporadaInput>();
  const errors = form.formState.errors;
  const anoAtual = new Date().getFullYear();
  const anos = [anoAtual - 1, anoAtual, anoAtual + 1];

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="nome-temporada">Nome da temporada</Label>
        <Input id="nome-temporada" {...form.register("name")} />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Mês</Label>
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
          <Label>Ano</Label>
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
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Fase 1 — Classificação
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Início</Label>
            <Input type="date" {...form.register("classificationStartsAt")} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Fim</Label>
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
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Início</Label>
            <Input type="date" {...form.register("knockoutStartsAt")} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Fim</Label>
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
