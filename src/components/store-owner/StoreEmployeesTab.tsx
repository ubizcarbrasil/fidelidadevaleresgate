import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Employee {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function StoreEmployeesTab({ store }: { store: any }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "operator" });

  const fetchEmployees = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("store_employees")
      .select("id, name, email, phone, role, is_active, created_at")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });
    setEmployees((data as Employee[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchEmployees(); }, [store.id]);

  const handleAdd = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    const { error } = await supabase.from("store_employees").insert({
      store_id: store.id,
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      role: form.role,
    } as any);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Funcionário adicionado!");
    setForm({ name: "", email: "", phone: "", role: "operator" });
    setDialogOpen(false);
    fetchEmployees();
  };

  const toggleActive = async (emp: Employee) => {
    await supabase.from("store_employees").update({ is_active: !emp.is_active } as any).eq("id", emp.id);
    fetchEmployees();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("store_employees").delete().eq("id", id);
    toast.success("Funcionário removido");
    fetchEmployees();
  };

  const roleLabel = (r: string) => r === "manager" ? "Gerente" : "Operador";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Funcionários</h1>
          <p className="text-sm text-muted-foreground">Gerencie os operadores da sua loja</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Adicionar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Funcionário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Nome *</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nome completo" />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@exemplo.com" />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="(11) 99999-9999" />
              </div>
              <div>
                <Label>Função</Label>
                <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operator">Operador</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAdd} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Adicionar Funcionário
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : employees.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Nenhum funcionário cadastrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {employees.map(emp => (
            <Card key={emp.id} className="rounded-xl">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{emp.name}</p>
                  <div className="flex gap-2 mt-1 items-center">
                    <Badge variant="outline" className="text-[10px]">{roleLabel(emp.role)}</Badge>
                    {emp.email && <span className="text-xs text-muted-foreground">{emp.email}</span>}
                    {emp.phone && <span className="text-xs text-muted-foreground">{emp.phone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{emp.is_active ? "Ativo" : "Inativo"}</span>
                    <Switch checked={emp.is_active} onCheckedChange={() => toggleActive(emp)} />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(emp.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
