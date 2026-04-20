import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProdutoComercialDraft } from "../types/tipos_produto";

interface Props {
  draft: ProdutoComercialDraft;
  onChange: (patch: Partial<ProdutoComercialDraft>) => void;
}

export default function PassoModulos({ draft, onChange }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["modules-and-bm-modules", draft.business_model_ids],
    queryFn: async () => {
      const [modsRes, linksRes] = await Promise.all([
        supabase.from("module_definitions").select("id, key, label, description, is_core").eq("is_active", true),
        supabase
          .from("business_model_modules")
          .select("business_model_id, module_definition_id, is_required")
          .in("business_model_id", draft.business_model_ids.length ? draft.business_model_ids : ["00000000-0000-0000-0000-000000000000"]),
      ]);
      return {
        modules: modsRes.data ?? [],
        links: linksRes.data ?? [],
      };
    },
  });

  const requiredIds = useMemo(() => {
    const set = new Set<string>();
    (data?.links ?? []).forEach((l: any) => {
      if (l.is_required) set.add(l.module_definition_id);
    });
    // Core sempre é obrigatório
    (data?.modules ?? []).forEach((m: any) => {
      if (m.is_core) set.add(m.id);
    });
    return set;
  }, [data]);

  // Pré-marca obrigatórios automaticamente quando carregar
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

  const toggle = (id: string, checked: boolean) => {
    if (requiredIds.has(id)) return; // não permite desmarcar obrigatórios
    const set = new Set(draft.module_definition_ids);
    if (checked) set.add(id);
    else set.delete(id);
    onChange({ module_definition_ids: Array.from(set) });
  };

  const required = (data?.modules ?? []).filter((m: any) => requiredIds.has(m.id));
  const optional = (data?.modules ?? []).filter((m: any) => !requiredIds.has(m.id));

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Funcionalidades obrigatórias dos modelos selecionados são pré-marcadas. Você pode adicionar opcionais.
      </p>

      {required.length > 0 && (
        <div className="space-y-2">
          <Badge className="uppercase text-[10px] gap-1">
            <Lock className="h-3 w-3" /> Obrigatórias ({required.length})
          </Badge>
          <div className="grid sm:grid-cols-2 gap-2">
            {required.map((m: any) => (
              <div
                key={m.id}
                className="flex items-start gap-3 rounded-md border border-primary/30 bg-primary/5 p-3 opacity-90"
              >
                <Checkbox checked disabled className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <Label className="font-medium">{m.label}</Label>
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
            {optional.map((m: any) => (
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
                  <Label className="cursor-pointer font-medium">{m.label}</Label>
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
