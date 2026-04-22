import { useFieldArray, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import type { FormCriarTemporadaInput } from "../../schemas/schema_criar_temporada";

export default function EditorSeries() {
  const form = useFormContext<FormCriarTemporadaInput>();
  const errors = form.formState.errors;
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "series",
  });

  function adicionarSerie() {
    if (fields.length >= 8) return;
    append({ name: "", size: 16, promote_count: 3, relegate_count: 3 });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        As séries definem a hierarquia da temporada (ex: A, B, C). A primeira
        série é a mais alta (não tem promoção); a última não tem rebaixamento.
      </p>

      <div className="space-y-2">
        {fields.map((field, idx) => (
          <div
            key={field.id}
            className="rounded-md border border-border bg-muted/20 p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <Badge variant="outline">Série {idx + 1}</Badge>
              {fields.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(idx)}
                  className="h-7 px-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs">Nome</Label>
                <Input
                  {...form.register(`series.${idx}.name`)}
                  placeholder="A"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tamanho</Label>
                <Input
                  type="number"
                  min={2}
                  max={64}
                  {...form.register(`series.${idx}.size`)}
                />
              </div>
              <div className="space-y-1">
                <Label className="flex items-center gap-1 text-xs">
                  <ArrowUpCircle className="h-3 w-3 text-emerald-500" /> Sobem
                </Label>
                <Input
                  type="number"
                  min={0}
                  {...form.register(`series.${idx}.promote_count`)}
                />
              </div>
              <div className="space-y-1">
                <Label className="flex items-center gap-1 text-xs">
                  <ArrowDownCircle className="h-3 w-3 text-destructive" /> Descem
                </Label>
                <Input
                  type="number"
                  min={0}
                  {...form.register(`series.${idx}.relegate_count`)}
                />
              </div>
            </div>
            {errors.series?.[idx] && (
              <div className="mt-1 text-xs text-destructive">
                {Object.values(errors.series[idx] ?? {})
                  .map((e: any) => e?.message)
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            )}
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={adicionarSerie}
        disabled={fields.length >= 8}
      >
        <Plus className="mr-2 h-3.5 w-3.5" /> Adicionar série
      </Button>

      {errors.series && typeof errors.series.message === "string" && (
        <p className="text-xs text-destructive">{errors.series.message}</p>
      )}
    </div>
  );
}
