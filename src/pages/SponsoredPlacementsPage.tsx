import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Zap, Pencil, Trash2, Store } from "lucide-react";
import { format } from "date-fns";

interface SponsoredPlacement {
  id: string;
  brand_id: string;
  store_id: string;
  starts_at: string;
  ends_at: string;
  priority: number;
  placement_type: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  stores?: { name: string; logo_url: string | null } | null;
}

type StatusFilter = "active" | "expired" | "all";

export default function SponsoredPlacementsPage() {
  const { currentBrandId, isRootAdmin } = useBrandGuard();
  const { user } = useAuth();
  const [placements, setPlacements] = useState<SponsoredPlacement[]>([]);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SponsoredPlacement | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");

  // Form state
  const [formStoreId, setFormStoreId] = useState("");
  const [formStartsAt, setFormStartsAt] = useState("");
  const [formEndsAt, setFormEndsAt] = useState("");
  const [formPriority, setFormPriority] = useState(5);
  const [formNotes, setFormNotes] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPlacements = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("sponsored_placements")
      .select("*, stores(name, logo_url)")
      .order("priority", { ascending: false });

    if (!isRootAdmin && currentBrandId) {
      query = query.eq("brand_id", currentBrandId);
    }

    const now = new Date().toISOString();
    if (statusFilter === "active") {
      query = query.eq("is_active", true).gte("ends_at", now);
    } else if (statusFilter === "expired") {
      query = query.lt("ends_at", now);
    }

    const { data, error } = await query;
    if (error) {
      toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    }
    setPlacements((data as any) || []);
    setLoading(false);
  }, [currentBrandId, isRootAdmin, statusFilter]);

  const fetchStores = useCallback(async () => {
    let query = supabase.from("stores").select("id, name").eq("is_active", true).order("name");
    if (!isRootAdmin && currentBrandId) {
      query = query.eq("brand_id", currentBrandId);
    }
    const { data } = await query;
    setStores(data || []);
  }, [currentBrandId, isRootAdmin]);

  useEffect(() => { fetchPlacements(); }, [fetchPlacements]);
  useEffect(() => { fetchStores(); }, [fetchStores]);

  const openCreate = () => {
    setEditing(null);
    setFormStoreId("");
    setFormStartsAt(new Date().toISOString().slice(0, 16));
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setFormEndsAt(nextMonth.toISOString().slice(0, 16));
    setFormPriority(5);
    setFormNotes("");
    setFormIsActive(true);
    setDialogOpen(true);
  };

  const openEdit = (p: SponsoredPlacement) => {
    setEditing(p);
    setFormStoreId(p.store_id);
    setFormStartsAt(new Date(p.starts_at).toISOString().slice(0, 16));
    setFormEndsAt(new Date(p.ends_at).toISOString().slice(0, 16));
    setFormPriority(p.priority);
    setFormNotes(p.notes || "");
    setFormIsActive(p.is_active);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formStoreId || !formEndsAt) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }
    setSaving(true);

    const payload: any = {
      store_id: formStoreId,
      starts_at: new Date(formStartsAt).toISOString(),
      ends_at: new Date(formEndsAt).toISOString(),
      priority: formPriority,
      notes: formNotes || null,
      is_active: formIsActive,
    };

    if (editing) {
      const { error } = await supabase.from("sponsored_placements").update(payload).eq("id", editing.id);
      if (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Campanha atualizada!" });
      }
    } else {
      payload.brand_id = currentBrandId;
      payload.created_by = user?.id;
      const { error } = await supabase.from("sponsored_placements").insert(payload);
      if (error) {
        toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Campanha criada!" });
      }
    }

    setSaving(false);
    setDialogOpen(false);
    fetchPlacements();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover esta campanha patrocinada?")) return;
    const { error } = await supabase.from("sponsored_placements").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Removida!" });
      fetchPlacements();
    }
  };

  const toggleActive = async (p: SponsoredPlacement) => {
    await supabase.from("sponsored_placements").update({ is_active: !p.is_active }).eq("id", p.id);
    fetchPlacements();
  };

  const isExpired = (p: SponsoredPlacement) => new Date(p.ends_at) < new Date();

  return (
    <div>
      <PageHeader title="Campanhas Patrocinadas" description="Destaque parceiros pagantes na home do app" />

      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex gap-2">
          {(["active", "expired", "all"] as StatusFilter[]).map((f) => (
            <Button key={f} size="sm" variant={statusFilter === f ? "default" : "outline"} onClick={() => setStatusFilter(f)}>
              {f === "active" ? "Ativas" : f === "expired" ? "Expiradas" : "Todas"}
            </Button>
          ))}
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Nova Campanha
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parceiro</TableHead>
              <TableHead>Período</TableHead>
              <TableHead className="text-center">Prioridade</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : placements.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma campanha encontrada</TableCell></TableRow>
            ) : (
              placements.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{(p as any).stores?.name || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(p.starts_at), "dd/MM/yy")} → {format(new Date(p.ends_at), "dd/MM/yy")}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{p.priority}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {isExpired(p) ? (
                      <Badge variant="outline" className="text-muted-foreground">Expirada</Badge>
                    ) : p.is_active ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Ativa</Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-400 border-amber-500/30">Pausada</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} />
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Campanha" : "Nova Campanha Patrocinada"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Parceiro *</Label>
              <Select value={formStoreId} onValueChange={setFormStoreId}>
                <SelectTrigger><SelectValue placeholder="Selecione o parceiro" /></SelectTrigger>
                <SelectContent>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Início</Label>
                <Input type="datetime-local" value={formStartsAt} onChange={(e) => setFormStartsAt(e.target.value)} />
              </div>
              <div>
                <Label>Fim *</Label>
                <Input type="datetime-local" value={formEndsAt} onChange={(e) => setFormEndsAt(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Prioridade (1-10)</Label>
              <Input type="number" min={1} max={10} value={formPriority} onChange={(e) => setFormPriority(Number(e.target.value))} />
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Observações internas..." />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
              <Label>Ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              <Zap className="h-4 w-4 mr-1" />
              {saving ? "Salvando..." : editing ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
