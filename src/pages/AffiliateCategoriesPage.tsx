import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Save, X, GripVertical, Wand2, icons } from "lucide-react";
import { toast } from "sonner";

function LucideIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const Icon = (icons as any)[name];
  return Icon ? <Icon className={className} style={style} /> : null;
}

const ICON_SUGGESTIONS = [
  "Smartphone", "Shirt", "Home", "Sparkles", "Dumbbell", "UtensilsCrossed",
  "Baby", "PawPrint", "ShoppingBasket", "BookOpen", "Gamepad2", "Car",
  "Wrench", "HeartPulse", "PenTool", "Ticket", "Gift", "Music", "Plane",
  "Gem", "Tag", "Star", "ShoppingBag", "Coffee",
];

interface Category {
  id: string;
  name: string;
  icon_name: string;
  color: string;
  order_index: number;
  is_active: boolean;
  keywords: string[];
}

export default function AffiliateCategoriesPage() {
  const qc = useQueryClient();
  const { currentBrandId } = useBrandGuard();
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Category> | null>(null);
  const [newForm, setNewForm] = useState<Partial<Category> | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["affiliate-categories", currentBrandId],
    queryFn: async () => {
      if (!currentBrandId) return [];
      const { data, error } = await supabase
        .from("affiliate_deal_categories")
        .select("*")
        .eq("brand_id", currentBrandId)
        .order("order_index");
      if (error) throw error;
      return data as Category[];
    },
    enabled: !!currentBrandId,
  });

  // Seed default categories if none exist
  useEffect(() => {
    if (categories && categories.length === 0 && currentBrandId) {
      supabase.rpc("seed_affiliate_categories", { p_brand_id: currentBrandId }).then(({ error }) => {
        if (!error) {
          qc.invalidateQueries({ queryKey: ["affiliate-categories"] });
          toast.success("Categorias padrão criadas!");
        }
      });
    }
  }, [categories, currentBrandId, qc]);

  const saveMutation = useMutation({
    mutationFn: async (cat: Partial<Category> & { id?: string }) => {
      if (cat.id) {
        const { error } = await supabase
          .from("affiliate_deal_categories")
          .update({
            name: cat.name,
            icon_name: cat.icon_name,
            color: cat.color,
            is_active: cat.is_active,
            keywords: cat.keywords || [],
          })
          .eq("id", cat.id);
        if (error) throw error;
      } else {
        if (!currentBrandId) throw new Error("Brand não identificada");
        const maxOrder = (categories || []).reduce((m, c) => Math.max(m, c.order_index), -1);
        const { error } = await supabase
          .from("affiliate_deal_categories")
          .insert({
            brand_id: currentBrandId,
            name: cat.name || "Nova Categoria",
            icon_name: cat.icon_name || "Tag",
            color: cat.color || "#6366f1",
            order_index: maxOrder + 1,
            keywords: cat.keywords || [],
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["affiliate-categories"] });
      toast.success("Categoria salva!");
      setEditId(null);
      setEditForm(null);
      setNewForm(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("affiliate_deal_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["affiliate-categories"] });
      toast.success("Categoria removida!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("affiliate_deal_categories").update({ is_active: active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["affiliate-categories"] });
  };

  const renderForm = (form: Partial<Category>, setForm: (f: Partial<Category>) => void, onSave: () => void, onCancel: () => void) => (
    <Card className="border-primary">
      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Nome</Label>
            <Input value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Eletrônicos" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ícone (Lucide)</Label>
            <Input value={form.icon_name || ""} onChange={e => setForm({ ...form, icon_name: e.target.value })} placeholder="Ex: Smartphone" />
            <div className="flex flex-wrap gap-1 mt-1">
              {ICON_SUGGESTIONS.slice(0, 12).map(ic => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setForm({ ...form, icon_name: ic })}
                  className="p-1.5 rounded-lg border hover:border-primary/50 transition-colors"
                  title={ic}
                >
                  <LucideIcon name={ic} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Cor</Label>
            <div className="flex gap-2 items-center">
              <input type="color" value={form.color || "#6366f1"} onChange={e => setForm({ ...form, color: e.target.value })} className="h-9 w-12 rounded border cursor-pointer" />
              <Input value={form.color || ""} onChange={e => setForm({ ...form, color: e.target.value })} className="flex-1" />
            </div>
          </div>
          <div className="md:col-span-3 space-y-1">
            <Label className="text-xs">Palavras-chave (separadas por vírgula) — usadas para auto-categorização</Label>
            <Input
              value={(form.keywords || []).join(", ")}
              onChange={e => setForm({ ...form, keywords: e.target.value.split(",").map(k => k.trim().toLowerCase()).filter(Boolean) })}
              placeholder="Ex: celular, smartphone, fone, tablet"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave} disabled={!form.name?.trim()}>
            <Save className="h-4 w-4 mr-1" />Salvar
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />Cancelar
          </Button>
        </div>
        {/* Preview */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <div
            className="h-14 w-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${form.color || '#6366f1'}20` }}
          >
            <LucideIcon name={form.icon_name || "Tag"} className="h-6 w-6" style={{ color: form.color || '#6366f1' }} />
          </div>
          <span className="text-sm font-medium">{form.name || "Preview"}</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Categorias de Achadinhos</h2>
          <p className="text-muted-foreground">Gerencie as categorias de produtos para filtros no app</p>
        </div>
        <Button onClick={() => setNewForm({ name: "", icon_name: "Tag", color: "#6366f1", keywords: [] })}>
          <Plus className="h-4 w-4 mr-2" />Nova Categoria
        </Button>
      </div>

      {newForm && renderForm(
        newForm,
        setNewForm,
        () => saveMutation.mutate(newForm),
        () => setNewForm(null)
      )}

      {editId && editForm && renderForm(
        editForm,
        setEditForm,
        () => saveMutation.mutate({ ...editForm, id: editId }),
        () => { setEditId(null); setEditForm(null); }
      )}

      <div className="grid gap-2">
        {isLoading && <p className="text-muted-foreground text-sm">Carregando...</p>}
        {(categories || []).map(cat => (
          <Card key={cat.id} className={!cat.is_active ? "opacity-50" : ""}>
            <CardContent className="p-3 flex items-center gap-3">
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${cat.color}20` }}
              >
                <LucideIcon name={cat.icon_name} className="h-5 w-5" style={{ color: cat.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{cat.name}</p>
                <p className="text-xs text-muted-foreground truncate">{(cat.keywords || []).join(", ") || "Sem palavras-chave"}</p>
              </div>
              <Switch checked={cat.is_active} onCheckedChange={v => toggleActive(cat.id, v)} />
              <Button variant="ghost" size="icon" onClick={() => { setEditId(cat.id); setEditForm(cat); }}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(cat.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
