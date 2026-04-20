import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, AlertTriangle, CheckCircle2, ExternalLink, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { ProdutoComercialDraft } from "../types/tipos_produto";
import { useModulosPorModelo } from "../hooks/hook_modulos_por_modelo";

interface Props {
  draft: ProdutoComercialDraft;
  onChange: (patch: Partial<ProdutoComercialDraft>) => void;
  templateName?: string;
}

export default function PassoModelos({ draft, onChange, templateName }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["bm-list-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_models")
        .select("id, key, name, audience, description")
        .eq("is_active", true)
        .order("audience")
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Conta módulos vinculados de TODOS os modelos ativos (para badge por card)
  const allIds = (data ?? []).map((m) => m.id);
  const { data: vinculos } = useModulosPorModelo(allIds);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const toggle = (id: string, checked: boolean) => {
    const set = new Set(draft.business_model_ids);
    if (checked) set.add(id);
    else set.delete(id);
    onChange({ business_model_ids: Array.from(set) });
  };

  const groups = (data ?? []).reduce<Record<string, typeof data>>((acc, m) => {
    const key = m.audience || "outros";
    if (!acc[key]) acc[key] = [] as any;
    (acc[key] as any).push(m);
    return acc;
  }, {} as any);

  const audienceLabel = (a: string) => {
    if (a === "DRIVER" || a === "motorista") return "Motorista";
    if (a === "PASSENGER" || a === "CUSTOMER" || a === "cliente") return "Cliente";
    if (a === "B2B" || a === "b2b") return "B2B";
    return a;
  };

  const countFor = (id: string) => vinculos?.countByModel.get(id) ?? 0;

  // Resumo da seleção atual
  const selecionados = draft.business_model_ids;
  const semModulos = selecionados.filter((id) => countFor(id) === 0);
  const comModulos = selecionados.filter((id) => countFor(id) > 0);
  const nomeModelo = (id: string) =>
    (data ?? []).find((m) => m.id === id)?.name ?? "Modelo";

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Selecione quais Modelos de Negócio serão liberados automaticamente para empreendedores que contratarem este produto.
      </p>

      {templateName && draft.business_model_ids.length === 0 && (
        <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
          <p className="font-medium text-primary flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Sugestão para "{templateName}"
          </p>
          <p className="text-foreground/80 mt-1 text-xs">
            Marque os modelos voltados para o público-alvo deste produto. Prefira
            os que mostram a etiqueta verde <strong>"Pronto"</strong> — esses já
            têm funcionalidades configuradas e vão preencher o passo 3.
          </p>
        </div>
      )}

      {selecionados.length === 0 && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-foreground/80">
            Selecione ao menos <strong>1 modelo</strong> para conseguir avançar ao passo 3.
          </p>
        </div>
      )}

      {selecionados.length > 0 && semModulos.length > 0 && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-xs space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-foreground">
                {comModulos.length === 0
                  ? `Nenhum dos ${selecionados.length} modelos selecionados tem funcionalidades configuradas`
                  : `${semModulos.length} de ${selecionados.length} modelos selecionados estão sem funcionalidades`}
              </p>
              <p className="text-muted-foreground mt-0.5">
                Sem módulos: <strong>{semModulos.map(nomeModelo).join(", ")}</strong>.
                Configure os vínculos na Central de Módulos ou desmarque-os.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="gap-1 h-7 text-xs">
            <Link to="/admin/central-modulos" target="_blank" rel="noopener">
              <Settings2 className="h-3 w-3" />
              Abrir Central de Módulos
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      )}

      {Object.entries(groups).map(([audience, models]) => (
        <div key={audience} className="space-y-2">
          <Badge variant="secondary" className="uppercase text-[10px]">
            {audienceLabel(audience)}
          </Badge>
          <div className="grid sm:grid-cols-2 gap-2">
            {(models as any[]).map((m) => {
              const count = countFor(m.id);
              const ready = count > 0;
              return (
                <label
                  key={m.id}
                  className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <Checkbox
                    checked={draft.business_model_ids.includes(m.id)}
                    onCheckedChange={(v) => toggle(m.id, !!v)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <Label className="cursor-pointer font-medium">{m.name}</Label>
                      {ready ? (
                        <Badge
                          variant="outline"
                          className="text-[9px] gap-0.5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shrink-0"
                        >
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Pronto · {count}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[9px] gap-0.5 border-destructive/40 text-destructive shrink-0"
                        >
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Sem módulos
                        </Badge>
                      )}
                    </div>
                    {m.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{m.description}</p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
