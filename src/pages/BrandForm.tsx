import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Key, Trash2, Save, Car, Users, RefreshCw } from "lucide-react";
import BrandThemeEditor from "@/components/BrandThemeEditor";
import BrandSectionsManager from "@/components/BrandSectionsManager";
import type { BrandTheme } from "@/hooks/useBrandTheme";
import type { OfferCardConfig } from "@/hooks/useOfferCardConfig";
import { DEFAULT_CONFIG } from "@/hooks/useOfferCardConfig";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useBrandModules } from "@/hooks/useBrandModules";

export default function BrandForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;
  const { isRootAdmin } = useBrandGuard();
  const { isModuleEnabled } = useBrandModules();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const [theme, setTheme] = useState<BrandTheme>({});
  const [offerCardConfig, setOfferCardConfig] = useState<OfferCardConfig>(DEFAULT_CONFIG);
  const [defaultScoringModel, setDefaultScoringModel] = useState("BOTH");
  const [loading, setLoading] = useState(false);

  // Password reset state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [brandAdminUserId, setBrandAdminUserId] = useState<string | null>(null);

  // Delete state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Modules state
  const [modules, setModules] = useState<any[]>([]);
  const [moduleDefs, setModuleDefs] = useState<any[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);

  const { data: tenants } = useQuery({
    queryKey: ["tenants-select"],
    queryFn: async () => {
      const { data } = await supabase.from("tenants").select("id, name").eq("is_active", true).order("name");
      return data || [];
    },
    enabled: isRootAdmin,
  });

  // Load brand data
  useEffect(() => {
    if (isEdit) {
      supabase.from("brands").select("*").eq("id", id).single().then(({ data, error }) => {
        if (error) { toast.error("Brand não encontrada"); navigate("/brands"); return; }
        setName(data.name);
        setSlug(data.slug);
        setTenantId(data.tenant_id);
        setIsActive(data.is_active);
        setSubscriptionPlan(data.subscription_plan || "free");
        if (data.brand_settings_json && typeof data.brand_settings_json === "object" && !Array.isArray(data.brand_settings_json)) {
          const settings = data.brand_settings_json as Record<string, any>;
          const { offer_card_config: occ, default_scoring_model: dsm, ...themeData } = settings;
          setTheme(themeData as unknown as BrandTheme);
          if (dsm) setDefaultScoringModel(dsm);
          if (occ) {
            setOfferCardConfig({
              store: { ...DEFAULT_CONFIG.store, ...(occ.store || {}) },
              product: { ...DEFAULT_CONFIG.product, ...(occ.product || {}) },
              emitter: { ...DEFAULT_CONFIG.emitter, ...(occ.emitter || {}) },
            });
          }
        }
      });

      // Load brand admin user
      supabase.from("user_roles").select("user_id").eq("brand_id", id).eq("role", "brand_admin").limit(1).then(({ data }) => {
        setBrandAdminUserId(data?.[0]?.user_id || null);
      });

      // Load modules
      loadModules();
    }
  }, [id, isEdit, navigate]);

  const loadModules = async () => {
    if (!id) return;
    setModulesLoading(true);
    const [{ data: defs }, { data: bm }] = await Promise.all([
      supabase.from("module_definitions").select("*").order("name"),
      supabase.from("brand_modules").select("*").eq("brand_id", id),
    ]);
    setModuleDefs(defs || []);
    setModules(bm || []);
    setModulesLoading(false);
  };

  const invokeAdminAction = async (body: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke("admin-brand-actions", {
      body,
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (res.error) throw new Error(res.error.message || "Erro na operação");
    if (res.data?.error) throw new Error(res.data.error);
    return res.data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRootAdmin && !tenantId) { toast.error("Selecione um tenant"); return; }
    setLoading(true);
    const cleanTheme = JSON.parse(JSON.stringify(theme, (_, v) => (v === "" || v === undefined ? undefined : v)));
    const mergedSettings = { ...(Object.keys(cleanTheme).length > 0 ? cleanTheme : {}), offer_card_config: offerCardConfig };
    const basePayload = { name, brand_settings_json: mergedSettings };

    const { error } = isEdit
      ? await supabase.from("brands").update({
          ...basePayload,
          ...(isRootAdmin ? { slug, tenant_id: tenantId, is_active: isActive, subscription_plan: subscriptionPlan } : {}),
        }).eq("id", id!)
      : await supabase.from("brands").insert([{ ...basePayload, slug, tenant_id: tenantId, is_active: isActive, subscription_plan: subscriptionPlan }]);

    if (error) toast.error(error.message);
    else { toast.success(isEdit ? "Marca atualizada!" : "Marca criada!"); if (isRootAdmin && !isEdit) navigate("/brands"); }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!brandAdminUserId) { toast.error("Nenhum admin encontrado"); return; }
    if (newPassword.length < 6) { toast.error("Senha mínima de 6 caracteres"); return; }
    if (newPassword !== confirmPassword) { toast.error("As senhas não coincidem"); return; }
    setPasswordLoading(true);
    try {
      await invokeAdminAction({ action: "reset_password", user_id: brandAdminUserId, new_password: newPassword });
      toast.success("Senha redefinida com sucesso!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteBrand = async () => {
    if (deleteConfirmName !== name) return;
    setDeleteLoading(true);
    try {
      await invokeAdminAction({ action: "delete_brand", brand_id: id });
      toast.success("Marca excluída permanentemente!");
      navigate("/brands");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleModule = async (defId: string, currentEnabled: boolean) => {
    if (!id) return;
    const existing = modules.find(m => m.module_definition_id === defId);
    if (existing) {
      await supabase.from("brand_modules").update({ is_enabled: !currentEnabled }).eq("id", existing.id);
    } else {
      await supabase.from("brand_modules").insert({ brand_id: id, module_definition_id: defId, is_enabled: true });
    }
    loadModules();
    toast.success("Módulo atualizado!");
  };

  const tabFromUrl = searchParams.get("tab");
  const defaultTab = tabFromUrl && ["general", "theme", "sections", "modules", "admin"].includes(tabFromUrl)
    ? tabFromUrl
    : (!isRootAdmin && isEdit ? "theme" : "general");

  return (
    <div className="space-y-6 max-w-5xl">
      {isRootAdmin && (
        <Button variant="ghost" onClick={() => navigate("/brands")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />Voltar
        </Button>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue={defaultTab}>
          <TabsList className="flex-wrap">
            {isRootAdmin && <TabsTrigger value="general">Geral</TabsTrigger>}
            <TabsTrigger value="theme">Tema Visual</TabsTrigger>
            {isEdit && <TabsTrigger value="sections">Seções da Home</TabsTrigger>}
            {isEdit && isRootAdmin && <TabsTrigger value="modules">Módulos</TabsTrigger>}
            {isEdit && isRootAdmin && <TabsTrigger value="admin">Administração</TabsTrigger>}
          </TabsList>

          {isRootAdmin && (
            <TabsContent value="general" className="mt-4">
              <Card>
                <CardHeader><CardTitle>{isEdit ? "Editar Marca" : "Nova Marca"}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Organização</Label>
                    <Select value={tenantId} onValueChange={setTenantId}>
                      <SelectTrigger><SelectValue placeholder="Selecione uma organização" /></SelectTrigger>
                      <SelectContent>
                        {tenants?.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Identificador</Label>
                      <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} required />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Plano</Label>
                      <Select value={subscriptionPlan} onValueChange={setSubscriptionPlan}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="starter">Starter</SelectItem>
                          <SelectItem value="profissional">Profissional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Ativo</Label>
                      <div className="pt-2"><Switch checked={isActive} onCheckedChange={setIsActive} /></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="theme" className="mt-4">
            {!isRootAdmin && (
              <Card className="mb-4">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <Label>Nome da Marca</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                </CardContent>
              </Card>
            )}
            <BrandThemeEditor value={theme} onChange={setTheme} brandId={id} brandName={name} offerCardConfig={offerCardConfig} onOfferCardConfigChange={setOfferCardConfig} isModuleEnabled={isModuleEnabled} />
          </TabsContent>

          {isEdit && id && (
            <TabsContent value="sections" className="mt-4">
              <BrandSectionsManager brandId={id} subscriptionPlan={subscriptionPlan} />
            </TabsContent>
          )}

          {/* Modules tab */}
          {isEdit && isRootAdmin && (
            <TabsContent value="modules" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Funcionalidades</CardTitle>
                  <CardDescription>Ative ou desative módulos para esta marca</CardDescription>
                </CardHeader>
                <CardContent>
                  {modulesLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : (
                    <div className="space-y-3">
                      {moduleDefs.map(def => {
                        const bm = modules.find(m => m.module_definition_id === def.id);
                        const isEnabled = bm?.is_enabled ?? false;
                        const isCore = def.is_core;
                        return (
                          <div key={def.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={isCore || isEnabled}
                                disabled={isCore}
                                onCheckedChange={() => handleToggleModule(def.id, isEnabled)}
                              />
                              <div>
                                <span className="font-medium">{def.name}</span>
                                {isCore && <Badge variant="secondary" className="ml-2 text-xs">Core</Badge>}
                              </div>
                            </div>
                            <Badge variant={isCore || isEnabled ? "default" : "outline"}>
                              {isCore || isEnabled ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Admin tab */}
          {isEdit && isRootAdmin && (
            <TabsContent value="admin" className="mt-4 space-y-6">
              {/* Password reset */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" />Redefinir Senha do Admin</CardTitle>
                  <CardDescription>
                    {brandAdminUserId
                      ? "Defina uma nova senha para o administrador desta marca."
                      : "Nenhum administrador vinculado a esta marca."}
                  </CardDescription>
                </CardHeader>
                {brandAdminUserId && (
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Nova senha</Label>
                        <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
                      </div>
                      <div className="space-y-2">
                        <Label>Confirmar senha</Label>
                        <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a senha" />
                      </div>
                    </div>
                    <Button type="button" onClick={handleResetPassword} disabled={passwordLoading || !newPassword || !confirmPassword}>
                      {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
                      Redefinir Senha
                    </Button>
                  </CardContent>
                )}
              </Card>

              {/* Danger zone */}
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive"><Trash2 className="h-5 w-5" />Zona de Perigo</CardTitle>
                  <CardDescription>Ações irreversíveis para esta marca.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button type="button" variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="h-4 w-4 mr-2" />Excluir Marca Permanentemente
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {loading ? "Salvando..." : "Salvar"}
          </Button>
          {isRootAdmin && <Button type="button" variant="outline" onClick={() => navigate("/brands")}>Cancelar</Button>}
        </div>
      </form>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir marca permanentemente</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Todos os dados da marca <strong>{name}</strong> serão excluídos, incluindo filiais, lojas, ofertas e clientes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label>Digite <strong>{name}</strong> para confirmar:</Label>
            <Input value={deleteConfirmName} onChange={e => setDeleteConfirmName(e.target.value)} placeholder="Nome da marca" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmName("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBrand}
              disabled={deleteConfirmName !== name || deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? "Excluindo..." : "Excluir Permanentemente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
