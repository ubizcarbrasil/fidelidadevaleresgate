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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ModForm {
  key: string;
  name: string;
  description: string;
  category: string;
  is_core: boolean;
  is_active: boolean;
}

const emptyForm: ModForm = { key: "", name: "", description: "", category: "general", is_core: false, is_active: true };

export default function ModuleDefinitionsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ModForm>(emptyForm);

  const { data: modules, isLoading } = useQuery({
    queryKey: ["module-definitions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("module_definitions").select("*").order("category, name");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        key: form.key,
        name: form.name,
        description: form.description || null,
        category: form.category,
        is_core: form.is_core,
        is_active: form.is_active,
      };
      if (editId) {
        const { error } = await supabase.from("module_definitions").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("module_definitions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["module-definitions"] }); toast.success("Módulo salvo!"); closeDialog(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("module_definitions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["module-definitions"] }); toast.success("Módulo removido!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (m: any) => {
    setEditId(m.id);
    setForm({ key: m.key, name: m.name, description: m.description || "", category: m.category, is_core: m.is_core, is_active: m.is_active });
    setOpen(true);
  };

  const grouped = modules?.reduce((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {} as Record<string, typeof modules>) || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Definições de Módulos</h2>
          <p className="text-muted-foreground">Catálogo de módulos da plataforma</p>
        </div>
        <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo Módulo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Editar Módulo" : "Novo Módulo"}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Key</Label><Input value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))} placeholder="stores" /></div>
                <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Lojas" /></div>
              </div>
              <div className="space-y-2"><Label>Categoria</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="core" /></div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_core} onCheckedChange={v => setForm(f => ({ ...f, is_core: v }))} />
                  <Label>Core</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                  <Label>Ativo</Label>
                </div>
              </div>
              <Button onClick={() => save.mutate()} disabled={!form.key || !form.name} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-center">Core</TableHead>
                <TableHead className="text-center">Ativo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>}
              {Object.entries(grouped).map(([cat, mods]) =>
                mods!.map((m, i) => (
                  <TableRow key={m.id}>
                    {i === 0 && <TableCell rowSpan={mods!.length} className="align-top font-medium"><Badge variant="outline">{cat}</Badge></TableCell>}
                    <TableCell className="font-mono text-xs">{m.key}</TableCell>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{m.description || "—"}</TableCell>
                    <TableCell className="text-center">{m.is_core ? <Badge>Core</Badge> : "—"}</TableCell>
                    <TableCell className="text-center">{m.is_active ? <Badge variant="secondary">Sim</Badge> : <Badge variant="destructive">Não</Badge>}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                      {!m.is_core && <Button variant="ghost" size="icon" onClick={() => remove.mutate(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
