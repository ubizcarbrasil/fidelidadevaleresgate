import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProdutoComercialDraft } from "../types/tipos_produto";

interface Props {
  draft: ProdutoComercialDraft;
  onChange: (patch: Partial<ProdutoComercialDraft>) => void;
}

export default function PassoModelos({ draft, onChange }: Props) {
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
    if (a === "DRIVER") return "Motorista";
    if (a === "PASSENGER" || a === "CUSTOMER") return "Cliente";
    if (a === "B2B") return "B2B";
    return a;
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Selecione quais Modelos de Negócio serão liberados automaticamente para empreendedores que contratarem este produto.
      </p>
      {Object.entries(groups).map(([audience, models]) => (
        <div key={audience} className="space-y-2">
          <Badge variant="secondary" className="uppercase text-[10px]">
            {audienceLabel(audience)}
          </Badge>
          <div className="grid sm:grid-cols-2 gap-2">
            {(models as any[]).map((m) => (
              <label
                key={m.id}
                className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <Checkbox
                  checked={draft.business_model_ids.includes(m.id)}
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
      ))}
    </div>
  );
}
