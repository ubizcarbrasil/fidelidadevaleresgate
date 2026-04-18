import { useMemo, useState } from "react";
import { MapPin, Building2, Info, Trash2, ArrowDownUp, Search } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CATEGORY_META, ORDEM_CATEGORIAS } from "@/compartilhados/constants/constantes_categorias_modulos";
import { useBrandList } from "../hooks/hook_brand_modules_admin";
import {
  useBranchList, useCityModulesOverview, useCycleOverrideState,
  useClearAllOverrides, type EstadoOverride, type OverviewLinhaCidade,
} from "../hooks/hook_city_overrides";

export const __PHASE_4_1B_CID_REBUILD = "2026-04-18-v3";

function resolveIcon(name?: string) {
  const Lib = LucideIcons as any;
  return (Lib[name ?? "Blocks"] ?? Lib.Blocks) as any;
}

const ESTADO_VISUAL: Record<EstadoOverride, { card: string; badge: string; label: string }> = {
  inherit: {
    card: "bg-card",
    badge: "border-border text-muted-foreground",
    label: "Herdado da marca",
  },
  override_on: {
    card: "bg-emerald-500/10 border-emerald-500/40",
    badge: "border-emerald-500/40 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
    label: "Override ligado",
  },
  override_off: {
    card: "bg-rose-500/10 border-rose-500/40",
    badge: "border-rose-500/40 bg-rose-500/20 text-rose-700 dark:text-rose-300",
    label: "Override desligado",
  },
};

function CardModuloCidade({
  linha, brandId, branchId,
}: { linha: OverviewLinhaCidade; brandId: string; branchId: string }) {
  const Icon = resolveIcon(linha.module_schema_json?.icon);
  const cycleMut = useCycleOverrideState();
  const visual = ESTADO_VISUAL[linha.state];

  const handleClick = () => {
    cycleMut.mutate({
      current: linha.state,
      brandId, branchId,
      moduleDefinitionId: linha.module_definition_id,
      overrideId: linha.override_id,
    });
  };

  return (
    <div className={cn("border rounded-lg p-3 transition-colors", visual.card)}>
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-md bg-background flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{linha.module_name}</span>
            {linha.module_is_core && <Badge variant="secondary" className="text-[10px]">Core</Badge>}
          </div>
          {linha.module_description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{linha.module_description}</p>
          )}
          <Badge variant="outline" className={cn("mt-2 text-[10px]", visual.badge)}>
            {visual.label}
          </Badge>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClick}
                disabled={cycleMut.isPending}
              >
                <ArrowDownUp className="h-3.5 w-3.5 mr-1" />
                Alternar
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[220px]">
              Cicla entre Herdar / Forçar ligado / Forçar desligado
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

export default function AbaCidades() {
  const [brandId, setBrandId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [textConfirm, setTextConfirm] = useState("");

  const { data: brands = [] } = useBrandList();
  const { data: branches = [], isLoading: loadingBranches } = useBranchList(brandId || null);
  const { data: lista = [], isLoading: loadingLista } = useCityModulesOverview(
    brandId || null, branchId || null
  );
  const clearMut = useClearAllOverrides();

  const brand = brands.find((b) => b.id === brandId);
  const branch = branches.find((b) => b.id === branchId);

  const overrideCount = useMemo(
    () => lista.filter((l) => l.state !== "inherit").length,
    [lista]
  );

  const grupos = useMemo(() => {
    const map = new Map<string, OverviewLinhaCidade[]>();
    lista.forEach((l) => {
      const cat = CATEGORY_META[l.module_category] ? l.module_category : "general";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(l);
    });
    return ORDEM_CATEGORIAS
      .filter((cat) => map.has(cat))
      .map((cat) => ({ cat, items: map.get(cat)! }));
  }, [lista]);

  const handleBrandChange = (id: string) => {
    setBrandId(id);
    setBranchId("");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-start rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p>
          <strong className="text-foreground">Override por cidade — só desliga o que o empreendedor já tem ativo.</strong> Cascata: Catálogo → Empreendedor → Cidade. Se um módulo não foi liberado para a marca, ele não aparecerá aqui.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Selecione marca e cidade
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-3 md:items-center">
          <Select value={brandId} onValueChange={handleBrandChange}>
            <SelectTrigger className="w-full md:w-[280px]">
              <SelectValue placeholder="Empreendedor" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  <span className="inline-flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5" />{b.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={branchId}
            onValueChange={setBranchId}
            disabled={!brandId || loadingBranches}
          >
            <SelectTrigger className="w-full md:w-[280px]">
              <SelectValue placeholder={!brandId ? "Selecione a marca primeiro" : "Cidade"} />
            </SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}{b.city ? ` — ${b.city}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {brand && branch && (
            <div className="flex items-center gap-2 flex-wrap md:ml-auto">
              <Badge variant="outline" className="text-[10px] sm:text-xs">
                {overrideCount} override(s)
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setTextConfirm(""); setConfirmClear(true); }}
                disabled={overrideCount === 0}
                className="w-full sm:w-auto"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Limpar todos
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {(!brandId || !branchId) && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Selecione um empreendedor e uma cidade para gerenciar overrides.
          </CardContent>
        </Card>
      )}

      {brandId && branchId && (
        <>
          <div className="border border-blue-500/30 bg-blue-500/10 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300 flex gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              Você só pode criar overrides para módulos que o empreendedor já ativou.
              Para ativar um módulo novo, vá à aba <strong>Empreendedores</strong>.
            </p>
          </div>

          {loadingLista ? (
            <div className="text-sm text-muted-foreground">Carregando módulos…</div>
          ) : lista.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Esta marca não tem módulos ativos. Nada a sobrescrever.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {grupos.map(({ cat, items }) => {
                const meta = CATEGORY_META[cat];
                return (
                  <Card key={cat}>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <span>{meta.emoji}</span>
                        {meta.label}
                        <Badge variant="outline" className="ml-auto text-[10px]">
                          {items.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {items.map((linha) => (
                        <CardModuloCidade
                          key={linha.module_definition_id}
                          linha={linha}
                          brandId={brandId}
                          branchId={branchId}
                        />
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar todos os overrides?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove <strong>{overrideCount}</strong> override(s) de{" "}
              <strong>{branch?.name}</strong>. Todos os módulos voltarão a herdar a
              configuração do empreendedor. Digite <strong>LIMPAR</strong> para confirmar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={textConfirm}
            onChange={(e) => setTextConfirm(e.target.value)}
            placeholder="LIMPAR"
            className="my-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={textConfirm !== "LIMPAR"}
              onClick={() => {
                if (!brandId || !branchId) return;
                clearMut.mutate(
                  { brandId, branchId },
                  { onSuccess: () => setConfirmClear(false) }
                );
              }}
            >
              Limpar overrides
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
