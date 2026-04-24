import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Power, MoreHorizontal, Trash2, Key, ArrowUpDown, Blocks, RefreshCw, Eye, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { DataTableControls } from "@/components/DataTableControls";
import { useDebounce } from "@/hooks/useDebounce";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { TelaCarregamentoInline } from "@/compartilhados/components/tela_carregamento";

const PAGE_SIZE = 20;

const LEGACY_PLAN_OPTIONS = [
  { key: "free", label: "Free" },
  { key: "starter", label: "Starter" },
  { key: "profissional", label: "Profissional" },
];
const LEGACY_PLAN_KEYS = new Set(LEGACY_PLAN_OPTIONS.map((p) => p.key));

const STATUS_OPTIONS = [
  { key: "ACTIVE", label: "Ativo" },
  { key: "TRIAL", label: "Trial" },
  { key: "EXPIRED", label: "Expirado" },
];

export default function Brands() {
  const { isRootAdmin, currentBrandId } = useBrandGuard();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isRootAdmin && currentBrandId) {
      navigate(`/brands/${currentBrandId}`, { replace: true });
    }
  }, [isRootAdmin, currentBrandId, navigate]);

  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  // Dialogs state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [passwordTarget, setPasswordTarget] = useState<{ brandId: string; brandName: string; userId: string | null } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [renewTarget, setRenewTarget] = useState<{ id: string; name: string; currentStatus: string } | null>(null);
  const [renewStatus, setRenewStatus] = useState("ACTIVE");
  const [renewTrialDays, setRenewTrialDays] = useState("14");
  const [actionLoading, setActionLoading] = useState(false);
  const [planChangeTarget, setPlanChangeTarget] = useState<{
    brandId: string;
    brandName: string;
    planKey: string;
    planLabel: string;
  } | null>(null);

  // Produtos comerciais ativos (subscription_plans)
  const { data: commercialProducts } = useQuery({
    queryKey: ["commercial-products-for-assignment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("plan_key, product_name, label, is_active")
        .eq("is_active", true)
        .order("product_name");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const commercialProductOptions = (commercialProducts ?? [])
    .filter((p: any) => !LEGACY_PLAN_KEYS.has(p.plan_key))
    .map((p: any) => ({
      key: p.plan_key as string,
      label: (p.product_name || p.label || p.plan_key) as string,
    }));

  const { data, isLoading } = useQuery({
    queryKey: ["brands", debouncedSearch, page],
    queryFn: async () => {
      let query = supabase.from("brands").select("*, tenants(name)", { count: "exact" });
      if (debouncedSearch) query = query.or(`name.ilike.%${debouncedSearch}%,slug.ilike.%${debouncedSearch}%`);
      query = query.order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: data, count: count ?? 0 };
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("brands").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["brands"] }); toast.success("Status atualizado!"); },
    onError: (e: Error) => toast.error(e.message),
  });

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

  const handleChangePlan = async (brandId: string, plan: string) => {
    try {
      setActionLoading(true);
      await invokeAdminAction({ action: "change_plan", brand_id: brandId, plan });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success(`Plano alterado para ${plan}!`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBrand = async () => {
    if (!deleteTarget || deleteConfirmName !== deleteTarget.name) return;
    try {
      setActionLoading(true);
      await invokeAdminAction({ action: "delete_brand", brand_id: deleteTarget.id });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Marca excluída permanentemente!");
      setDeleteTarget(null);
      setDeleteConfirmName("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!passwordTarget?.userId) return;
    if (newPassword.length < 6) { toast.error("Senha mínima de 6 caracteres"); return; }
    if (newPassword !== confirmPassword) { toast.error("As senhas não coincidem"); return; }
    try {
      setActionLoading(true);
      await invokeAdminAction({ action: "reset_password", user_id: passwordTarget.userId, new_password: newPassword });
      toast.success("Senha redefinida com sucesso!");
      setPasswordTarget(null);
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenewSubscription = async () => {
    if (!renewTarget) return;
    try {
      setActionLoading(true);
      await invokeAdminAction({
        action: "renew_subscription",
        brand_id: renewTarget.id,
        new_status: renewStatus,
        trial_days: renewStatus === "TRIAL" ? Number(renewTrialDays) : undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      queryClient.invalidateQueries({ queryKey: ["brand-trial-blocker", renewTarget.id] });
      queryClient.invalidateQueries({ queryKey: ["brand-trial-status", renewTarget.id] });
      const statusLabel = STATUS_OPTIONS.find(s => s.key === renewStatus)?.label || renewStatus;
      const trialMsg = renewStatus === "TRIAL" ? ` (${renewTrialDays} dias)` : "";
      toast.success(`Assinatura atualizada para ${statusLabel}${trialMsg}!`);
      setRenewTarget(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openPasswordDialog = async (brandId: string, brandName: string) => {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("brand_id", brandId)
      .eq("role", "brand_admin")
      .limit(1);
    const userId = roleData?.[0]?.user_id || null;
    if (!userId) {
      toast.error("Nenhum administrador encontrado para esta marca");
      return;
    }
    setPasswordTarget({ brandId, brandName, userId });
  };

  const planMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    free: { label: "Free", variant: "outline" },
    starter: { label: "Starter", variant: "secondary" },
    profissional: { label: "Profissional", variant: "default" },
  };

  const subStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    ACTIVE: { label: "Ativo", variant: "default" },
    TRIAL: { label: "Trial", variant: "secondary" },
    EXPIRED: { label: "Expirado", variant: "destructive" },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Marcas</h2>
          <p className="text-muted-foreground">Gerencie as marcas das organizações</p>
        </div>
        <Button asChild className="w-full sm:w-auto"><Link to="/brands/new"><Plus className="h-4 w-4 mr-2" />Nova Marca</Link></Button>
      </div>
      <DataTableControls search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} searchPlaceholder="Buscar por nome ou slug..." page={page} pageSize={PAGE_SIZE} totalCount={data?.count ?? 0} onPageChange={setPage} />
      <Card>
        <CardHeader><CardTitle className="text-base">Lista de Marcas</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <TelaCarregamentoInline /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Organização</TableHead>
                <TableHead>Identificador</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Assinatura</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.rows?.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma marca cadastrada</TableCell></TableRow>}
              {data?.rows?.map((b) => {
                const plan = planMap[b.subscription_plan] || { label: b.subscription_plan, variant: "outline" as const };
                const subStatus = subStatusMap[b.subscription_status] || { label: b.subscription_status, variant: "outline" as const };
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell className="text-muted-foreground">{(b.tenants as any)?.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{b.slug}</TableCell>
                    <TableCell><Badge variant={plan.variant}>{plan.label}</Badge></TableCell>
                    <TableCell><Badge variant={subStatus.variant}>{subStatus.label}</Badge></TableCell>
                    <TableCell><Badge variant={b.is_active ? "default" : "destructive"}>{b.is_active ? "Ativo" : "Inativo"}</Badge></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/brands/${b.id}`)}>
                            <Pencil className="h-4 w-4 mr-2" />Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/brands/${b.id}?tab=modules`)}>
                            <Blocks className="h-4 w-4 mr-2" />Gerenciar Módulos
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => window.open(`/?brandId=${b.id}`, "_blank", "noopener")}
                          >
                            <Eye className="h-4 w-4 mr-2" />Ver como esta marca
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/diagnostico-marca/${b.id}`)}>
                            <Stethoscope className="h-4 w-4 mr-2" />Diagnosticar marca
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openPasswordDialog(b.id, b.name)}>
                            <Key className="h-4 w-4 mr-2" />Redefinir Senha
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setRenewTarget({ id: b.id, name: b.name, currentStatus: b.subscription_status });
                            setRenewStatus(b.subscription_status === "EXPIRED" ? "ACTIVE" : b.subscription_status);
                          }}>
                            <RefreshCw className="h-4 w-4 mr-2" />Renovar Assinatura
                          </DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <ArrowUpDown className="h-4 w-4 mr-2" />Mudar Plano
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                                Planos Padrão
                              </div>
                              {LEGACY_PLAN_OPTIONS.map((p) => (
                                <DropdownMenuItem
                                  key={p.key}
                                  disabled={b.subscription_plan === p.key}
                                  onClick={() =>
                                    setPlanChangeTarget({
                                      brandId: b.id,
                                      brandName: b.name,
                                      planKey: p.key,
                                      planLabel: p.label,
                                    })
                                  }
                                >
                                  {p.label} {b.subscription_plan === p.key && "✓"}
                                </DropdownMenuItem>
                              ))}
                              {commercialProductOptions.length > 0 && (
                                <>
                                  <DropdownMenuSeparator />
                                  <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                                    Produtos Comerciais
                                  </div>
                                  {commercialProductOptions.map((p) => (
                                    <DropdownMenuItem
                                      key={p.key}
                                      disabled={b.subscription_plan === p.key}
                                      onClick={() =>
                                        setPlanChangeTarget({
                                          brandId: b.id,
                                          brandName: b.name,
                                          planKey: p.key,
                                          planLabel: p.label,
                                        })
                                      }
                                    >
                                      {p.label} {b.subscription_plan === p.key && "✓"}
                                    </DropdownMenuItem>
                                  ))}
                                </>
                              )}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuItem onClick={() => toggleActive.mutate({ id: b.id, is_active: !b.is_active })}>
                            <Power className="h-4 w-4 mr-2" />{b.is_active ? "Inativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget({ id: b.id, name: b.name })}>
                            <Trash2 className="h-4 w-4 mr-2" />Excluir Marca
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>)}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteConfirmName(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir marca permanentemente</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Todos os dados da marca <strong>{deleteTarget?.name}</strong> serão excluídos permanentemente, incluindo filiais, lojas, ofertas e clientes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label>Digite <strong>{deleteTarget?.name}</strong> para confirmar:</Label>
            <Input value={deleteConfirmName} onChange={e => setDeleteConfirmName(e.target.value)} placeholder="Nome da marca" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBrand}
              disabled={deleteConfirmName !== deleteTarget?.name || actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? "Excluindo..." : "Excluir Permanentemente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password reset dialog */}
      <AlertDialog open={!!passwordTarget} onOpenChange={(open) => { if (!open) { setPasswordTarget(null); setNewPassword(""); setConfirmPassword(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Redefinir Senha — {passwordTarget?.brandName}</AlertDialogTitle>
            <AlertDialogDescription>
              Defina uma nova senha para o administrador desta marca.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Nova senha</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="space-y-2">
              <Label>Confirmar senha</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a senha" />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPassword}
              disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 6 || actionLoading}
            >
              {actionLoading ? "Salvando..." : "Redefinir Senha"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Subscription renewal dialog */}
      <AlertDialog open={!!renewTarget} onOpenChange={(open) => { if (!open) setRenewTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Renovar Assinatura — {renewTarget?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              Status atual: <strong>{subStatusMap[renewTarget?.currentStatus || ""]?.label || renewTarget?.currentStatus}</strong>. Escolha o novo status da assinatura.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Novo status</Label>
              <Select value={renewStatus} onValueChange={setRenewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {renewStatus === "TRIAL" && (
              <div className="space-y-2">
                <Label>Dias de trial</Label>
                <Input type="number" min={1} max={365} value={renewTrialDays} onChange={e => setRenewTrialDays(e.target.value)} placeholder="14" />
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRenewSubscription} disabled={actionLoading}>
              {actionLoading ? "Salvando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Plan change confirmation dialog */}
      <AlertDialog
        open={!!planChangeTarget}
        onOpenChange={(open) => {
          if (!open) setPlanChangeTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atribuir produto à marca</AlertDialogTitle>
            <AlertDialogDescription>
              Atribuir o produto <strong>{planChangeTarget?.planLabel}</strong> à marca{" "}
              <strong>{planChangeTarget?.brandName}</strong>? Isso substitui o plano atual e altera os
              módulos e audiências disponíveis.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={actionLoading}
              onClick={async () => {
                if (!planChangeTarget) return;
                await handleChangePlan(planChangeTarget.brandId, planChangeTarget.planKey);
                setPlanChangeTarget(null);
              }}
            >
              {actionLoading ? "Aplicando..." : "Confirmar troca"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
