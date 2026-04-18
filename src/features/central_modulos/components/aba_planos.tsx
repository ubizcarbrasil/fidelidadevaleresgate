import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Blocks, AlertTriangle } from "lucide-react";
import { CATEGORY_META, ORDEM_CATEGORIAS } from "@/compartilhados/constants/constantes_categorias_modulos";
import { PLANS, type PlanKey } from "../constants/constantes_planos";
import { useCatalogoModulos, type ModuleDefinitionRow } from "../hooks/hook_catalogo";
import {
  usePlanModuleMatrix, useTogglePlanModule, useBulkSetPlanModules,
  useImpactoAplicarRetro, useAplicarRetroativamente,
} from "../hooks/hook_plan_matrix";

function getIcon(name?: string): React.ComponentType<any> {
  if (!name) return Blocks;
  const Comp = (Icons as any)[name];
  return Comp ?? Blocks;
}

export default function AbaPlanos() {
  const { data: modulos, isLoading: loadMods } = useCatalogoModulos();
  const { data: matrix, isLoading: loadMx } = usePlanModuleMatrix();
  const toggle = useTogglePlanModule();
  const bulk = useBulkSetPlanModules();

  const [busca, setBusca] = useState("");
  const [catFiltro, setCatFiltro] = useState<string | null>(null);
  const [retroOpen, setRetroOpen] = useState(false);
  const [retroPlanos, setRetroPlanos] = useState<PlanKey[]>([]);
  const [confirmText, setConfirmText] = useState("");

  const grouped = useMemo(() => {
    const ativos = (modulos ?? []).filter((m) => m.is_active);
    const filtered = ativos.filter((m) => {
      if (catFiltro && m.category !== catFiltro) return false;
      if (busca) {
        const t = busca.toLowerCase();
        if (!m.name.toLowerCase().includes(t) && !m.key.toLowerCase().includes(t)) return false;
      }
      return true;
    });
    const map: Record<string, ModuleDefinitionRow[]> = {};
    filtered.forEach((m) => {
      const cat = CATEGORY_META[m.category] ? m.category : "general";
      (map[cat] ||= []).push(m);
    });
    return map;
  }, [modulos, busca, catFiltro]);

  const sortedCats = ORDEM_CATEGORIAS.filter((c) => grouped[c]?.length);

  const isChecked = (planKey: PlanKey, modId: string, isCore: boolean): boolean => {
    if (isCore) return true;
    return matrix?.get(`${planKey}::${modId}`)?.is_enabled ?? false;
  };

  const handleToggle = (planKey: PlanKey, modId: string, isCore: boolean, current: boolean) => {
    if (isCore) return;
    toggle.mutate({ plan_key: planKey, module_definition_id: modId, is_enabled: !current });
  };

  const handleBulk = (planKey: PlanKey, enabled: boolean) => {
    const ids = (modulos ?? []).filter((m) => m.is_active && !m.is_core).map((m) => m.id);
    bulk.mutate({ plan_key: planKey, module_ids: ids, is_enabled: enabled });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar módulo…" className="pl-9" />
        </div>
        <Button variant="outline" onClick={() => { setRetroPlanos([]); setConfirmText(""); setRetroOpen(true); }}>
          <AlertTriangle className="h-4 w-4" /> Aplicar Retroativamente
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant={catFiltro === null ? "default" : "outline"} className="cursor-pointer" onClick={() => setCatFiltro(null)}>Todas</Badge>
        {ORDEM_CATEGORIAS.filter((c) => c !== "general").map((cat) => {
          const meta = CATEGORY_META[cat];
          return (
            <Badge key={cat} variant={catFiltro === cat ? "default" : "outline"} className="cursor-pointer" onClick={() => setCatFiltro(cat === catFiltro ? null : cat)}>
              {meta.emoji} {meta.label}
            </Badge>
          );
        })}
      </div>

      {loadMods || loadMx ? (
        <Skeleton className="h-96" />
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 sticky top-0">
                <tr>
                  <th className="text-left p-3 font-medium min-w-[280px]">Módulo</th>
                  {PLANS.map((p) => {
                    const PIcon = p.icon;
                    return (
                      <th key={p.key} className="p-3 text-center min-w-[120px]">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1.5">
                            <PIcon className={`h-4 w-4 ${p.colorClass}`} />
                            <span className="font-medium">{p.label}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => handleBulk(p.key, true)}>Todos</Button>
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => handleBulk(p.key, false)}>Nenhum</Button>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sortedCats.map((cat) => {
                  const meta = CATEGORY_META[cat];
                  return (
                    <>
                      <tr key={`h-${cat}`} className="bg-muted/20">
                        <td colSpan={PLANS.length + 1} className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                          {meta.emoji} {meta.label}
                        </td>
                      </tr>
                      {grouped[cat].map((m) => {
                        const Icon = getIcon(m.schema_json?.icon);
                        return (
                          <tr key={m.id} className="border-t hover:bg-muted/20">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <div className="min-w-0">
                                  <div className="font-medium truncate">{m.name}</div>
                                  <code className="text-[10px] text-muted-foreground font-mono">{m.key}</code>
                                </div>
                                {m.is_core && <Badge variant="secondary" className="text-[10px]">Core</Badge>}
                              </div>
                            </td>
                            {PLANS.map((p) => {
                              const checked = isChecked(p.key, m.id, m.is_core);
                              const cell = (
                                <Checkbox
                                  checked={checked}
                                  disabled={m.is_core}
                                  onCheckedChange={() => handleToggle(p.key, m.id, m.is_core, checked)}
                                />
                              );
                              return (
                                <td key={p.key} className="p-3 text-center">
                                  {m.is_core ? (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild><span>{cell}</span></TooltipTrigger>
                                        <TooltipContent>Módulos core estão sempre disponíveis em todos os planos.</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : cell}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <ModalAplicarRetro
        open={retroOpen}
        onOpenChange={setRetroOpen}
        planos={retroPlanos}
        setPlanos={setRetroPlanos}
        confirmText={confirmText}
        setConfirmText={setConfirmText}
      />
    </div>
  );
}

function ModalAplicarRetro({
  open, onOpenChange, planos, setPlanos, confirmText, setConfirmText,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  planos: PlanKey[]; setPlanos: (p: PlanKey[]) => void;
  confirmText: string; setConfirmText: (s: string) => void;
}) {
  const aplicar = useAplicarRetroativamente();
  const { data: impacto, isFetching } = useImpactoAplicarRetro(planos);

  const togglePlano = (k: PlanKey) => {
    setPlanos(planos.includes(k) ? planos.filter((p) => p !== k) : [...planos, k]);
  };

  const totalBrands = planos.reduce((acc, p) => acc + (impacto?.[p]?.brands ?? 0), 0);
  const totalCustom = planos.reduce((acc, p) => acc + (impacto?.[p]?.customizations ?? 0), 0);

  const podeConfirmar = planos.length > 0 && confirmText === "CONFIRMAR" && totalBrands > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="z-[100] max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Aplicar Template Retroativamente</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>Selecione os planos para sincronizar todas as marcas existentes com o template atual.</p>
              <div className="space-y-2">
                {PLANS.map((p) => {
                  const PIcon = p.icon;
                  const info = impacto?.[p.key];
                  const checked = planos.includes(p.key);
                  return (
                    <label key={p.key} className="flex items-center justify-between rounded-md border p-3 cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={checked} onCheckedChange={() => togglePlano(p.key)} />
                        <PIcon className={`h-4 w-4 ${p.colorClass}`} />
                        <span className="font-medium">{p.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {isFetching && checked ? "calculando…" : info ? `${info.brands} marca(s) · ${info.customizations} customização(ões)` : ""}
                      </span>
                    </label>
                  );
                })}
              </div>

              {planos.length > 0 && impacto && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
                  <strong>Impacto:</strong> Esta ação vai resetar <strong>{totalBrands} marca(s)</strong> dos planos selecionados para o template atual, apagando <strong>{totalCustom} customização(ões) manual(is)</strong>.
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-1">Para confirmar, digite <code className="bg-muted px-1">CONFIRMAR</code>:</p>
                <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="CONFIRMAR" />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={!podeConfirmar || aplicar.isPending}
            onClick={async () => {
              await aplicar.mutateAsync({ planos });
              onOpenChange(false);
            }}
          >
            Aplicar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
