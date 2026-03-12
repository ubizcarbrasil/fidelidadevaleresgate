import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";

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

const ROLE_LABELS: Record<string, string> = {
  root: "Administrador Geral",
  tenant_admin: "Admin Tenant",
  brand_admin: "Admin da Marca",
  branch_admin: "Admin da Cidade",
  operator: "Operador",
  store_owner: "Dono de Loja",
  customer: "Cliente",
};

function friendlyModule(mod: string): string {
  return MODULE_LABELS[mod] || mod.charAt(0).toUpperCase() + mod.slice(1);
}

function friendlyPermission(key: string): string {
  const parts = key.split(".");
  if (parts.length >= 2) {
    const mod = friendlyModule(parts[0]);
    const action = ACTION_LABELS[parts[parts.length - 1]] || parts[parts.length - 1];
    return `${action} ${mod}`;
  }
  return key.replace(/\./g, " › ").replace(/^\w/, c => c.toUpperCase());
}

function friendlyRole(name: string): string {
  return ROLE_LABELS[name] || name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, " ");
}

interface PermForm { key: string; module: string; description: string }
const emptyForm: PermForm = { key: "", module: "", description: "" };

export default function PermissionsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PermForm>(emptyForm);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const { data: permissions, isLoading } = useQuery({
    queryKey: ["permissions-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("permissions").select("*").order("module, key");
      if (error) throw error;
      return data;
    },
  });

  const { data: roles } = useQuery({
    queryKey: ["roles-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("roles").select("*, role_permissions(permission_id)").order("name");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = { key: form.key, module: form.module, description: form.description || null };
      if (editId) {
        const { error } = await supabase.from("permissions").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("permissions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["permissions-all"] }); toast.success("Permissão salva!"); closeDialog(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("permissions").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["permissions-all"] }); toast.success("Permissão removida!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleRolePerm = useMutation({
    mutationFn: async ({ roleId, permissionId, has }: { roleId: string; permissionId: string; has: boolean }) => {
      if (has) {
        const { error } = await supabase.from("role_permissions").delete().eq("role_id", roleId).eq("permission_id", permissionId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("role_permissions").insert({ role_id: roleId, permission_id: permissionId });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["roles-all"] }); toast.success("Atualizado!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (p: any) => { setEditId(p.id); setForm({ key: p.key, module: p.module, description: p.description || "" }); setOpen(true); };

  const modules = permissions?.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {} as Record<string, typeof permissions>) || {};

  const activeRole = roles?.find(r => r.id === selectedRole);
  const activeRolePermIds = new Set((activeRole?.role_permissions as any[])?.map((rp: any) => rp.permission_id) || []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Permissões & Roles</h2>
          <p className="text-muted-foreground">Gerencie permissões da plataforma e vincule a roles</p>
        </div>
        <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nova Permissão</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Editar Permissão" : "Nova Permissão"}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Módulo</Label><Input value={form.module} onChange={e => setForm(f => ({ ...f, module: e.target.value }))} placeholder="stores" /></div>
                <div className="space-y-2"><Label>Key</Label><Input value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))} placeholder="stores.create" /></div>
              </div>
              <div className="space-y-2"><Label>Descrição</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <Button onClick={() => save.mutate()} disabled={!form.key || !form.module} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Roles list */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Shield className="h-4 w-4" /> Roles</h3>
            <div className="space-y-2">
              {roles?.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRole(r.id === selectedRole ? null : r.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${r.id === selectedRole ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                >
                  <div>
                    <span className="font-medium text-sm">{r.name}</span>
                    {r.is_system && <Badge variant="outline" className="ml-2 text-xs">System</Badge>}
                    {r.description && <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>}
                  </div>
                  <Badge variant="secondary" className="text-xs">{(r.role_permissions as any[])?.length || 0}</Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Permissions table with role toggle */}
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Descrição</TableHead>
                  {selectedRole && <TableHead className="text-center w-20">Ativo</TableHead>}
                  <TableHead className="text-right w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={selectedRole ? 5 : 4} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>}
                {Object.entries(modules).map(([mod, perms]) =>
                  perms!.map((p, i) => (
                    <TableRow key={p.id}>
                      {i === 0 && <TableCell rowSpan={perms!.length} className="align-top font-medium"><Badge>{mod}</Badge></TableCell>}
                      <TableCell className="font-mono text-xs">{p.key}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.description || "—"}</TableCell>
                      {selectedRole && (
                        <TableCell className="text-center">
                          <Checkbox
                            checked={activeRolePermIds.has(p.id)}
                            onCheckedChange={() => toggleRolePerm.mutate({ roleId: selectedRole, permissionId: p.id, has: activeRolePermIds.has(p.id) })}
                          />
                        </TableCell>
                      )}
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => remove.mutate(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
