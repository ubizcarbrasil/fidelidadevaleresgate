import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, GripVertical, ShoppingBag, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import ImageUploadField from "@/components/ImageUploadField";

interface Props {
  store: any;
}

interface CategoryForm {
  name: string;
  image_url: string;
  is_active: boolean;
}

interface ItemForm {
  name: string;
  description: string;
  price: string;
  image_url: string;
  is_active: boolean;
  category: string;
  order_index: string;
  allow_half: boolean;
  half_price: string;
}

const emptyCat: CategoryForm = { name: "", image_url: "", is_active: true };
const emptyItem: ItemForm = { name: "", description: "", price: "0", image_url: "", is_active: true, category: "", order_index: "0", allow_half: false, half_price: "" };

export default function StoreCatalogTab({ store }: Props) {
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Category dialog
  const [catOpen, setCatOpen] = useState(false);
  const [catEditId, setCatEditId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState<CategoryForm>(emptyCat);

  // Item dialog
  const [itemOpen, setItemOpen] = useState(false);
  const [itemEditId, setItemEditId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<ItemForm>(emptyItem);

  const [tab, setTab] = useState<"items" | "categories">("items");

  const fetchAll = async () => {
    setLoading(true);
    const [itemsRes, catsRes] = await Promise.all([
      supabase.from("store_catalog_items").select("*").eq("store_id", store.id).order("order_index"),
      supabase.from("store_catalog_categories" as any).select("*").eq("store_id", store.id).order("order_index"),
    ]);
    setItems(itemsRes.data || []);
    setCategories(catsRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [store.id]);

  // Category CRUD
  const saveCat = async () => {
    const payload: any = {
      name: catForm.name,
      image_url: catForm.image_url || null,
      is_active: catForm.is_active,
      store_id: store.id,
      brand_id: store.brand_id,
      branch_id: store.branch_id,
    };
    if (catEditId) {
      await supabase.from("store_catalog_categories" as any).update(payload).eq("id", catEditId);
    } else {
      payload.order_index = categories.length;
      await supabase.from("store_catalog_categories" as any).insert(payload);
    }
    toast.success(catEditId ? "Categoria atualizada!" : "Categoria criada!");
    setCatOpen(false); setCatEditId(null); setCatForm(emptyCat);
    fetchAll();
  };

  const deleteCat = async (id: string) => {
    await supabase.from("store_catalog_categories" as any).delete().eq("id", id);
    toast.success("Categoria removida!");
    fetchAll();
  };

  // Item CRUD
  const saveItem = async () => {
    const payload: any = {
      name: itemForm.name,
      description: itemForm.description || null,
      price: Number(itemForm.price),
      image_url: itemForm.image_url || null,
      is_active: itemForm.is_active,
      category: itemForm.category || null,
      order_index: Number(itemForm.order_index),
      store_id: store.id,
      brand_id: store.brand_id,
      branch_id: store.branch_id,
      allow_half: itemForm.allow_half,
      half_price: itemForm.half_price ? Number(itemForm.half_price) : null,
    };
    if (itemEditId) {
      await supabase.from("store_catalog_items").update(payload).eq("id", itemEditId);
    } else {
      await supabase.from("store_catalog_items").insert(payload);
    }
    toast.success(itemEditId ? "Item atualizado!" : "Item criado!");
    setItemOpen(false); setItemEditId(null); setItemForm(emptyItem);
    fetchAll();
  };

  const deleteItem = async (id: string) => {
    await supabase.from("store_catalog_items").delete().eq("id", id);
    toast.success("Item removido!");
    fetchAll();
  };

  const catalogConfig = store.store_catalog_config_json as any || {};
  const [tabLabel, setTabLabel] = useState(catalogConfig.tab_label || "Catálogo");

  const saveTabLabel = async (newLabel: string) => {
    setTabLabel(newLabel);
    await supabase.from("stores" as any).update({
      store_catalog_config_json: { ...catalogConfig, tab_label: newLabel },
    }).eq("id", store.id);
    toast.success("Rótulo atualizado!");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Catálogo Digital</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Gerencie seus produtos e categorias</p>
      </div>

      {/* Tab label config */}
      <div className="bg-muted/30 rounded-xl p-3 space-y-2">
        <Label className="text-xs font-semibold">Nome da aba no app do cliente</Label>
        <div className="flex gap-2">
          {["Cardápio", "Catálogo", "Loja", "Serviços"].map(opt => (
            <button
              key={opt}
              onClick={() => saveTabLabel(opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tabLabel === opt ? "bg-primary text-primary-foreground" : "bg-background border hover:bg-muted"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        <Input
          value={tabLabel}
          onChange={e => setTabLabel(e.target.value)}
          onBlur={() => saveTabLabel(tabLabel)}
          placeholder="Nome personalizado..."
          className="h-8 text-xs mt-1"
        />
      </div>

      {/* Subtab toggle */}
      <div className="flex gap-1.5 bg-muted/60 rounded-xl p-1">
        <button
          onClick={() => setTab("items")}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            tab === "items" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          <ShoppingBag className="h-3.5 w-3.5 inline mr-1.5" />Produtos
        </button>
        <button
          onClick={() => setTab("categories")}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            tab === "categories" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          <FolderOpen className="h-3.5 w-3.5 inline mr-1.5" />Categorias
        </button>
      </div>

      {tab === "items" && (
        <>
          <Button size="sm" onClick={() => { setItemForm(emptyItem); setItemEditId(null); setItemOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo Produto
          </Button>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />)}</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Nenhum produto cadastrado</div>
          ) : (
            <div className="space-y-2">
              {items.map(item => (
                <Card key={item.id} className="rounded-xl border-0 shadow-sm">
                  <CardContent className="p-3 flex items-center gap-3">
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold">R$ {Number(item.price).toFixed(2)}</span>
                        {item.category && <Badge variant="outline" className="text-[9px]">{item.category}</Badge>}
                        {!item.is_active && <Badge variant="secondary" className="text-[9px]">Inativo</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => {
                        setItemEditId(item.id);
                        setItemForm({
                          name: item.name, description: item.description || "", price: String(item.price),
                          image_url: item.image_url || "", is_active: item.is_active,
                          category: item.category || "", order_index: String(item.order_index),
                          allow_half: item.allow_half || false, half_price: item.half_price ? String(item.half_price) : "",
                        });
                        setItemOpen(true);
                      }} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteItem(item.id)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "categories" && (
        <>
          <Button size="sm" onClick={() => { setCatForm(emptyCat); setCatEditId(null); setCatOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Nova Categoria
          </Button>

          {categories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Nenhuma categoria. Itens sem categoria aparecem sob "Todos".</div>
          ) : (
            <div className="space-y-2">
              {categories.map((cat: any) => (
                <Card key={cat.id} className="rounded-xl border-0 shadow-sm">
                  <CardContent className="p-3 flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{cat.name}</p>
                      {!cat.is_active && <Badge variant="secondary" className="text-[9px]">Inativa</Badge>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => {
                        setCatEditId(cat.id);
                        setCatForm({ name: cat.name, image_url: cat.image_url || "", is_active: cat.is_active });
                        setCatOpen(true);
                      }} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteCat(cat.id)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Category dialog */}
      <Dialog open={catOpen} onOpenChange={v => { if (!v) { setCatOpen(false); setCatEditId(null); setCatForm(emptyCat); } else setCatOpen(true); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{catEditId ? "Editar Categoria" : "Nova Categoria"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Imagem</Label>
              <ImageUploadField value={catForm.image_url} onChange={url => setCatForm(f => ({ ...f, image_url: url }))} folder="catalog-categories" label="Imagem" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={catForm.is_active} onCheckedChange={v => setCatForm(f => ({ ...f, is_active: v }))} />
              <Label>Ativa</Label>
            </div>
            <Button onClick={saveCat} disabled={!catForm.name} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Item dialog */}
      <Dialog open={itemOpen} onOpenChange={v => { if (!v) { setItemOpen(false); setItemEditId(null); setItemForm(emptyItem); } else setItemOpen(true); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{itemEditId ? "Editar Produto" : "Novo Produto"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={itemForm.description} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Preço (R$)</Label>
                <Input type="number" min="0" step="0.01" value={itemForm.price} onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input value={itemForm.category} onChange={e => setItemForm(f => ({ ...f, category: e.target.value }))} placeholder="Ex: Pizzas" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Imagem</Label>
              <ImageUploadField value={itemForm.image_url} onChange={url => setItemForm(f => ({ ...f, image_url: url }))} folder="catalog-items" label="Imagem" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={itemForm.allow_half} onCheckedChange={v => setItemForm(f => ({ ...f, allow_half: v }))} />
              <Label>Permite meia porção</Label>
            </div>
            {itemForm.allow_half && (
              <div className="space-y-2">
                <Label>Preço da meia (R$)</Label>
                <Input type="number" min="0" step="0.01" value={itemForm.half_price} onChange={e => setItemForm(f => ({ ...f, half_price: e.target.value }))} placeholder="Deixe vazio para metade do preço" />
              </div>
            )}
            <div className="flex items-center gap-3">
              <Switch checked={itemForm.is_active} onCheckedChange={v => setItemForm(f => ({ ...f, is_active: v }))} />
              <Label>Ativo</Label>
            </div>
            <Button onClick={saveItem} disabled={!itemForm.name} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
