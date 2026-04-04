import { useState } from "react";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Eye, EyeOff, Blocks, Shield } from "lucide-react";
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
  const { state: confirmState, confirm: askConfirm, close: closeConfirm } = useConfirmDialog();
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

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("module_definitions").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["module-definitions"] }); toast.success("Status atualizado!"); },
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

  const categoryIcons: Record<string, string> = {
    core: "🔧",
    comercial: "🏪",
    fidelidade: "⭐",
    visual: "🎨",
    engajamento: "📣",
    general: "📦",
  };

  return (
    <div className="space-y-5 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight truncate">Definições de Módulos</h2>
          <p className="text-xs text-muted-foreground">Catálogo de módulos da plataforma</p>
        </div>
        <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="shrink-0">
              <Plus className="h-4 w-4 mr-1" />
              Novo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader><DialogTitle>{editId ? "Editar Módulo" : "Novo Módulo"}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs">Key</Label><Input value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))} placeholder="stores" className="h-9" /></div>
                <div className="space-y-1.5"><Label className="text-xs">Nome</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Lojas" className="h-9" /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Categoria</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="core" className="h-9" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_core} onCheckedChange={v => setForm(f => ({ ...f, is_core: v }))} />
                  <Label className="text-xs">Core</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                  <Label className="text-xs">Ativo</Label>
                </div>
              </div>
              <Button onClick={() => save.mutate()} disabled={!form.key || !form.name} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, j) => <Skeleton key={j} className="h-16 rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category groups */}
      {Object.entries(grouped).map(([cat, mods]) => (
        <div key={cat} className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className="text-base">{categoryIcons[cat] || "📦"}</span>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cat}</h3>
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-auto">{mods!.length}</Badge>
          </div>

          <div className="space-y-2">
            {mods!.map(m => (
              <div
                key={m.id}
                className={`rounded-xl border bg-card p-3 transition-all ${
                  m.is_active ? "border-border shadow-sm" : "border-border/50 opacity-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`mt-0.5 rounded-lg p-2 ${m.is_core ? "bg-primary/10" : "bg-muted"}`}>
                    {m.is_core ? <Shield className="h-4 w-4 text-primary" /> : <Blocks className="h-4 w-4 text-muted-foreground" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm truncate">{m.name}</span>
                      {m.is_core && <Badge className="text-[10px] h-4 px-1.5">Core</Badge>}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{m.key}</p>
                    {m.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Eye toggle */}
                    <button
                      onClick={() => toggleActive.mutate({ id: m.id, is_active: !m.is_active })}
                      className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted active:scale-95 transition-all touch-manipulation"
                      title={m.is_active ? "Desativar" : "Ativar"}
                    >
                      {m.is_active
                        ? <Eye className="h-4 w-4 text-primary" />
                        : <EyeOff className="h-4 w-4 text-muted-foreground" />
                      }
                    </button>

                    <button
                      onClick={() => openEdit(m)}
                      className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted active:scale-95 transition-all touch-manipulation"
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </button>

                    {!m.is_core && (
                      <button
                        onClick={() => askConfirm({ title: "Excluir módulo?", description: "Essa ação não pode ser desfeita.", confirmLabel: "Sim, excluir", variant: "destructive", onConfirm: () => remove.mutate(m.id) })}
                        className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-destructive/10 active:scale-95 transition-all touch-manipulation"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {!isLoading && modules?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Nenhum módulo cadastrado ainda.
        </div>
      )}
    </div>
  );
}
