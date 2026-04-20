import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, AlertTriangle, ChevronLeft, ExternalLink, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { ProdutoComercialDraft } from "../types/tipos_produto";
import { useModulosPorModelo } from "../hooks/hook_modulos_por_modelo";

interface Props {
  draft: ProdutoComercialDraft;
  onChange: (patch: Partial<ProdutoComercialDraft>) => void;
  onVoltarPasso?: () => void;
}

export default function PassoModulos({ draft, onChange, onVoltarPasso }: Props) {
  const { data: modelosInfo } = useQuery({
    queryKey: ["pc-modelos-nomes", draft.business_model_ids],
    enabled: draft.business_model_ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_models")
        .select("id, name, audience")
        .in("id", draft.business_model_ids);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data, isLoading } = useModulosPorModelo(draft.business_model_ids);

  const requiredIds = useMemo(() => {
    const set = new Set<string>();
    (data?.links ?? []).forEach((l) => {
      if (l.is_required) set.add(l.module_definition_id);
    });
    (data?.modules ?? []).forEach((m) => {
      if (m.is_core) set.add(m.id);
    });
    return set;
  }, [data]);

  // Pré-marca obrigatórios automaticamente
  useEffect(() => {
    if (!data) return;
    const merged = new Set(draft.module_definition_ids);
    let changed = false;
    requiredIds.forEach((id) => {
      if (!merged.has(id)) {
        merged.add(id);
        changed = true;
      }
    });
    if (changed) onChange({ module_definition_ids: Array.from(merged) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Estado vazio: nenhum modelo selecionado no passo 2
  if (draft.business_model_ids.length === 0) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-foreground">
            Volte ao passo 2 e selecione ao menos um Modelo de Negócio
          </p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            As funcionalidades obrigatórias e opcionais aparecem aqui assim que
            você escolher os modelos de negócio que este produto vai liberar.
          </p>
        </div>
        {onVoltarPasso && (
          <Button variant="outline" size="sm" onClick={onVoltarPasso} className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            Voltar ao passo 2
          </Button>
        )}
      </div>
    );
  }

  const toggle = (id: string, checked: boolean) => {
    if (requiredIds.has(id)) return;
    const set = new Set(draft.module_definition_ids);
    if (checked) set.add(id);
    else set.delete(id);
    onChange({ module_definition_ids: Array.from(set) });
  };

  // Filtra apenas módulos que estão vinculados aos modelos escolhidos
  const linkedModuleIds = new Set((data?.links ?? []).map((l) => l.module_definition_id));
  const moduleList = (data?.modules ?? []).filter(
    (m) => linkedModuleIds.has(m.id) || m.is_core,
  );

  const required = moduleList.filter((m) => requiredIds.has(m.id));
  const optional = moduleList.filter((m) => !requiredIds.has(m.id));

  const semModulos = required.length === 0 && optional.length === 0;

  // Detalhamento por modelo (quantos módulos cada um tem vinculado)
  const breakdown = (modelosInfo ?? []).map((m: any) => ({
    id: m.id,
    name: m.name,
    audience: m.audience,
    count: data?.countByModel.get(m.id) ?? 0,
  }));

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Funcionalidades obrigatórias dos modelos selecionados são pré-marcadas. Você pode adicionar opcionais.
      </p>

      {semModulos && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-foreground">
                Os modelos selecionados não têm módulos configurados
              </p>
              <p className="text-sm text-muted-foreground">
                Cada modelo abaixo precisa ter funcionalidades vinculadas na{" "}
                <strong>Central de Módulos</strong>. Sem isso, o produto fica sem
                funcionalidades para liberar.
              </p>
            </div>
          </div>

          <div className="rounded-md border bg-background/50 divide-y">
            {breakdown.map((b) => (
              <div key={b.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate font-medium">{b.name}</span>
                  <Badge variant="outline" className="text-[10px] uppercase shrink-0">
                    {b.audience}
                  </Badge>
                </div>
                <Badge
                  variant={b.count === 0 ? "destructive" : "secondary"}
                  className="text-[10px] shrink-0"
                >
                  {b.count} {b.count === 1 ? "módulo" : "módulos"}
                </Badge>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild size="sm" variant="default" className="gap-1">
              <Link to="/admin/central-modulos" target="_blank" rel="noopener">
                <Settings2 className="h-3.5 w-3.5" />
                Abrir Central de Módulos
                <ExternalLink className="h-3 w-3" />
              </Link>
            </Button>
            {onVoltarPasso && (
              <Button variant="outline" size="sm" onClick={onVoltarPasso} className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Escolher outros modelos
              </Button>
            )}
          </div>
        </div>
      )}

      {required.length > 0 && (
        <div className="space-y-2">
          <Badge className="uppercase text-[10px] gap-1">
            <Lock className="h-3 w-3" /> Obrigatórias ({required.length})
          </Badge>
          <div className="grid sm:grid-cols-2 gap-2">
            {required.map((m) => (
              <div
                key={m.id}
                className="flex items-start gap-3 rounded-md border border-primary/30 bg-primary/5 p-3 opacity-90"
              >
                <Checkbox checked disabled className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <Label className="font-medium">{m.name}</Label>
                  {m.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{m.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {optional.length > 0 && (
        <div className="space-y-2">
          <Badge variant="secondary" className="uppercase text-[10px]">
            Opcionais ({optional.length})
          </Badge>
          <div className="grid sm:grid-cols-2 gap-2">
            {optional.map((m) => (
              <label
                key={m.id}
                className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <Checkbox
                  checked={draft.module_definition_ids.includes(m.id)}
                  onCheckedChange={(v) => toggle(m.id, !!v)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <Label className="cursor-pointer font-medium">{m.name}</Label>
                  {m.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{m.description}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
