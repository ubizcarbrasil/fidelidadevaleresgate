import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { toast } from "sonner";
import { Blocks } from "lucide-react";

export default function BrandModulesPage() {
  const qc = useQueryClient();
  const { currentBrandId, isRootAdmin } = useBrandGuard();
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  const brandId = isRootAdmin ? selectedBrandId : currentBrandId;

  // ROOT needs a brand picker
  const { data: allBrands } = useQuery({
    queryKey: ["brands-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brands").select("id, name").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
    enabled: isRootAdmin,
  });

  const { data: definitions, isLoading: loadingDefs } = useQuery({
    queryKey: ["module-definitions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("module_definitions").select("*").eq("is_active", true).order("category, name");
      if (error) throw error;
      return data;
    },
  });

  const { data: brandModules, isLoading: loadingBM } = useQuery({
    queryKey: ["brand-modules", brandId],
    queryFn: async () => {
      const { data, error } = await supabase.from("brand_modules").select("*").eq("brand_id", brandId!);
      if (error) throw error;
      return data;
    },
    enabled: !!brandId,
  });

  const toggle = useMutation({
    mutationFn: async ({ defId, enabled }: { defId: string; enabled: boolean }) => {
      const existing = brandModules?.find(bm => bm.module_definition_id === defId);
      if (existing) {
        const { error } = await supabase.from("brand_modules").update({ is_enabled: enabled }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("brand_modules").insert({
          brand_id: brandId!,
          module_definition_id: defId,
          is_enabled: enabled,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand-modules", brandId] });
      toast.success("Módulo atualizado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isLoading = loadingDefs || loadingBM;

  const isEnabled = (defId: string) => {
    const bm = brandModules?.find(m => m.module_definition_id === defId);
    return bm ? bm.is_enabled : false;
  };

  const grouped = definitions?.reduce((acc, d) => {
    if (!acc[d.category]) acc[d.category] = [];
    acc[d.category].push(d);
    return acc;
  }, {} as Record<string, typeof definitions>) || {};

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><h2 className="text-2xl font-bold tracking-tight">Módulos da Marca</h2></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Módulos da Marca</h2>
        <p className="text-muted-foreground">Ative ou desative funcionalidades para esta marca</p>
      </div>

      {isRootAdmin && (
        <div className="max-w-xs">
          <Select value={selectedBrandId || ""} onValueChange={setSelectedBrandId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma marca" />
            </SelectTrigger>
            <SelectContent>
              {allBrands?.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {!brandId && (
        <p className="text-muted-foreground text-sm">Selecione uma marca para gerenciar seus módulos.</p>
      )}

      {brandId && Object.entries(grouped).map(([category, mods]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{category}</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mods!.map(def => (
              <Card key={def.id} className={isEnabled(def.id) ? "border-primary/30" : "opacity-60"}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Blocks className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">{def.name}</CardTitle>
                    </div>
                    <Switch
                      checked={isEnabled(def.id)}
                      onCheckedChange={v => toggle.mutate({ defId: def.id, enabled: v })}
                      disabled={def.is_core}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs">{def.description || "Sem descrição"}</CardDescription>
                  <div className="mt-2 flex gap-2">
                    {def.is_core && <Badge variant="secondary" className="text-xs">Core</Badge>}
                    <Badge variant="outline" className="text-xs">{def.key}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
