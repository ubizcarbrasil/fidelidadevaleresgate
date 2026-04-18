import { useMemo, useState } from "react";
import { Building2, Lock, RotateCcw, Search, ShieldCheck } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CATEGORY_META, ORDEM_CATEGORIAS } from "@/compartilhados/constants/constantes_categorias_modulos";
import { useCatalogoModulos, type ModuleDefinitionRow } from "../hooks/hook_catalogo";
import {
  useBrandList, useBrandModulesAdmin, useToggleBrandModule,
  useSetCustomName, useResetBrandToPlan, type BrandModuloLinha,
} from "../hooks/hook_brand_modules_admin";
import { PLANS } from "../constants/constantes_planos";

function resolveIcon(name?: string) {
  const Lib = LucideIcons as any;
  return (Lib[name ?? "Blocks"] ?? Lib.Blocks) as any;
}

function CardModuloEmp({
  def, brandId, row, planAllowed,
}: {
  def: ModuleDefinitionRow;
  brandId: string;
  row?: BrandModuloLinha;
  planAllowed: boolean;
}) {
  const Icon = resolveIcon(def.schema_json?.icon);
  const toggleMut = useToggleBrandModule();
  const nameMut = useSetCustomName();

  const initialName = (row?.config_json as any)?.custom_name ?? "";
  const [customName, setCustomName] = useState<string>(initialName);
  const isOn = row?.is_enabled ?? false;

  const disabled = def.is_core || !planAllowed;
  const effectiveOn = def.is_core ? true : isOn;

  const handleToggle = (next: boolean) => {
    if (disabled) return;
    toggleMut.mutate({
      brandId, moduleDefinitionId: def.id, isEnabled: next, existingRow: row,
    });
  };

  const handleSaveName = () => {
    if (customName === initialName) return;
    nameMut.mutate({
      brandId, moduleDefinitionId: def.id, customName, existingRow: row,
    });
  };

  return (
    <div className="border rounded-lg p-3 bg-card flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{def.name}</span>
            {def.is_core && <Badge variant="secondary" className="text-[10px]">Core</Badge>}
            {!planAllowed && !def.is_core && (
              <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600 dark:text-amber-400">
                <Lock className="h-3 w-3 mr-1" />Não disponível no plano
              </Badge>
            )}
          </div>
          {def.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{def.description}</p>
          )}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Switch
                  checked={effectiveOn}
                  disabled={disabled}
                  onCheckedChange={handleToggle}
                />
              </div>
            </TooltipTrigger>
            {disabled && (
              <TooltipContent side="left">
                {def.is_core ? "Módulo core sempre ativo" : "Faça upgrade do plano"}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex items-center gap-2 pl-12">
        <Input
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          onBlur={handleSaveName}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
          placeholder="Nome customizado (opcional)"
          className="h-8 text-xs"
          disabled={!planAllowed && !def.is_core}
        />
      </div>
    </div>
  );
}

export default function AbaEmpreendedores() {
  const [brandId, setBrandId] = useState<string>("");
  const [busca, setBusca] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const { data: brands = [], isLoading: loadingBrands } = useBrandList();
  const { data: catalogo = [] } = useCatalogoModulos();
  const { data: overview, isLoading: loadingOverview } = useBrandModulesAdmin(brandId || null);
  const resetMut = useResetBrandToPlan();

  const brand = brands.find((b) => b.id === brandId);
  const planMeta = PLANS.find((p) => p.key === (brand?.subscription_plan as any));

  const grupos = useMemo(() => {
    const term = busca.trim().toLowerCase();
    const filtrados = catalogo
      .filter((m) => m.is_active)
      .filter((m) => !term || m.name.toLowerCase().includes(term) || m.key.toLowerCase().includes(term));

    const map = new Map<string, ModuleDefinitionRow[]>();
    filtrados.forEach((m) => {
      const cat = CATEGORY_META[m.category] ? m.category : "general";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(m);
    });
    return ORDEM_CATEGORIAS
      .filter((cat) => map.has(cat))
      .map((cat) => ({ cat, items: map.get(cat)! }));
  }, [catalogo, busca]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Selecione o empreendedor
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-3 md:items-center">
          <Select value={brandId} onValueChange={setBrandId} disabled={loadingBrands}>
            <SelectTrigger className="md:w-[320px]">
              <SelectValue placeholder={loadingBrands ? "Carregando…" : "Escolha uma marca"} />
            </SelectTrigger>
            <SelectContent>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {brand && planMeta && (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="gap-1" variant="secondary">
                <planMeta.icon className={`h-3 w-3 ${planMeta.colorClass}`} />
                Plano {planMeta.label}
              </Badge>
              {overview && (
                <Badge variant="outline">
                  {overview.totalActive} de {overview.totalAvailable} módulos ativos
                </Badge>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmReset(true)}
                disabled={!overview}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Resetar para padrão do plano
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {!brandId && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Selecione um empreendedor para gerenciar os módulos.
          </CardContent>
        </Card>
      )}

      {brandId && (
        <>
          <div className="relative max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar módulo…"
              className="pl-9"
            />
          </div>

          {loadingOverview ? (
            <div className="text-sm text-muted-foreground">Carregando módulos…</div>
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
                      {items.map((def) => {
                        const row = overview?.rowMap.get(def.id);
                        const planAllowed = def.is_core || (overview?.planAvailableMap.get(def.id) ?? false);
                        return (
                          <CardModuloEmp
                            key={def.id}
                            def={def}
                            brandId={brandId}
                            row={row}
                            planAllowed={planAllowed}
                          />
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar para padrão do plano?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação vai apagar todas as customizações manuais de módulos desta marca
              e re-aplicar o template do plano <strong>{planMeta?.label}</strong>.
              Nomes customizados também serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!brandId) return;
                resetMut.mutate({ brandId }, { onSuccess: () => setConfirmReset(false) });
              }}
            >
              Resetar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
