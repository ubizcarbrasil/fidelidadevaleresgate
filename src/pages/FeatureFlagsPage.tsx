import { useState } from "react";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface FlagForm { key: string; label: string; description: string; is_enabled: boolean; scope_type: string; }
const emptyForm: FlagForm = { key: "", label: "", description: "", is_enabled: false, scope_type: "PLATFORM" };

export default function FeatureFlagsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { state: confirmState, confirm: askConfirm, close: closeConfirm } = useConfirmDialog();
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FlagForm>(emptyForm);

  const { data: flags, isLoading } = useQuery({
    queryKey: ["feature-flags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("feature_flags").select("*").order("key");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = { key: form.key, label: form.label, description: form.description || null, is_enabled: form.is_enabled, scope_type: form.scope_type };
      if (editId) {
        const { error } = await supabase.from("feature_flags").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("feature_flags").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["feature-flags"] }); toast.success("Recurso salvo!"); closeDialog(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleFlag = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("feature_flags").update({ is_enabled: enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feature-flags"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("feature_flags").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["feature-flags"] }); toast.success("Recurso removido!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (f: any) => { setEditId(f.id); setForm({ key: f.key, label: f.label, description: f.description || "", is_enabled: f.is_enabled, scope_type: f.scope_type }); setOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
         <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Controle de Recursos</h2>
          <p className="text-muted-foreground">Ative ou desative funcionalidades globais da plataforma</p>
        </div>
        <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo Recurso</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Editar Recurso" : "Novo Recurso"}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Chave</Label><Input value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))} placeholder="habilitar_recurso_x" /></div>
                <div className="space-y-2"><Label>Nome</Label><Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} /></div>
              </div>
              <div className="space-y-2"><Label>Descrição</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="space-y-2">
                <Label>Escopo</Label>
                <Select value={form.scope_type} onValueChange={v => setForm(f => ({ ...f, scope_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLATFORM">Plataforma</SelectItem>
                    <SelectItem value="TENANT">Franqueado</SelectItem>
                    <SelectItem value="BRAND">Marca</SelectItem>
                    <SelectItem value="BRANCH">Cidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2"><Switch checked={form.is_enabled} onCheckedChange={v => setForm(f => ({ ...f, is_enabled: v }))} /><Label>Ativo</Label></div>
              <Button onClick={() => save.mutate()} disabled={!form.key || !form.label} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chave</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Escopo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>}
              {flags?.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum recurso cadastrado</TableCell></TableRow>}
              {flags?.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="font-mono text-xs">{f.key}</TableCell>
                  <TableCell className="font-medium">{f.label}</TableCell>
                  <TableCell><Badge variant="outline">{f.scope_type}</Badge></TableCell>
                  <TableCell>
                    <Switch checked={f.is_enabled} onCheckedChange={v => toggleFlag.mutate({ id: f.id, enabled: v })} />
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(f)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => askConfirm({ title: "Excluir flag?", description: "Essa ação não pode ser desfeita.", confirmLabel: "Sim, excluir", variant: "destructive", onConfirm: () => remove.mutate(f.id) })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
