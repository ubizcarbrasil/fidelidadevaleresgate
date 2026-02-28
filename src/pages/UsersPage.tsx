import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ROLE_LABELS: Record<AppRole, string> = {
  root_admin: "Root Admin",
  tenant_admin: "Tenant Admin",
  brand_admin: "Brand Admin",
  branch_admin: "Branch Admin",
  branch_operator: "Branch Operator",
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("tenant_admin");
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");

  const { data: profiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: userRoles } = useQuery({
    queryKey: ["user-roles-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*, tenants(name), brands(name), branches(name)")
        .order("created_at", { ascending: false });
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
    queryKey: ["brands-select"],
    queryFn: async () => {
      const { data } = await supabase.from("brands").select("id, name").order("name");
      return data || [];
    },
  });

  const { data: branches } = useQuery({
    queryKey: ["branches-select"],
    queryFn: async () => {
      const { data } = await supabase.from("branches").select("id, name").order("name");
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

  const needsScope = (role: AppRole) => role !== "root_admin";

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
            <DialogHeader>
              <DialogTitle>Atribuir Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Usuário</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {profiles?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.email || p.full_name || p.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {needsScope(selectedRole) && selectedRole === "tenant_admin" && (
                <div className="space-y-2">
                  <Label>Tenant</Label>
                  <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {tenants?.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {selectedRole === "brand_admin" && (
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {brands?.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {(selectedRole === "branch_admin" || selectedRole === "branch_operator") && (
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {branches?.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={() => addRole.mutate()} disabled={!selectedUserId} className="w-full">
                Atribuir
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usuários Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles?.length === 0 && (
                  <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">Nenhum usuário</TableCell></TableRow>
                )}
                {profiles?.map((p) => (
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
          <CardHeader>
            <CardTitle className="text-base">Roles Atribuídas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Escopo</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRoles?.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Nenhuma role atribuída</TableCell></TableRow>
                )}
                {userRoles?.map((r) => (
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
