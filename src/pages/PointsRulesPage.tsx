import { useState } from "react";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface RuleForm {
  brand_id: string;
  branch_id: string;
  rule_type: string;
  points_per_real: number;
  money_per_point: number;
  min_purchase_to_earn: number;
  max_points_per_purchase: number;
  max_points_per_customer_per_day: number;
  max_points_per_store_per_day: number;
  require_receipt_code: boolean;
  is_active: boolean;
  allow_store_custom_rule: boolean;
  store_points_per_real_min: number;
  store_points_per_real_max: number;
  store_rule_requires_approval: boolean;
}

const emptyForm: RuleForm = {
  brand_id: "",
  branch_id: "",
  rule_type: "PER_REAL",
  points_per_real: 1,
  money_per_point: 0.01,
  min_purchase_to_earn: 10,
  max_points_per_purchase: 500,
  max_points_per_customer_per_day: 2000,
  max_points_per_store_per_day: 10000,
  require_receipt_code: false,
  is_active: true,
  allow_store_custom_rule: false,
  store_points_per_real_min: 1,
  store_points_per_real_max: 3,
  store_rule_requires_approval: true,
};

export default function PointsRulesPage() {
  const qc = useQueryClient();
  const { state: confirmState, confirm: askConfirm, close: closeConfirm } = useConfirmDialog();
  const { currentBrandId, currentBranchId, isRootAdmin, applyBrandFilter } = useBrandGuard();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<RuleForm>(emptyForm);

  const { data: brands } = useQuery({
    queryKey: ["brands-select"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brands").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
    enabled: isRootAdmin,
  });

  const { data: branches } = useQuery({
    queryKey: ["branches-select", form.brand_id || currentBrandId],
    queryFn: async () => {
      const brandId = form.brand_id || currentBrandId;
      if (!brandId) return [];
      const { data, error } = await supabase.from("branches").select("id, name").eq("brand_id", brandId).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!(form.brand_id || currentBrandId),
  });

  const { data: rules, isLoading } = useQuery({
    queryKey: ["points-rules", currentBrandId],
    queryFn: async () => {
      let q = supabase.from("points_rules").select("*, brands(name), branches(name)").order("created_at", { ascending: false });
      if (!isRootAdmin && currentBrandId) q = q.eq("brand_id", currentBrandId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        rule_type: form.rule_type,
        points_per_real: form.points_per_real,
        money_per_point: form.money_per_point,
        min_purchase_to_earn: form.min_purchase_to_earn,
        max_points_per_purchase: form.max_points_per_purchase,
        max_points_per_customer_per_day: form.max_points_per_customer_per_day,
        max_points_per_store_per_day: form.max_points_per_store_per_day,
        require_receipt_code: form.require_receipt_code,
        is_active: form.is_active,
        allow_store_custom_rule: form.allow_store_custom_rule,
        store_points_per_real_min: form.store_points_per_real_min,
        store_points_per_real_max: form.store_points_per_real_max,
        store_rule_requires_approval: form.store_rule_requires_approval,
      };
      if (!editId) {
        payload.brand_id = isRootAdmin ? form.brand_id : currentBrandId;
        payload.branch_id = form.branch_id || null;
      }
      if (editId) {
        const { error } = await supabase.from("points_rules").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("points_rules").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["points-rules"] }); toast.success("Regra salva!"); closeDialog(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("points_rules").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["points-rules"] }); toast.success("Regra removida!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const closeDialog = () => { setOpen(false); setEditId(null); setForm({ ...emptyForm, brand_id: currentBrandId || "" }); };
  const openNew = () => { setForm({ ...emptyForm, brand_id: currentBrandId || "" }); setOpen(true); };
  const openEdit = (r: any) => {
    setEditId(r.id);
    setForm({
      brand_id: r.brand_id, branch_id: r.branch_id || "", rule_type: r.rule_type,
      points_per_real: r.points_per_real, money_per_point: r.money_per_point,
      min_purchase_to_earn: r.min_purchase_to_earn, max_points_per_purchase: r.max_points_per_purchase,
      max_points_per_customer_per_day: r.max_points_per_customer_per_day,
      max_points_per_store_per_day: r.max_points_per_store_per_day,
      require_receipt_code: r.require_receipt_code, is_active: r.is_active,
      allow_store_custom_rule: r.allow_store_custom_rule ?? false,
      store_points_per_real_min: r.store_points_per_real_min ?? 1,
      store_points_per_real_max: r.store_points_per_real_max ?? 3,
      store_rule_requires_approval: r.store_rule_requires_approval ?? true,
    });
    setOpen(true);
  };

  const updateField = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Regras de Pontuação</h2>
          <p className="text-muted-foreground">Configure como os clientes acumulam pontos</p>
        </div>
        <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else openNew(); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nova Regra</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editId ? "Editar Regra" : "Nova Regra"}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto">
              {isRootAdmin && !editId && (
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Select value={form.brand_id} onValueChange={v => updateField("brand_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione a marca" /></SelectTrigger>
                    <SelectContent>{brands?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Branch (opcional)</Label>
                <Select value={form.branch_id || "__all__"} onValueChange={v => updateField("branch_id", v === "__all__" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Todas as filiais" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas</SelectItem>
                    {branches?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Regra</Label>
                <Select value={form.rule_type} onValueChange={v => updateField("rule_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PER_REAL">Por Real (pontos × valor)</SelectItem>
                    <SelectItem value="FIXED">Fixo por compra</SelectItem>
                    <SelectItem value="TIERED">Escalonado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pontos por R$1</Label>
                  <Input type="number" step="0.1" value={form.points_per_real} onChange={e => updateField("points_per_real", +e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>R$ por ponto</Label>
                  <Input type="number" step="0.001" value={form.money_per_point} onChange={e => updateField("money_per_point", +e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Compra mínima (R$)</Label>
                  <Input type="number" value={form.min_purchase_to_earn} onChange={e => updateField("min_purchase_to_earn", +e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Máx pontos/compra</Label>
                  <Input type="number" value={form.max_points_per_purchase} onChange={e => updateField("max_points_per_purchase", +e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Máx pontos/cliente/dia</Label>
                  <Input type="number" value={form.max_points_per_customer_per_day} onChange={e => updateField("max_points_per_customer_per_day", +e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Máx pontos/loja/dia</Label>
                  <Input type="number" value={form.max_points_per_store_per_day} onChange={e => updateField("max_points_per_store_per_day", +e.target.value)} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Exigir código do comprovante</Label>
                <Switch checked={form.require_receipt_code} onCheckedChange={v => updateField("require_receipt_code", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Ativa</Label>
                <Switch checked={form.is_active} onCheckedChange={v => updateField("is_active", v)} />
              </div>

              {/* Store custom rule settings */}
              <div className="border-t pt-4 space-y-4">
                <p className="text-sm font-semibold text-muted-foreground">Regra customizada por loja</p>
                <div className="flex items-center justify-between">
                  <Label>Permitir regra customizada por loja</Label>
                  <Switch checked={form.allow_store_custom_rule} onCheckedChange={v => updateField("allow_store_custom_rule", v)} />
                </div>
                {form.allow_store_custom_rule && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Pts/R$ mínimo (loja)</Label>
                        <Input type="number" step="0.1" value={form.store_points_per_real_min} onChange={e => updateField("store_points_per_real_min", +e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Pts/R$ máximo (loja)</Label>
                        <Input type="number" step="0.1" value={form.store_points_per_real_max} onChange={e => updateField("store_points_per_real_max", +e.target.value)} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Requer aprovação do admin</Label>
                      <Switch checked={form.store_rule_requires_approval} onCheckedChange={v => updateField("store_rule_requires_approval", v)} />
                    </div>
                  </>
                )}
              </div>
              <Button onClick={() => save.mutate()} disabled={!form.rule_type || (!editId && !form.brand_id && !currentBrandId)} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {isRootAdmin && <TableHead>Brand</TableHead>}
                <TableHead>Branch</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Pts/R$</TableHead>
                <TableHead>R$/Pt</TableHead>
                <TableHead>Min Compra</TableHead>
                <TableHead>Limites</TableHead>
                <TableHead>Comprovante</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>}
              {!isLoading && (!rules || rules.length === 0) && <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Nenhuma regra cadastrada</TableCell></TableRow>}
              {rules?.map((r: any) => (
                <TableRow key={r.id}>
                  {isRootAdmin && <TableCell className="text-sm">{r.brands?.name}</TableCell>}
                  <TableCell className="text-sm">{r.branches?.name || "Todas"}</TableCell>
                  <TableCell><Badge variant="outline">{r.rule_type}</Badge></TableCell>
                  <TableCell className="font-mono text-sm">{r.points_per_real}</TableCell>
                  <TableCell className="font-mono text-sm">R$ {Number(r.money_per_point).toFixed(3)}</TableCell>
                  <TableCell className="font-mono text-sm">R$ {Number(r.min_purchase_to_earn).toFixed(2)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.max_points_per_purchase}/compra · {r.max_points_per_customer_per_day}/cli/dia · {r.max_points_per_store_per_day}/loja/dia
                  </TableCell>
                  <TableCell>{r.require_receipt_code ? <Badge>Sim</Badge> : <Badge variant="secondary">Não</Badge>}</TableCell>
                  <TableCell>{r.is_active ? <Badge className="bg-green-600">Ativa</Badge> : <Badge variant="secondary">Inativa</Badge>}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => askConfirm({ title: "Excluir regra?", description: "Essa ação não pode ser desfeita.", confirmLabel: "Sim, excluir", variant: "destructive", onConfirm: () => remove.mutate(r.id) })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
