import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Shield, ArrowRight, Building2, Store, Save, Loader2, ChevronDown, MapPin, Pencil, Check, X, MoveRight, Car, User, Zap } from "lucide-react";
import { toast } from "sonner";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { queryKeys } from "@/lib/queryKeys";
import ManageGroupsDialog from "@/components/permissions/ManageGroupsDialog";

/* ─── types ─── */
interface PermissionRow {
  id: string; key: string; module: string; description: string | null;
  subgroup_id: string | null; display_name: string | null; order_index: number; is_active: boolean;
}
interface ConfigRow {
  id: string; brand_id: string; permission_key: string;
  allowed_for_brand: boolean; allowed_for_store: boolean;
  branch_id: string | null; scope: string;
}
interface GroupRow { id: string; name: string; icon_name: string; order_index: number }
interface SubgroupRow { id: string; group_id: string; name: string; order_index: number }
interface SubItemRow { id: string; permission_id: string; key: string; display_name: string; order_index: number }
interface SubItemConfigRow { id: string; brand_id: string; sub_item_id: string; branch_id: string | null; is_allowed: boolean }

const MODULE_LABELS: Record<string, string> = {
  branches: "Cidades", brands: "Marcas", customers: "Clientes", domains: "Domínios",
  offers: "Ofertas", redemptions: "Resgates", stores: "Parceiros", vouchers: "Cupons",
  users: "Usuários", reports: "Relatórios", settings: "Configurações", catalog: "Catálogo",
  crm: "CRM", campaigns: "Campanhas", points: "Pontos", notifications: "Notificações",
  wallet: "Carteira", banners: "Banners", home_sections: "Seções da Home",
  custom_pages: "Páginas", page_builder: "Construtor de Páginas", redemption_qr: "Resgate por QR",
  points_rules: "Regras de Pontos", earn_points_store: "Pontuação de Parceiros",
  affiliate_deals: "Achadinhos",
};

const ACTION_LABELS: Record<string, string> = {
  create: "Criar", read: "Visualizar", update: "Editar", delete: "Excluir",
  approve: "Aprovar", manage: "Gerenciar", export: "Exportar", import: "Importar",
  send: "Enviar", redeem: "Resgatar", config: "Configurar",
};

/* ─── business model context per module ─── */
type ModuleContext = "DRIVER" | "PASSENGER" | "UNIVERSAL";

const MODULE_CONTEXT: Record<string, ModuleContext> = {
  offers: "PASSENGER",
  redemptions: "PASSENGER",
  vouchers: "PASSENGER",
  catalog: "PASSENGER",
  redemption_qr: "PASSENGER",
  affiliate_deals: "PASSENGER",
};

const SCORING_MODEL_LABELS: Record<string, { label: string; icon: typeof Car; colorClass: string }> = {
  DRIVER_ONLY: { label: "Apenas Motorista", icon: Car, colorClass: "text-green-400 border-green-500/50 bg-green-500/10" },
  PASSENGER_ONLY: { label: "Apenas Cliente", icon: User, colorClass: "text-red-400 border-red-500/50 bg-red-500/10" },
  BOTH: { label: "Ambos", icon: Zap, colorClass: "text-blue-400 border-blue-500/50 bg-blue-500/10" },
};

function getModuleContext(mod: string): ModuleContext {
  return MODULE_CONTEXT[mod] || "UNIVERSAL";
}

function isOutOfModel(mod: string, scoringModel: string | null): boolean {
  if (!scoringModel || scoringModel === "BOTH") return false;
  const ctx = getModuleContext(mod);
  if (ctx === "UNIVERSAL") return false;
  if (scoringModel === "DRIVER_ONLY" && ctx === "PASSENGER") return true;
  if (scoringModel === "PASSENGER_ONLY" && ctx === "DRIVER") return true;
  return false;
}

function friendlyModule(mod: string) { return MODULE_LABELS[mod] || mod.charAt(0).toUpperCase() + mod.slice(1); }
function friendlyPermission(key: string) {
  const parts = key.split(".");
  if (parts.length >= 2) return `${ACTION_LABELS[parts[parts.length - 1]] || parts[parts.length - 1]} ${friendlyModule(parts[0])}`;
  return key;
}

/* ─── component ─── */
export default function BrandPermissionOverflowPage() {
  const qc = useQueryClient();
  const { consoleScope, currentBrandId } = useBrandGuard();
  const isRoot = consoleScope === "ROOT";

  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("__all__");
  const [saving, setSaving] = useState(false);
  const [localChanges, setLocalChanges] = useState<Record<string, Partial<ConfigRow>>>({});
  const [localSubItemChanges, setLocalSubItemChanges] = useState<Record<string, boolean>>({});
  const [editingDisplayName, setEditingDisplayName] = useState<string | null>(null);
  const [tempDisplayName, setTempDisplayName] = useState("");
  const [movingPermId, setMovingPermId] = useState<string | null>(null);

  const activeBrandId = isRoot ? selectedBrandId : currentBrandId;
  const activeBranchId = selectedBranchId === "__all__" ? null : selectedBranchId;

  /* ─── queries ─── */
  const { data: brands } = useQuery({
    queryKey: ["brands-list-overflow"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brands").select("id, name, slug").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
    enabled: isRoot,
  });

  const { data: branches } = useQuery({
    queryKey: ["branches-for-brand", activeBrandId],
    queryFn: async () => {
      const { data, error } = await supabase.from("branches").select("id, name, city").eq("brand_id", activeBrandId!).eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!activeBrandId,
  });

  const { data: groups } = useQuery({
    queryKey: queryKeys.permissionGroups.all,
    queryFn: async () => {
      const { data, error } = await supabase.from("permission_groups").select("*").order("order_index");
      if (error) throw error;
      return data as GroupRow[];
    },
  });

  const { data: subgroups } = useQuery({
    queryKey: queryKeys.permissionSubgroups.all,
    queryFn: async () => {
      const { data, error } = await supabase.from("permission_subgroups").select("*").order("order_index");
      if (error) throw error;
      return data as SubgroupRow[];
    },
  });

  const { data: permissions, isLoading: permsLoading } = useQuery({
    queryKey: ["permissions-all-overflow"],
    queryFn: async () => {
      const { data, error } = await supabase.from("permissions").select("*").order("order_index, module, key");
      if (error) throw error;
      return data as PermissionRow[];
    },
  });

  const { data: configs, isLoading: configLoading } = useQuery({
    queryKey: queryKeys.permissionConfig.list(activeBrandId, activeBranchId),
    queryFn: async () => {
      if (!activeBrandId) return [];
      const { data, error } = await supabase.from("brand_permission_config").select("*").eq("brand_id", activeBrandId);
      if (error) throw error;
      return data as ConfigRow[];
    },
    enabled: !!activeBrandId,
  });

  const { data: subItems } = useQuery({
    queryKey: queryKeys.permissionSubItems.all,
    queryFn: async () => {
      const { data, error } = await supabase.from("permission_sub_items").select("*").order("order_index");
      if (error) throw error;
      return data as SubItemRow[];
    },
  });

  const { data: subItemConfigs } = useQuery({
    queryKey: queryKeys.brandSubPermConfig.list(activeBrandId, activeBranchId),
    queryFn: async () => {
      if (!activeBrandId) return [];
      const { data, error } = await supabase.from("brand_sub_permission_config").select("*").eq("brand_id", activeBrandId);
      if (error) throw error;
      return data as SubItemConfigRow[];
    },
    enabled: !!activeBrandId,
  });

  /* ─── mutations ─── */
  const moveToSubgroup = useMutation({
    mutationFn: async ({ permId, subgroupId }: { permId: string; subgroupId: string | null }) => {
      const { error } = await supabase.from("permissions").update({ subgroup_id: subgroupId }).eq("id", permId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["permissions-all-overflow"] });
      setMovingPermId(null);
      toast.success("Permissão movida!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /* ─── derived data ─── */
  const configMap = useMemo(() => {
    const map: Record<string, ConfigRow> = {};
    configs?.filter(c => !c.branch_id).forEach(c => { map[c.permission_key] = c; });
    if (activeBranchId) {
      configs?.filter(c => c.branch_id === activeBranchId).forEach(c => { map[c.permission_key] = c; });
    }
    return map;
  }, [configs, activeBranchId]);

  const subItemConfigMap = useMemo(() => {
    const map: Record<string, SubItemConfigRow> = {};
    subItemConfigs?.filter(c => !c.branch_id).forEach(c => { map[c.sub_item_id] = c; });
    if (activeBranchId) {
      subItemConfigs?.filter(c => c.branch_id === activeBranchId).forEach(c => { map[c.sub_item_id] = c; });
    }
    return map;
  }, [subItemConfigs, activeBranchId]);

  const subItemsByPermission = useMemo(() => {
    const map: Record<string, SubItemRow[]> = {};
    subItems?.forEach(si => {
      if (!map[si.permission_id]) map[si.permission_id] = [];
      map[si.permission_id].push(si);
    });
    return map;
  }, [subItems]);

  const hierarchy = useMemo(() => {
    if (!permissions) return { grouped: [] as any[], ungrouped: [] as PermissionRow[], ungroupedByModule: {} as Record<string, PermissionRow[]> };

    const subgroupMap = new Map<string, SubgroupRow>();
    subgroups?.forEach(s => subgroupMap.set(s.id, s));

    const assigned = permissions.filter(p => p.subgroup_id && subgroupMap.has(p.subgroup_id));
    const ungrouped = permissions.filter(p => !p.subgroup_id || !subgroupMap.has(p.subgroup_id!));

    const tree: Record<string, Record<string, PermissionRow[]>> = {};
    assigned.forEach(p => {
      const sg = subgroupMap.get(p.subgroup_id!)!;
      if (!tree[sg.group_id]) tree[sg.group_id] = {};
      if (!tree[sg.group_id][sg.id]) tree[sg.group_id][sg.id] = [];
      tree[sg.group_id][sg.id].push(p);
    });

    const grouped = (groups || []).map(g => ({
      group: g,
      subgroups: Object.entries(tree[g.id] || {}).map(([sgId, perms]) => ({
        subgroup: subgroupMap.get(sgId)!,
        permissions: perms,
      })).sort((a, b) => a.subgroup.order_index - b.subgroup.order_index),
    }));

    const ungroupedByModule: Record<string, PermissionRow[]> = {};
    ungrouped.forEach(p => {
      if (!ungroupedByModule[p.module]) ungroupedByModule[p.module] = [];
      ungroupedByModule[p.module].push(p);
    });

    return { grouped, ungrouped, ungroupedByModule };
  }, [permissions, groups, subgroups]);

  // Build flat list of group > subgroup options for the move selector
  const subgroupOptions = useMemo(() => {
    const opts: { label: string; value: string }[] = [];
    (groups || []).forEach(g => {
      (subgroups || []).filter(s => s.group_id === g.id).forEach(s => {
        opts.push({ label: `${g.name} › ${s.name}`, value: s.id });
      });
    });
    return opts;
  }, [groups, subgroups]);

  /* ─── helpers ─── */
  const getEffectiveValue = useCallback((permKey: string, field: "allowed_for_brand" | "allowed_for_store"): boolean => {
    if (localChanges[permKey]?.[field] !== undefined) return localChanges[permKey][field]!;
    const existing = configMap[permKey];
    if (existing) return existing[field];
    return field === "allowed_for_brand";
  }, [localChanges, configMap]);

  const getSubItemValue = useCallback((subItemId: string): boolean => {
    if (localSubItemChanges[subItemId] !== undefined) return localSubItemChanges[subItemId];
    const existing = subItemConfigMap[subItemId];
    if (existing) return existing.is_allowed;
    return true;
  }, [localSubItemChanges, subItemConfigMap]);

  const togglePermission = (permKey: string, field: "allowed_for_brand" | "allowed_for_store", value: boolean) => {
    setLocalChanges(prev => ({ ...prev, [permKey]: { ...prev[permKey], [field]: value } }));
  };

  const toggleSubItem = (subItemId: string, value: boolean) => {
    setLocalSubItemChanges(prev => ({ ...prev, [subItemId]: value }));
  };

  const toggleBulk = (permKeys: string[], field: "allowed_for_brand" | "allowed_for_store", value: boolean) => {
    setLocalChanges(prev => {
      const next = { ...prev };
      permKeys.forEach(k => { next[k] = { ...next[k], [field]: value }; });
      return next;
    });
  };

  const countActive = (perms: PermissionRow[], field: "allowed_for_brand" | "allowed_for_store") =>
    perms.filter(p => getEffectiveValue(p.key, field)).length;

  /* ─── save ─── */
  const handleSave = async () => {
    if (!activeBrandId) return;
    setSaving(true);
    try {
      const changedKeys = Object.keys(localChanges);
      const changedSubItems = Object.keys(localSubItemChanges);

      if (changedKeys.length === 0 && changedSubItems.length === 0) {
        toast.info("Nenhuma alteração.");
        setSaving(false);
        return;
      }

      // Save permission config changes
      for (const permKey of changedKeys) {
        const existing = configMap[permKey];
        const changes = localChanges[permKey];
        const newBrand = changes.allowed_for_brand ?? existing?.allowed_for_brand ?? true;
        const newStore = changes.allowed_for_store ?? existing?.allowed_for_store ?? false;
        const finalStore = newBrand ? newStore : false;

        if (activeBranchId) {
          const branchConfig = configs?.find(c => c.permission_key === permKey && c.branch_id === activeBranchId);
          if (branchConfig) {
            await supabase.from("brand_permission_config").update({
              ...(isRoot ? { allowed_for_brand: newBrand } : {}),
              allowed_for_store: finalStore,
            }).eq("id", branchConfig.id).throwOnError();
          } else {
            await supabase.from("brand_permission_config").insert({
              brand_id: activeBrandId,
              permission_key: permKey,
              allowed_for_brand: newBrand,
              allowed_for_store: finalStore,
              branch_id: activeBranchId,
              scope: "branch",
            }).throwOnError();
          }
        } else {
          if (existing) {
            await supabase.from("brand_permission_config").update({
              ...(isRoot ? { allowed_for_brand: newBrand } : {}),
              allowed_for_store: finalStore,
            }).eq("id", existing.id).throwOnError();
          } else {
            await supabase.from("brand_permission_config").insert({
              brand_id: activeBrandId,
              permission_key: permKey,
              allowed_for_brand: newBrand,
              allowed_for_store: finalStore,
              scope: "brand",
            }).throwOnError();
          }
        }
      }

      // Save sub-item config changes
      for (const subItemId of changedSubItems) {
        const existing = subItemConfigMap[subItemId];
        const newValue = localSubItemChanges[subItemId];

        if (activeBranchId) {
          const branchConfig = subItemConfigs?.find(c => c.sub_item_id === subItemId && c.branch_id === activeBranchId);
          if (branchConfig) {
            await supabase.from("brand_sub_permission_config").update({ is_allowed: newValue }).eq("id", branchConfig.id).throwOnError();
          } else {
            await supabase.from("brand_sub_permission_config").insert({
              brand_id: activeBrandId,
              sub_item_id: subItemId,
              branch_id: activeBranchId,
              is_allowed: newValue,
            }).throwOnError();
          }
        } else {
          if (existing) {
            await supabase.from("brand_sub_permission_config").update({ is_allowed: newValue }).eq("id", existing.id).throwOnError();
          } else {
            await supabase.from("brand_sub_permission_config").insert({
              brand_id: activeBrandId,
              sub_item_id: subItemId,
              is_allowed: newValue,
            }).throwOnError();
          }
        }
      }

      setLocalChanges({});
      setLocalSubItemChanges({});
      qc.invalidateQueries({ queryKey: queryKeys.permissionConfig.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.brandSubPermConfig.lists() });
      toast.success("Permissões salvas com sucesso!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveDisplayName = async (permId: string, newName: string) => {
    try {
      await supabase.from("permissions").update({ display_name: newName || null }).eq("id", permId).throwOnError();
      qc.invalidateQueries({ queryKey: ["permissions-all-overflow"] });
      toast.success("Nome atualizado!");
    } catch (e: any) { toast.error(e.message); }
    setEditingDisplayName(null);
  };

  const hasChanges = Object.keys(localChanges).length > 0 || Object.keys(localSubItemChanges).length > 0;
  const isViewingBranch = activeBranchId !== null;

  /* ─── render sub-items (subclass) ─── */
  const renderSubItems = (permId: string, parentEnabled: boolean) => {
    const items = subItemsByPermission[permId];
    if (!items || items.length === 0) return null;

    return (
      <div className="ml-6 mt-2 space-y-1.5 border-l-2 border-muted pl-3">
        {items.map(si => {
          const isAllowed = getSubItemValue(si.id);
          const hasChange = localSubItemChanges[si.id] !== undefined;
          return (
            <div key={si.id} className={`flex items-center justify-between rounded-md px-2 py-1.5 ${hasChange ? "bg-primary/5" : "bg-muted/20"}`}>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">↳</span>
                <span className="text-xs">{si.display_name}</span>
                {hasChange && <Badge variant="secondary" className="text-[9px] px-1">mod</Badge>}
              </div>
              <Switch
                checked={isAllowed}
                disabled={!parentEnabled}
                onCheckedChange={v => toggleSubItem(si.id, v)}
                className="scale-75"
              />
            </div>
          );
        })}
      </div>
    );
  };

  /* ─── render move-to-subgroup selector ─── */
  const renderMoveSelector = (perm: PermissionRow) => {
    if (movingPermId !== perm.id) {
      return (
        <Button variant="ghost" size="icon" className="h-6 w-6" title="Mover para subgrupo" onClick={() => setMovingPermId(perm.id)}>
          <MoveRight className="h-3 w-3 text-muted-foreground" />
        </Button>
      );
    }
    return (
      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
        <Select onValueChange={v => moveToSubgroup.mutate({ permId: perm.id, subgroupId: v })}>
          <SelectTrigger className="h-7 text-xs w-44">
            <SelectValue placeholder="Mover para..." />
          </SelectTrigger>
          <SelectContent>
            {subgroupOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setMovingPermId(null)}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  /* ─── render permission item ─── */
  const renderPermItem = (perm: PermissionRow, showMoveSelector = false) => {
    const brandAllowed = getEffectiveValue(perm.key, "allowed_for_brand");
    const storeAllowed = getEffectiveValue(perm.key, "allowed_for_store");
    const hasLocalChange = localChanges[perm.key] !== undefined;
    const displayName = perm.display_name || friendlyPermission(perm.key);
    const isEditing = editingDisplayName === perm.id;

    return (
      <div key={perm.id}>
        <div
          className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${hasLocalChange ? "border-primary/50 bg-primary/5" : ""} ${!perm.is_active ? "opacity-50" : ""}`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <Input value={tempDisplayName} onChange={e => setTempDisplayName(e.target.value)} className="h-7 text-sm w-48" />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => saveDisplayName(perm.id, tempDisplayName)}>
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingDisplayName(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="text-sm font-medium">{displayName}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingDisplayName(perm.id); setTempDisplayName(perm.display_name || ""); }}>
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </Button>
                  {showMoveSelector && isRoot && renderMoveSelector(perm)}
                </>
              )}
              {hasLocalChange && <Badge variant="secondary" className="text-[10px]">modificado</Badge>}
              {isViewingBranch && configs?.some(c => c.permission_key === perm.key && c.branch_id === activeBranchId) && (
                <Badge variant="outline" className="text-[10px] border-accent text-accent-foreground">customizado</Badge>
              )}
            </div>
            <span className="block text-[10px] font-mono text-muted-foreground">{perm.key}</span>
          </div>
          <div className="flex items-center gap-6 ml-4">
            {isRoot && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Empreendedor</span>
                <Switch checked={brandAllowed} onCheckedChange={v => togglePermission(perm.key, "allowed_for_brand", v)} />
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Parceiro</span>
              <Switch checked={storeAllowed} disabled={!brandAllowed} onCheckedChange={v => togglePermission(perm.key, "allowed_for_store", v)} />
            </div>
          </div>
        </div>
        {renderSubItems(perm.id, brandAllowed)}
      </div>
    );
  };

  /* ─── render subgroup ─── */
  const renderSubgroup = (sg: SubgroupRow, perms: PermissionRow[]) => {
    const activeCount = countActive(perms, "allowed_for_brand");
    const allOn = activeCount === perms.length;
    const keys = perms.map(p => p.key);

    return (
      <Collapsible key={sg.id}>
        <div className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-lg">
          <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left">
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
            <span className="text-sm font-medium">{sg.name}</span>
            <Badge variant="secondary" className="text-[10px]">{activeCount}/{perms.length}</Badge>
          </CollapsibleTrigger>
          {isRoot && (
            <Switch
              checked={allOn}
              onCheckedChange={v => toggleBulk(keys, "allowed_for_brand", v)}
              aria-label={`Toggle all ${sg.name}`}
            />
          )}
        </div>
        <CollapsibleContent>
          <div className="space-y-2 pl-6 pt-2">
            {perms.map(p => renderPermItem(p, false))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {isRoot ? "Permissões por Empresa" : "Permissões dos Parceiros"}
          </h2>
          <p className="text-muted-foreground">
            {isRoot ? "Configure permissões hierárquicas por grupo, subgrupo e função" : "Configure permissões dos parceiros"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isRoot && <ManageGroupsDialog />}
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar
          </Button>
        </div>
      </div>

      {/* Flow indicator */}
      <Card className="bg-muted/30">
        <CardContent className="py-3">
          <div className="flex items-center justify-center gap-3 text-sm">
            <div className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-primary" /><span className="font-medium">Domo de Ferro</span></div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className={`flex items-center gap-1.5 ${isRoot ? "text-primary font-semibold" : ""}`}><Building2 className="h-4 w-4" /><span>Empreendedor</span></div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className={`flex items-center gap-1.5 ${!isRoot ? "text-primary font-semibold" : ""}`}><Store className="h-4 w-4" /><span>Parceiro</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Selectors */}
      <div className="flex flex-wrap gap-3">
        {isRoot && (
          <Select value={selectedBrandId} onValueChange={v => { setSelectedBrandId(v); setSelectedBranchId("__all__"); setLocalChanges({}); setLocalSubItemChanges({}); }}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Selecione uma empresa..." />
            </SelectTrigger>
            <SelectContent>
              {brands?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {activeBrandId && (
          <Select value={selectedBranchId} onValueChange={v => { setSelectedBranchId(v); setLocalChanges({}); setLocalSubItemChanges({}); }}>
            <SelectTrigger className="w-full max-w-xs">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Cidade..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Padrão (todas as cidades)</SelectItem>
              {branches?.map(b => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name} {b.city && <span className="text-muted-foreground ml-1">— {b.city}</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isViewingBranch && (
        <Card className="border-accent bg-accent/10">
          <CardContent className="py-3">
            <p className="text-sm text-accent-foreground">
              <MapPin className="h-4 w-4 inline mr-1" />
              Visualizando permissões para <strong>{branches?.find(b => b.id === activeBranchId)?.name}</strong>.
              Permissões herdam do padrão global e podem ser sobrescritas individualmente.
            </p>
          </CardContent>
        </Card>
      )}

      {!activeBrandId && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Selecione uma empresa para configurar.</CardContent></Card>
      )}

      {activeBrandId && (permsLoading || configLoading) && (
        <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>
      )}

      {/* Hierarchical permissions */}
      {activeBrandId && !permsLoading && !configLoading && (
        <div className="space-y-4">
          {/* Grouped permissions */}
          {hierarchy.grouped.length > 0 && (
            <Accordion type="multiple" className="space-y-3">
              {hierarchy.grouped.map(({ group, subgroups: sgs }: { group: GroupRow; subgroups: { subgroup: SubgroupRow; permissions: PermissionRow[] }[] }) => {
                const allPerms = sgs.flatMap((sg: { subgroup: SubgroupRow; permissions: PermissionRow[] }) => sg.permissions);
                const activeCount = countActive(allPerms, "allowed_for_brand");
                const allOn = allPerms.length > 0 && activeCount === allPerms.length;
                const keys = allPerms.map((p: PermissionRow) => p.key);

                return (
                  <AccordionItem key={group.id} value={group.id} className="border rounded-lg">
                    <div className="flex items-center justify-between pr-4">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{group.name}</span>
                          <Badge variant="outline" className="text-[10px]">{activeCount}/{allPerms.length}</Badge>
                        </div>
                      </AccordionTrigger>
                      {isRoot && allPerms.length > 0 && (
                        <Switch
                          checked={allOn}
                          onCheckedChange={v => toggleBulk(keys, "allowed_for_brand", v)}
                          aria-label={`Toggle group ${group.name}`}
                        />
                      )}
                    </div>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-3">
                        {sgs.map(({ subgroup, permissions: perms }: { subgroup: SubgroupRow; permissions: PermissionRow[] }) => renderSubgroup(subgroup, perms))}
                        {sgs.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum subgrupo com permissões atribuídas.
                          </p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}

          {/* Ungrouped permissions (by module) */}
          {hierarchy.ungroupedByModule && Object.entries(hierarchy.ungroupedByModule).length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-muted-foreground mt-6">Permissões não agrupadas</h3>
              <Accordion type="multiple" className="space-y-3">
                {Object.entries(hierarchy.ungroupedByModule).map(([mod, perms]) => {
                  const activeCount = countActive(perms, "allowed_for_brand");
                  const allOn = activeCount === perms.length;
                  const keys = perms.map(p => p.key);

                  return (
                    <AccordionItem key={mod} value={`ungrouped-${mod}`} className="border rounded-lg">
                      <div className="flex items-center justify-between pr-4">
                        <AccordionTrigger className="px-4 py-3 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{friendlyModule(mod)}</Badge>
                            <span className="text-xs text-muted-foreground">{activeCount}/{perms.length}</span>
                          </div>
                        </AccordionTrigger>
                        {isRoot && (
                          <Switch checked={allOn} onCheckedChange={v => toggleBulk(keys, "allowed_for_brand", v)} />
                        )}
                      </div>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-2">{perms.map(p => renderPermItem(p, true))}</div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </>
          )}
        </div>
      )}
    </div>
  );
}
