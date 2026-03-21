import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Save, X, GripVertical, Image as ImageIcon, icons, Palette, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import StorageImageUpload from "@/components/page-builder/StorageImageUpload";
import ImageAiActions from "@/components/ImageAiActions";

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

interface CategoryBanner {
  id: string;
  image_url: string;
  title: string | null;
  link_url: string | null;
  order_index: number;
  is_active: boolean;
}

export default function AffiliateCategoriesPage() {
  const qc = useQueryClient();
  const { currentBrandId } = useBrandGuard();
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Category> | null>(null);
  const [newForm, setNewForm] = useState<Partial<Category> | null>(null);
  const [bannerCatId, setBannerCatId] = useState<string | null>(null);

  // CTA config
  const { data: brandData } = useQuery({
    queryKey: ["brand-cta-config", currentBrandId],
    enabled: !!currentBrandId,
    queryFn: async () => {
      const { data } = await supabase.from("brands").select("brand_settings_json").eq("id", currentBrandId!).single();
      return data?.brand_settings_json as any || {};
    },
  });

  const ctaConfig = brandData?.achadinho_cta || {};
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaBgColor, setCtaBgColor] = useState("#F97316");
  const [ctaTextColor, setCtaTextColor] = useState("#FFFFFF");
  const [detailBannerUrl, setDetailBannerUrl] = useState("");

  useEffect(() => {
    if (ctaConfig.label) setCtaLabel(ctaConfig.label);
    if (ctaConfig.bg_color) setCtaBgColor(ctaConfig.bg_color);
    if (ctaConfig.text_color) setCtaTextColor(ctaConfig.text_color);
    if (brandData?.achadinho_detail_banner_url) setDetailBannerUrl(brandData.achadinho_detail_banner_url);
  }, [brandData]);

  const saveCtaMutation = useMutation({
    mutationFn: async () => {
      if (!currentBrandId) throw new Error("Brand não identificada");
      const settings = {
        ...(brandData || {}),
        achadinho_cta: { label: ctaLabel || "Ir para oferta", bg_color: ctaBgColor, text_color: ctaTextColor },
        achadinho_detail_banner_url: detailBannerUrl || null,
      };
      const { error } = await supabase.from("brands").update({ brand_settings_json: settings }).eq("id", currentBrandId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand-cta-config"] });
      toast.success("Configurações salvas!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

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
        const { error } = await supabase.from("affiliate_deal_categories").update({
          name: cat.name, icon_name: cat.icon_name, color: cat.color, is_active: cat.is_active, keywords: cat.keywords || [],
        }).eq("id", cat.id);
        if (error) throw error;
      } else {
        if (!currentBrandId) throw new Error("Brand não identificada");
        const maxOrder = (categories || []).reduce((m, c) => Math.max(m, c.order_index), -1);
        const { error } = await supabase.from("affiliate_deal_categories").insert({
          brand_id: currentBrandId, name: cat.name || "Nova Categoria", icon_name: cat.icon_name || "Tag",
          color: cat.color || "#6366f1", order_index: maxOrder + 1, keywords: cat.keywords || [],
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["affiliate-categories"] });
      toast.success("Categoria salva!");
      setEditId(null); setEditForm(null); setNewForm(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("affiliate_deal_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["affiliate-categories"] }); toast.success("Categoria removida!"); },
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
                <button key={ic} type="button" onClick={() => setForm({ ...form, icon_name: ic })} className="p-1.5 rounded-lg border hover:border-primary/50 transition-colors" title={ic}>
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
            <Label className="text-xs">Palavras-chave (separadas por vírgula)</Label>
            <Input
              value={(form.keywords || []).join(", ")}
              onChange={e => setForm({ ...form, keywords: e.target.value.split(",").map(k => k.trim().toLowerCase()).filter(Boolean) })}
              placeholder="Ex: celular, smartphone, fone, tablet"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave} disabled={!form.name?.trim()}><Save className="h-4 w-4 mr-1" />Salvar</Button>
          <Button size="sm" variant="ghost" onClick={onCancel}><X className="h-4 w-4 mr-1" />Cancelar</Button>
        </div>
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="h-14 w-14 rounded-full flex items-center justify-center" style={{ backgroundColor: `${form.color || '#6366f1'}20` }}>
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

      {/* CTA & Banner Config */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Configurações — Detalhe do Achadinho
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Banner de fundo */}
          <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <ImagePlus className="h-3.5 w-3.5" />
              Banner de fundo da página de produto
            </Label>
            <p className="text-[11px] text-muted-foreground">Imagem exibida atrás da foto do produto. Proporção ideal: 16:9 (1200×675)</p>
            <StorageImageUpload
              value={detailBannerUrl}
              onChange={setDetailBannerUrl}
              label="Banner do produto"
              folder="achadinho-banners"
              aspectHint="Proporção ideal: 16:9 (1200×675)"
            />
            {detailBannerUrl && (
              <ImageAiActions imageUrl={detailBannerUrl} onReplace={setDetailBannerUrl} context="banner" />
            )}
          </div>

          {/* CTA config */}
          <Label className="text-xs font-semibold">Botão CTA</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Texto do botão</Label>
              <Input value={ctaLabel} onChange={e => setCtaLabel(e.target.value)} placeholder="Ir para oferta" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cor de fundo</Label>
              <div className="flex gap-2 items-center">
                <input type="color" value={ctaBgColor} onChange={e => setCtaBgColor(e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
                <Input value={ctaBgColor} onChange={e => setCtaBgColor(e.target.value)} className="flex-1" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cor do texto</Label>
              <div className="flex gap-2 items-center">
                <input type="color" value={ctaTextColor} onChange={e => setCtaTextColor(e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
                <Input value={ctaTextColor} onChange={e => setCtaTextColor(e.target.value)} className="flex-1" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button size="sm" onClick={() => saveCtaMutation.mutate()} disabled={saveCtaMutation.isPending}>
              <Save className="h-4 w-4 mr-1" />Salvar
            </Button>
            <div className="flex-1 flex justify-end">
              <button
                className="px-6 py-2.5 rounded-xl text-sm font-bold"
                style={{ backgroundColor: ctaBgColor, color: ctaTextColor }}
              >
                {ctaLabel || "Ir para oferta"}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {newForm && renderForm(newForm, setNewForm, () => saveMutation.mutate(newForm), () => setNewForm(null))}
      {editId && editForm && renderForm(editForm, setEditForm, () => saveMutation.mutate({ ...editForm, id: editId }), () => { setEditId(null); setEditForm(null); })}

      <div className="grid gap-2">
        {isLoading && <p className="text-muted-foreground text-sm">Carregando...</p>}
        {(categories || []).map(cat => (
          <Card key={cat.id} className={!cat.is_active ? "opacity-50" : ""}>
            <CardContent className="p-3 flex items-center gap-3">
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}20` }}>
                <LucideIcon name={cat.icon_name} className="h-5 w-5" style={{ color: cat.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{cat.name}</p>
                <p className="text-xs text-muted-foreground truncate">{(cat.keywords || []).join(", ") || "Sem palavras-chave"}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setBannerCatId(bannerCatId === cat.id ? null : cat.id)} title="Banners">
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Switch checked={cat.is_active} onCheckedChange={v => toggleActive(cat.id, v)} />
              <Button variant="ghost" size="icon" onClick={() => { setEditId(cat.id); setEditForm(cat); }}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(cat.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
            {bannerCatId === cat.id && currentBrandId && (
              <CategoryBannerManager brandId={currentBrandId} categoryId={cat.id} />
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── Banner Manager inline ── */
function CategoryBannerManager({ brandId, categoryId }: { brandId: string; categoryId: string }) {
  const qc = useQueryClient();
  const [newBanner, setNewBanner] = useState<{ image_url: string; title: string; link_url: string } | null>(null);

  const { data: banners, isLoading } = useQuery({
    queryKey: ["affiliate-cat-banners-admin", brandId, categoryId],
    queryFn: async () => {
      const { data } = await supabase
        .from("affiliate_category_banners")
        .select("*")
        .eq("brand_id", brandId)
        .eq("category_id", categoryId)
        .order("order_index");
      return (data as CategoryBanner[]) || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (b: { image_url: string; title: string; link_url: string }) => {
      const maxOrder = (banners || []).reduce((m, x) => Math.max(m, x.order_index), -1);
      const { error } = await supabase.from("affiliate_category_banners").insert({
        brand_id: brandId, category_id: categoryId, image_url: b.image_url,
        title: b.title || null, link_url: b.link_url || null, order_index: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["affiliate-cat-banners-admin", brandId, categoryId] }); setNewBanner(null); toast.success("Banner adicionado!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteBanner = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("affiliate_category_banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["affiliate-cat-banners-admin", brandId, categoryId] }); toast.success("Banner removido!"); },
  });

  return (
    <div className="px-4 pb-4 pt-2 border-t space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">Banners da Categoria</Label>
        <Button size="sm" variant="outline" onClick={() => setNewBanner({ image_url: "", title: "", link_url: "" })}>
          <Plus className="h-3 w-3 mr-1" />Banner
        </Button>
      </div>

      {newBanner && (
        <Card className="border-primary">
          <CardContent className="p-3 space-y-2">
            <StorageImageUpload
              value={newBanner.image_url}
              onChange={url => setNewBanner({ ...newBanner, image_url: url })}
              label="Imagem do Banner"
              folder="category-banners"
              aspectHint="Proporção ideal: 21:9 (1200×514)"
            />
            <Input value={newBanner.title} onChange={e => setNewBanner({ ...newBanner, title: e.target.value })} placeholder="Título (opcional)" className="text-xs" />
            <Input value={newBanner.link_url} onChange={e => setNewBanner({ ...newBanner, link_url: e.target.value })} placeholder="Link ao clicar (opcional)" className="text-xs" />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addMutation.mutate(newBanner)} disabled={!newBanner.image_url}>
                <Save className="h-3 w-3 mr-1" />Salvar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setNewBanner(null)}>
                <X className="h-3 w-3 mr-1" />Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && <p className="text-xs text-muted-foreground">Carregando banners...</p>}
      {(banners || []).map(b => (
        <div key={b.id} className="flex items-center gap-3 bg-muted/30 rounded-lg p-2">
          <img src={b.image_url} alt={b.title || ""} className="h-12 w-24 object-cover rounded-lg" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{b.title || "Sem título"}</p>
            {b.link_url && <p className="text-[10px] text-muted-foreground truncate">{b.link_url}</p>}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteBanner.mutate(b.id)}>
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      ))}
      {!isLoading && (!banners || banners.length === 0) && !newBanner && (
        <p className="text-xs text-muted-foreground text-center py-2">Nenhum banner configurado</p>
      )}
    </div>
  );
}
