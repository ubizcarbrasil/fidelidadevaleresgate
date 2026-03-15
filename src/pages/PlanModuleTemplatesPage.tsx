import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, Crown, Rocket, Zap, RefreshCw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const PLANS = [
  { key: "free", label: "Free", icon: Zap, color: "text-muted-foreground" },
  { key: "starter", label: "Starter", icon: Rocket, color: "text-primary" },
  { key: "profissional", label: "Profissional", icon: Crown, color: "text-amber-500" },
] as const;

type PlanKey = (typeof PLANS)[number]["key"];

export default function PlanModuleTemplatesPage() {
  const qc = useQueryClient();

  const { data: modules, isLoading: loadingModules } = useQuery({
    queryKey: ["module-definitions-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("module_definitions")
        .select("id, key, name, is_active, is_core")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: templates, isLoading: loadingTemplates } = useQuery({
    queryKey: ["plan-module-templates"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("plan_module_templates")
        .select("*");
      if (error) throw error;
      return data as { id: string; plan_key: string; module_definition_id: string; is_enabled: boolean }[];
    },
  });

  // Count brands per plan for the retroactive apply section
  const { data: brandCounts } = useQuery({
    queryKey: ["brand-counts-by-plan"],
    queryFn: async () => {
      const counts: Record<PlanKey, number> = { free: 0, starter: 0, profissional: 0 };
      for (const plan of PLANS) {
        const { count, error } = await supabase
          .from("brands")
          .select("id", { count: "exact", head: true })
          .eq("subscription_plan", plan.key);
        if (!error && count !== null) counts[plan.key] = count;
      }
      return counts;
    },
  });

  const [matrix, setMatrix] = useState<Record<string, Record<PlanKey, boolean>>>({});

  useEffect(() => {
    if (!modules || !templates) return;
    const m: Record<string, Record<PlanKey, boolean>> = {};
    for (const mod of modules) {
      m[mod.id] = { free: false, starter: false, profissional: false };
      if (mod.is_core) {
        m[mod.id] = { free: true, starter: true, profissional: true };
      }
    }
    for (const t of templates) {
      const plan = t.plan_key as PlanKey;
      if (m[t.module_definition_id] && PLANS.some((p) => p.key === plan)) {
        m[t.module_definition_id][plan] = t.is_enabled;
      }
    }
    setMatrix(m);
  }, [modules, templates]);

  const toggle = (modId: string, plan: PlanKey) => {
    const mod = modules?.find((m) => m.id === modId);
    if (mod?.is_core) return;
    setMatrix((prev) => ({
      ...prev,
      [modId]: { ...prev[modId], [plan]: !prev[modId]?.[plan] },
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const sb = supabase as any;
      await sb.from("plan_module_templates").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const rows: { plan_key: string; module_definition_id: string; is_enabled: boolean }[] = [];
      for (const [modId, plans] of Object.entries(matrix)) {
        for (const plan of PLANS) {
          rows.push({
            plan_key: plan.key,
            module_definition_id: modId,
            is_enabled: plans[plan.key] ?? false,
          });
        }
      }
      const { error } = await sb.from("plan_module_templates").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plan-module-templates"] });
      toast({ title: "Perfil de planos salvo com sucesso!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    },
  });

  const [applyingPlan, setApplyingPlan] = useState<PlanKey | null>(null);

  const applyMutation = useMutation({
    mutationFn: async (planKey: PlanKey) => {
      setApplyingPlan(planKey);
      const { data, error } = await supabase.functions.invoke("apply-plan-template", {
        body: { plan_key: planKey },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { updated: number; total: number };
    },
    onSuccess: (data) => {
      toast({ title: `${data.updated} marca(s) atualizada(s) com sucesso!` });
      setApplyingPlan(null);
    },
    onError: (err: any) => {
      toast({ title: "Erro ao aplicar", description: err.message, variant: "destructive" });
      setApplyingPlan(null);
    },
  });

  const isLoading = loadingModules || loadingTemplates;

  return (
    <div className="space-y-6">
      <PageHeader title="Perfil de Planos" description="Configure quais módulos estão disponíveis em cada plano de assinatura" />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Módulo</th>
                    {PLANS.map((plan) => (
                      <th key={plan.key} className="text-center p-3 font-medium w-32">
                        <div className="flex items-center justify-center gap-1.5">
                          <plan.icon className={`h-4 w-4 ${plan.color}`} />
                          <span>{plan.label}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modules?.map((mod) => {
                    const isCore = mod.is_core;
                    return (
                      <tr key={mod.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span>{mod.name}</span>
                            {isCore && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                core
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{mod.key}</span>
                        </td>
                        {PLANS.map((plan) => (
                          <td key={plan.key} className="text-center p-3">
                            <Checkbox
                              checked={matrix[mod.id]?.[plan.key] ?? false}
                              onCheckedChange={() => toggle(mod.id, plan.key)}
                              disabled={isCore}
                              className="mx-auto"
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || isLoading}>
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Configuração
        </Button>
      </div>

      {/* Retroactive Apply Section */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-sm">Aplicar Retroativamente</h3>
            <p className="text-xs text-muted-foreground">
              Substitui os módulos de todas as marcas de um plano pelo template atual configurado acima.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PLANS.map((plan) => {
              const count = brandCounts?.[plan.key] ?? 0;
              const isApplying = applyingPlan === plan.key && applyMutation.isPending;
              return (
                <AlertDialog key={plan.key}>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isApplying || count === 0}>
                      {isApplying ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-1.5" />
                      )}
                      <plan.icon className={`h-3.5 w-3.5 mr-1 ${plan.color}`} />
                      {plan.label}
                      <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                        {count}
                      </Badge>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Aplicar template "{plan.label}" retroativamente?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Isso irá substituir os módulos de <strong>{count} marca(s)</strong> pelo template
                        atual do plano <strong>{plan.label}</strong>. Módulos core permanecerão sempre ativos.
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => applyMutation.mutate(plan.key)}>
                        Confirmar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
