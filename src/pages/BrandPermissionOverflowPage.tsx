import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, ShieldCheck, ArrowRight, Building2, Store, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useBrandGuard } from "@/hooks/useBrandGuard";

const MODULE_LABELS: Record<string, string> = {
  branches: "Cidades",
  brands: "Marcas",
  customers: "Clientes",
  domains: "Domínios",
  offers: "Ofertas",
  redemptions: "Resgates",
  stores: "Parceiros",
  vouchers: "Cupons",
  users: "Usuários",
  reports: "Relatórios",
  settings: "Configurações",
  catalog: "Catálogo",
  crm: "CRM",
  campaigns: "Campanhas",
  points: "Pontos",
  notifications: "Notificações",
  wallet: "Carteira",
  banners: "Banners",
  home_sections: "Seções da Home",
  custom_pages: "Páginas",
  page_builder: "Construtor de Páginas",
  redemption_qr: "Resgate por QR",
  points_rules: "Regras de Pontos",
  earn_points_store: "Pontuação de Parceiros",
  affiliate_deals: "Achadinhos",
};

const ACTION_LABELS: Record<string, string> = {
  create: "Criar",
  read: "Visualizar",
  update: "Editar",
  delete: "Excluir",
  approve: "Aprovar",
  manage: "Gerenciar",
  export: "Exportar",
  import: "Importar",
  send: "Enviar",
  redeem: "Resgatar",
  config: "Configurar",
};

function friendlyModule(mod: string) {
  return MODULE_LABELS[mod] || mod.charAt(0).toUpperCase() + mod.slice(1);
}

function friendlyPermission(key: string) {
  const parts = key.split(".");
  if (parts.length >= 2) {
    const action = ACTION_LABELS[parts[parts.length - 1]] || parts[parts.length - 1];
    return `${action} ${friendlyModule(parts[0])}`;
  }
  return key;
}

function getPermissionDisplay(permission: PermissionRow): { title: string; subtitle?: string } {
  const fallbackTitle = friendlyPermission(permission.key);
  const description = permission.description?.trim();

  if (!description) return { title: fallbackTitle };

  const technicalPattern = /\b[a-z_]+\.[a-z_]+\b/i;
  const rawModulePattern = /\b(branches|brands|customers|domains|offers|redemptions|stores|vouchers|users|reports|settings|catalog|crm|campaigns|points|notifications)\b/i;

  if (technicalPattern.test(description) || rawModulePattern.test(description)) {
    return { title: fallbackTitle };
  }

  const normalizedDescription = description.charAt(0).toUpperCase() + description.slice(1);

  if (normalizedDescription.toLowerCase() === fallbackTitle.toLowerCase()) {
    return { title: fallbackTitle };
  }

  return { title: normalizedDescription, subtitle: fallbackTitle };
}

type Mode = "root-to-brand" | "brand-to-store";

interface PermissionRow {
  id: string;
  key: string;
  module: string;
  description: string | null;
}

interface ConfigRow {
  id: string;
  brand_id: string;
  permission_key: string;
  allowed_for_brand: boolean;
  allowed_for_store: boolean;
}

export default function BrandPermissionOverflowPage() {
  const qc = useQueryClient();
  const { consoleScope, currentBrandId } = useBrandGuard();
  const isRoot = consoleScope === "ROOT";
  const mode: Mode = isRoot ? "root-to-brand" : "brand-to-store";

  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [localChanges, setLocalChanges] = useState<Record<string, Partial<ConfigRow>>>({});

  const activeBrandId = isRoot ? selectedBrandId : currentBrandId;

  // Load brands for ROOT selector
  const { data: brands } = useQuery({
    queryKey: ["brands-list-overflow"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brands").select("id, name, slug").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
    enabled: isRoot,
  });

  // Load all permissions
  const { data: permissions, isLoading: permsLoading } = useQuery({
    queryKey: ["permissions-all-overflow"],
    queryFn: async () => {
      const { data, error } = await supabase.from("permissions").select("*").order("module, key");
      if (error) throw error;
      return data as PermissionRow[];
    },
  });

  // Load config for selected brand
  const { data: configs, isLoading: configLoading } = useQuery({
    queryKey: ["brand-permission-config", activeBrandId],
    queryFn: async () => {
      if (!activeBrandId) return [];
      const { data, error } = await supabase
        .from("brand_permission_config")
        .select("*")
        .eq("brand_id", activeBrandId);
      if (error) throw error;
      return data as ConfigRow[];
    },
    enabled: !!activeBrandId,
  });

  // Build config map
  const configMap = useMemo(() => {
    const map: Record<string, ConfigRow> = {};
    configs?.forEach((c) => { map[c.permission_key] = c; });
    return map;
  }, [configs]);

  // Group permissions by module
  const modules = useMemo(() => {
    if (!permissions) return {};
    return permissions.reduce((acc, p) => {
      if (!acc[p.module]) acc[p.module] = [];
      acc[p.module].push(p);
      return acc;
    }, {} as Record<string, PermissionRow[]>);
  }, [permissions]);

  const getEffectiveValue = (permKey: string, field: "allowed_for_brand" | "allowed_for_store"): boolean => {
    if (localChanges[permKey]?.[field] !== undefined) return localChanges[permKey][field]!;
    const existing = configMap[permKey];
    if (existing) return existing[field];
    return field === "allowed_for_brand" ? true : false;
  };

  const togglePermission = (permKey: string, field: "allowed_for_brand" | "allowed_for_store", value: boolean) => {
    setLocalChanges((prev) => ({
      ...prev,
      [permKey]: { ...prev[permKey], [field]: value },
    }));
  };

  // Save all changes
  const handleSave = async () => {
    if (!activeBrandId) return;
    setSaving(true);
    try {
      const changedKeys = Object.keys(localChanges);
      if (changedKeys.length === 0) {
        toast.info("Nenhuma alteração para salvar.");
        setSaving(false);
        return;
      }

      for (const permKey of changedKeys) {
        const existing = configMap[permKey];
        const changes = localChanges[permKey];

        const newAllowedForBrand = changes.allowed_for_brand ?? existing?.allowed_for_brand ?? true;
        const newAllowedForStore = changes.allowed_for_store ?? existing?.allowed_for_store ?? false;

        // If store is allowed but brand is not, auto-disable store
        const finalAllowedForStore = newAllowedForBrand ? newAllowedForStore : false;

        if (existing) {
          const { error } = await supabase
            .from("brand_permission_config")
            .update({
              ...(isRoot ? { allowed_for_brand: newAllowedForBrand } : {}),
              allowed_for_store: finalAllowedForStore,
            })
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("brand_permission_config")
            .insert({
              brand_id: activeBrandId,
              permission_key: permKey,
              allowed_for_brand: newAllowedForBrand,
              allowed_for_store: finalAllowedForStore,
            });
          if (error) throw error;
        }
      }

      setLocalChanges({});
      qc.invalidateQueries({ queryKey: ["brand-permission-config", activeBrandId] });
      toast.success("Permissões salvas com sucesso!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Initialize all permissions for a brand (ROOT only)
  const initAllPerms = async () => {
    if (!activeBrandId || !permissions) return;
    setSaving(true);
    try {
      const existing = new Set(configs?.map((c) => c.permission_key) || []);
      const toInsert = permissions
        .filter((p) => !existing.has(p.key))
        .map((p) => ({
          brand_id: activeBrandId,
          permission_key: p.key,
          allowed_for_brand: true,
          allowed_for_store: false,
        }));
      if (toInsert.length > 0) {
        const { error } = await supabase.from("brand_permission_config").insert(toInsert);
        if (error) throw error;
      }
      qc.invalidateQueries({ queryKey: ["brand-permission-config", activeBrandId] });
      toast.success(`${toInsert.length} permissões inicializadas!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = Object.keys(localChanges).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isRoot ? "Permissões por Empresa" : "Permissões dos Parceiros"}
          </h2>
          <p className="text-muted-foreground">
            {isRoot
              ? "Configure quais permissões cada empreendedor pode usar"
              : "Configure quais permissões os parceiros (lojas) podem usar"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isRoot && activeBrandId && (
            <Button variant="outline" size="sm" onClick={initAllPerms} disabled={saving}>
              Inicializar Todas
            </Button>
          )}
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
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-medium">Domo de Ferro</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className={`flex items-center gap-1.5 ${mode === "root-to-brand" ? "text-primary font-semibold" : ""}`}>
              <Building2 className="h-4 w-4" />
              <span>Empreendedor</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className={`flex items-center gap-1.5 ${mode === "brand-to-store" ? "text-primary font-semibold" : ""}`}>
              <Store className="h-4 w-4" />
              <span>Parceiro</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand selector (ROOT only) */}
      {isRoot && (
        <Select value={selectedBrandId} onValueChange={(v) => { setSelectedBrandId(v); setLocalChanges({}); }}>
          <SelectTrigger className="w-full max-w-sm">
            <SelectValue placeholder="Selecione uma empresa..." />
          </SelectTrigger>
          <SelectContent>
            {brands?.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name} <span className="text-muted-foreground ml-1">({b.slug})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {!activeBrandId && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {isRoot ? "Selecione uma empresa para configurar suas permissões." : "Carregando..."}
          </CardContent>
        </Card>
      )}

      {activeBrandId && (permsLoading || configLoading) && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      )}

      {/* Permission modules */}
      {activeBrandId && !permsLoading && !configLoading && (
        <div className="space-y-4">
          {Object.entries(modules).map(([mod, perms]) => (
            <Card key={mod}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Badge variant="outline">{friendlyModule(mod)}</Badge>
                  <span className="text-muted-foreground font-normal">
                    {perms.length} {perms.length > 1 ? "permissões" : "permissão"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {perms.map((perm) => {
                    const brandAllowed = getEffectiveValue(perm.key, "allowed_for_brand");
                    const storeAllowed = getEffectiveValue(perm.key, "allowed_for_store");
                    const hasLocalChange = localChanges[perm.key] !== undefined;
                    const display = getPermissionDisplay(perm);

                    return (
                      <div
                        key={perm.id}
                        className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${hasLocalChange ? "border-primary/50 bg-primary/5" : ""}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{display.title}</span>
                            {hasLocalChange && <Badge variant="secondary" className="text-[10px]">modificado</Badge>}
                          </div>
                          {display.subtitle && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{display.subtitle}</p>
                          )}

                        </div>
                        <div className="flex items-center gap-6 ml-4">
                          {isRoot && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">Empreendedor</span>
                              <Switch
                                checked={brandAllowed}
                                onCheckedChange={(v) => togglePermission(perm.key, "allowed_for_brand", v)}
                              />
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">Parceiro</span>
                            <Switch
                              checked={storeAllowed}
                              disabled={!brandAllowed}
                              onCheckedChange={(v) => togglePermission(perm.key, "allowed_for_store", v)}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
