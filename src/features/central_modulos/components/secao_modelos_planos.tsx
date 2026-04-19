/**
 * SecaoModelosPlanos — Sub-fase 5.3
 * Matriz Modelos × Planos.
 *  - Linhas: 13 business_models (agrupados por audience)
 *  - Colunas: 4 planos (free, starter, profissional, enterprise)
 *  - Célula: checkbox is_included
 *  - Cabeçalho do plano: nome + bulk Todos/Nenhum + contagem incluídos
 *  - Mobile: scroll horizontal, primeira coluna sticky
 */
import { Fragment, useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Briefcase } from "lucide-react";
import {
  useBusinessModelsCatalog,
  type BusinessModelRow,
} from "@/compartilhados/hooks/hook_modelos_negocio_crud";
import {
  usePlanBusinessModelsMatrix,
  useTogglePlanBusinessModel,
  useBulkSetPlan,
  type PlanKey,
} from "@/compartilhados/hooks/hook_plan_business_models";
import { PLANS } from "../constants/constantes_planos";

const AUDIENCE_LABEL: Record<string, string> = {
  cliente: "Cliente",
  motorista: "Motorista",
  b2b: "B2B",
};

const AUDIENCE_ORDER = ["cliente", "motorista", "b2b"];

function getIcon(name?: string | null): React.ComponentType<{ className?: string }> {
  if (!name) return Briefcase;
  const Comp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
  return Comp ?? Briefcase;
}

export default function SecaoModelosPlanos() {
  const { data: modelos, isLoading: loadModels } = useBusinessModelsCatalog();
  const { data: matrix, isLoading: loadMx } = usePlanBusinessModelsMatrix();
  const toggle = useTogglePlanBusinessModel();
  const bulk = useBulkSetPlan();

  const [bulkPending, setBulkPending] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const ativos = (modelos ?? []).filter((m) => m.is_active);
    const map: Record<string, BusinessModelRow[]> = {};
    ativos.forEach((m) => {
      (map[m.audience] ||= []).push(m);
    });
    AUDIENCE_ORDER.forEach((aud) => {
      if (map[aud]) map[aud].sort((a, b) => a.sort_order - b.sort_order);
    });
    return map;
  }, [modelos]);

  const planCounts = useMemo(() => {
    const c: Record<string, number> = {};
    PLANS.forEach((p) => (c[p.key] = 0));
    if (!matrix) return c;
    matrix.forEach((row) => {
      if (row.is_included) c[row.plan_key] = (c[row.plan_key] ?? 0) + 1;
    });
    return c;
  }, [matrix]);

  const isIncluded = (plan: PlanKey, modelId: string): boolean => {
    return matrix?.get(`${plan}::${modelId}`)?.is_included ?? false;
  };

  const handleToggle = (plan: PlanKey, modelId: string, current: boolean) => {
    toggle.mutate({ plan_key: plan, business_model_id: modelId, is_included: !current });
  };

  const handleBulk = async (plan: PlanKey, included: boolean) => {
    const ids = (modelos ?? []).filter((m) => m.is_active).map((m) => m.id);
    setBulkPending(`${plan}-${included}`);
    try {
      await bulk.mutateAsync({ plan_key: plan, business_model_ids: ids, is_included: included });
    } finally {
      setBulkPending(null);
    }
  };

  if (loadModels || loadMx) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold">Matriz Modelos × Planos</h3>
          <p className="text-xs text-muted-foreground">
            Define quais modelos de negócio fazem parte de cada plano padrão. Marcas adotam os modelos por dentro do seu plano, e cidades podem sobrescrever individualmente.
          </p>
        </div>
        <div className="flex gap-2 text-xs text-muted-foreground">
          {PLANS.map((p) => (
            <Badge key={p.key} variant="outline" className="text-[10px]">
              {p.label}: {planCounts[p.key] ?? 0}
            </Badge>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 sticky top-0 z-20">
              <tr>
                <th className="text-left p-3 font-medium min-w-[200px] sm:min-w-[260px] sticky left-0 bg-muted/40 z-30">
                  Modelo de Negócio
                </th>
                {PLANS.map((p) => {
                  const PIcon = p.icon;
                  return (
                    <th key={p.key} className="p-3 text-center min-w-[120px]">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5">
                          <PIcon className={`h-4 w-4 ${p.colorClass}`} />
                          <span className="font-medium">{p.label}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {planCounts[p.key] ?? 0} incluído(s)
                        </span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[10px]"
                            disabled={bulkPending !== null}
                            onClick={() => handleBulk(p.key, true)}
                          >
                            Todos
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[10px]"
                            disabled={bulkPending !== null}
                            onClick={() => handleBulk(p.key, false)}
                          >
                            Nenhum
                          </Button>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {AUDIENCE_ORDER.map((aud) => {
                const items = grouped[aud];
                if (!items?.length) return null;
                return (
                  <Fragment key={aud}>
                    <tr className="bg-muted/20">
                      <td
                        colSpan={PLANS.length + 1}
                        className="px-3 py-1.5 text-xs font-semibold text-muted-foreground sticky left-0 bg-muted/20"
                      >
                        {AUDIENCE_LABEL[aud] ?? aud}
                      </td>
                    </tr>
                    {items.map((m) => {
                      const Icon = getIcon(m.icon);
                      const color = m.color ?? "#6366F1";
                      return (
                        <tr key={m.id} className="border-t hover:bg-muted/20">
                          <td className="p-3 sticky left-0 bg-background z-10">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-7 w-7 rounded-md flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${color}1A` }}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium truncate">{m.name}</div>
                                <code className="text-[10px] text-muted-foreground font-mono">
                                  {m.key}
                                </code>
                              </div>
                            </div>
                          </td>
                          {PLANS.map((p) => {
                            const checked = isIncluded(p.key, m.id);
                            return (
                              <td key={p.key} className="p-3 text-center">
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={() => handleToggle(p.key, m.id, checked)}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
