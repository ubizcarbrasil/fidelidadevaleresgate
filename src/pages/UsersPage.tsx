import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Shield, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS } from "@/hooks/usePermissions";
import UserPermissionsDialog from "@/components/UserPermissionsDialog";

type AppRole = Database["public"]["Enums"]["app_role"];

const ALL_ROLES: AppRole[] = ["root_admin","tenant_admin","brand_admin","branch_admin","branch_operator","operator_pdv","store_admin","customer"];

const ALLOWED_ROLES_BY_LEVEL: Record<string, AppRole[]> = {
  root_admin: ALL_ROLES,
  tenant_admin: ["brand_admin","branch_admin","branch_operator","operator_pdv","store_admin","customer"],
  brand_admin: ["branch_admin","branch_operator","operator_pdv"],
  branch_admin: ["branch_operator","operator_pdv"],
};

const BRAND_ASSIGNABLE_ROLES: AppRole[] = ["branch_admin","branch_operator","operator_pdv"];

function getUserLevel(isRoot: boolean, roles: { role: AppRole }[]): string {
  if (isRoot) return "root_admin";
  if (roles.some(r => r.role === "tenant_admin")) return "tenant_admin";
  if (roles.some(r => r.role === "brand_admin")) return "brand_admin";
  if (roles.some(r => r.role === "branch_admin")) return "branch_admin";
  return "branch_admin";
}

/* ─── Brand Admin View ─── */
function BrandUsersView({ brandId }: { brandId: string }) {
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [permDialogUserId, setPermDialogUserId] = useState<string | null>(null);
  const [permDialogName, setPermDialogName] = useState("");

  // Invite form state
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("branch_operator");
  const [inviteBranchId, setInviteBranchId] = useState("");

  const { data: branches } = useQuery({
    queryKey: ["branches-select", brandId],
    queryFn: async () => {
      const { data } = await supabase.from("branches").select("id, name").eq("brand_id", brandId).order("name");
      return data || [];
    },
  });

  const { data: brandUsers, isLoading } = useQuery({
    queryKey: ["brand-team", brandId],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("id, user_id, role, branch_id, branches(name)")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!roles || roles.length === 0) return [];

      const userIds = [...new Set(roles.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      // Get override counts
      const { data: overrides } = await supabase
        .from("user_permission_overrides")
        .select("user_id, permission_key")
        .eq("scope_type", "BRAND")
        .eq("scope_id", brandId)
        .eq("is_allowed", true);

      const overrideCounts = new Map<string, number>();
      (overrides || []).forEach(o => {
        overrideCounts.set(o.user_id, (overrideCounts.get(o.user_id) || 0) + 1);
      });

      return roles.map(r => ({
        ...r,
        profile: profileMap.get(r.user_id),
        permissionCount: overrideCounts.get(r.user_id) || 0,
      }));
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("invite-brand-user", {
        body: {
          email,
          full_name: fullName,
          role: inviteRole,
          brand_id: brandId,
          branch_id: inviteBranchId || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-team", brandId] });
      toast.success("Usuário convidado com sucesso!");
      setInviteOpen(false);
      setEmail("");
      setFullName("");
      setInviteBranchId("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeRole = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-team", brandId] });
      toast.success("Acesso removido!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Equipe & Acessos</h2>
          <p className="text-muted-foreground">Gerencie os usuários e suas permissões</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4 mr-2" />Convidar Usuário</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nome completo" />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label>Função</Label>
                <Select value={inviteRole} onValueChange={v => setInviteRole(v as AppRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BRAND_ASSIGNABLE_ROLES.map(r => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(inviteRole === "branch_admin" || inviteRole === "branch_operator" || inviteRole === "operator_pdv") && (
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Select value={inviteBranchId} onValueChange={setInviteBranchId}>
                    <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                    <SelectContent>
                      {branches?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button
                onClick={() => inviteMutation.mutate()}
                disabled={!email || inviteMutation.isPending}
                className="w-full"
              >
                {inviteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Enviar Convite
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !brandUsers?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum membro na equipe ainda. Convide o primeiro usuário!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {brandUsers.map(u => (
            <Card key={u.id}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{u.profile?.full_name || "Sem nome"}</p>
                    <p className="text-sm text-muted-foreground truncate">{u.profile?.email || "—"}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 ml-2">
                    {ROLE_LABELS[u.role as AppRole] || u.role}
                  </Badge>
                </div>
                {(u.branches as any)?.name && (
                  <p className="text-xs text-muted-foreground">Cidade: {(u.branches as any).name}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {u.permissionCount} permissão(ões)
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPermDialogUserId(u.user_id);
                        setPermDialogName(u.profile?.full_name || u.profile?.email || "Usuário");
                      }}
                    >
                      <Shield className="h-3.5 w-3.5 mr-1" />
                      Permissões
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeRole.mutate(u.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {permDialogUserId && (
        <UserPermissionsDialog
          open={!!permDialogUserId}
          onOpenChange={open => { if (!open) setPermDialogUserId(null); }}
          userId={permDialogUserId}
          brandId={brandId}
          userName={permDialogName}
        />
      )}
    </div>
  );
}

/* ─── Root Admin View (original) ─── */
function RootUsersView() {
  const queryClient = useQueryClient();
  const { currentBrandId, isRootAdmin } = useBrandGuard();
  const { roles: authRoles } = useAuth();
  const userLevel = getUserLevel(isRootAdmin, authRoles);
  const allowedRoles = ALLOWED_ROLES_BY_LEVEL[userLevel] || [];

  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>(allowedRoles[0] || "branch_admin");
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");

  const { data: profiles } = useQuery({
    queryKey: ["profiles", currentBrandId, isRootAdmin],
    queryFn: async () => {
      if (isRootAdmin) {
        const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        return data;
      }
      if (!currentBrandId) return [];
      const { data: brandRoles, error: rolesErr } = await supabase
        .from("user_roles").select("user_id").eq("brand_id", currentBrandId);
      if (rolesErr) throw rolesErr;
      const userIds = [...new Set((brandRoles || []).map(r => r.user_id))];
      if (userIds.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles").select("*").in("id", userIds).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: userRoles } = useQuery({
    queryKey: ["user-roles-all", currentBrandId],
    queryFn: async () => {
      let q = supabase
        .from("user_roles")
        .select("*, tenants(name), brands(name), branches(name)")
        .order("created_at", { ascending: false });
      if (!isRootAdmin && currentBrandId) q = q.eq("brand_id", currentBrandId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const { data: tenants } = useQuery({
    queryKey: ["tenants-select"],
    queryFn: async () => {
      const { data } = await supabase.from("tenants").select("id, name").order("name");
      return data || [];
    },
  });

  const { data: brands } = useQuery({
    queryKey: ["brands-select", currentBrandId],
    queryFn: async () => {
      let q = supabase.from("brands").select("id, name").order("name");
      if (!isRootAdmin && currentBrandId) q = q.eq("id", currentBrandId);
      const { data } = await q;
      return data || [];
    },
  });

  const { data: branches } = useQuery({
    queryKey: ["branches-select", currentBrandId],
    queryFn: async () => {
      let q = supabase.from("branches").select("id, name").order("name");
      if (!isRootAdmin && currentBrandId) q = q.eq("brand_id", currentBrandId);
      const { data } = await q;
      return data || [];
    },
  });

  const addRole = useMutation({
    mutationFn: async () => {
      const payload: any = { user_id: selectedUserId, role: selectedRole };
      if (selectedRole === "tenant_admin") payload.tenant_id = selectedTenantId || null;
      if (selectedRole === "brand_admin") payload.brand_id = selectedBrandId || null;
      if (selectedRole === "branch_admin" || selectedRole === "branch_operator") payload.branch_id = selectedBranchId || null;
      const { error } = await supabase.from("user_roles").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles-all"] });
      toast.success("Role atribuída!");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeRole = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles-all"] });
      toast.success("Role removida!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Usuários & Roles</h2>
          <p className="text-muted-foreground">Gerencie permissões dos usuários</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Atribuir Role</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Atribuir Role</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Usuário</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {profiles?.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.email || p.full_name || p.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Papel</Label>
                <Select value={selectedRole} onValueChange={v => setSelectedRole(v as AppRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS)
                      .filter(([k]) => allowedRoles.includes(k as AppRole))
                      .map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isRootAdmin && selectedRole === "tenant_admin" && (
                <div className="space-y-2">
                  <Label>Organização</Label>
                  <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {tenants?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {isRootAdmin && selectedRole === "brand_admin" && (
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {brands?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {(selectedRole === "branch_admin" || selectedRole === "branch_operator") && (
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {branches?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={() => addRole.mutate()} disabled={!selectedUserId} className="w-full">Atribuir</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Usuários Cadastrados</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>E-mail</TableHead><TableHead>Nome</TableHead></TableRow></TableHeader>
              <TableBody>
                {profiles?.length === 0 && (
                  <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">Nenhum usuário</TableCell></TableRow>
                )}
                {profiles?.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{p.email || "—"}</TableCell>
                    <TableCell>{p.full_name || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Papéis Atribuídos</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Papel</TableHead><TableHead>Escopo</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader>
              <TableBody>
                {userRoles?.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Nenhum papel atribuído</TableCell></TableRow>
                )}
                {userRoles?.map(r => (
                  <TableRow key={r.id}>
                    <TableCell><Badge variant="secondary">{ROLE_LABELS[r.role as AppRole]}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(r.tenants as any)?.name || (r.brands as any)?.name || (r.branches as any)?.name || "Global"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => removeRole.mutate(r.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ─── Page Router ─── */
export default function UsersPage() {
  const { currentBrandId, isRootAdmin } = useBrandGuard();
  const { roles: authRoles } = useAuth();
  const isBrandAdmin = !isRootAdmin && authRoles.some(r => r.role === "brand_admin");

  if (isBrandAdmin && currentBrandId) {
    return <BrandUsersView brandId={currentBrandId} />;
  }

  return <RootUsersView />;
}
