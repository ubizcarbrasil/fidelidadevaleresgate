import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2, Eye, EyeOff, ExternalLink, Save, ChevronUp, ChevronDown, Maximize2 } from "lucide-react";
import StorageImageUpload from "./StorageImageUpload";

interface BannerRow {
  id: string;
  title: string | null;
  image_url: string;
  link_type: string;
  link_url: string | null;
  link_target_id: string | null;
  link_label: string | null;
  is_active: boolean;
  order_index: number;
  start_at: string;
  end_at: string | null;
  height: string;
}

interface Props {
  sectionId: string;
  brandId: string;
}

const HEIGHT_OPTIONS = [
  { value: "small", label: "Pequeno (120px)" },
  { value: "medium", label: "Médio (180px)" },
  { value: "large", label: "Grande (240px)" },
  { value: "xlarge", label: "Extra Grande (320px)" },
  { value: "full", label: "Tela cheia (400px)" },
];

const LINK_TYPE_OPTIONS = [
  { value: "none", label: "Sem link" },
  { value: "external", label: "Link Externo" },
  { value: "internal", label: "Rota Interna" },
  { value: "webview", label: "WebView (in-app)" },
  { value: "offer", label: "Oferta específica" },
  { value: "store", label: "Parceiro específico" },
  { value: "category", label: "Categoria" },
  { value: "custom_page", label: "Página personalizada" },
];

export default function InlineBannerManager({ sectionId, brandId }: Props) {
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState<BannerRow | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchBanners = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("banner_schedules")
      .select("*")
      .eq("brand_id", brandId)
      .or(`brand_section_id.eq.${sectionId},brand_section_id.is.null`)
      .order("order_index");
    setBanners((data as BannerRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchBanners(); }, [sectionId, brandId]);

  const handleAdd = async () => {
    const maxOrder = banners.length > 0 ? Math.max(...banners.map(b => b.order_index)) + 1 : 0;
    const { error } = await supabase.from("banner_schedules").insert({
      brand_id: brandId,
      brand_section_id: sectionId,
      image_url: "",
      title: "Novo Banner",
      link_type: "none",
      order_index: maxOrder,
      is_active: true,
      start_at: new Date().toISOString(),
      height: "medium",
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      fetchBanners();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este banner?")) return;
    await supabase.from("banner_schedules").delete().eq("id", id);
    toast({ title: "Banner removido" });
    if (editingBanner?.id === id) setEditingBanner(null);
    fetchBanners();
  };

  const handleToggle = async (banner: BannerRow) => {
    await supabase.from("banner_schedules").update({ is_active: !banner.is_active }).eq("id", banner.id);
    fetchBanners();
  };

  const handleMove = async (bannerId: string, direction: -1 | 1) => {
    const idx = banners.findIndex(b => b.id === bannerId);
    if (idx === -1) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= banners.length) return;
    const a = banners[idx];
    const b = banners[newIdx];
    await Promise.all([
      supabase.from("banner_schedules").update({ order_index: b.order_index }).eq("id", a.id),
      supabase.from("banner_schedules").update({ order_index: a.order_index }).eq("id", b.id),
    ]);
    fetchBanners();
  };

  const handleSaveBanner = async () => {
    if (!editingBanner) return;
    setSaving(true);
    const { error } = await supabase.from("banner_schedules").update({
      title: editingBanner.title,
      image_url: editingBanner.image_url,
      link_type: editingBanner.link_type,
      link_url: editingBanner.link_url,
      link_target_id: editingBanner.link_target_id,
      link_label: editingBanner.link_label,
      height: editingBanner.height,
      end_at: editingBanner.end_at || null,
      start_at: editingBanner.start_at,
    }).eq("id", editingBanner.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Banner salvo!" });
      fetchBanners();
    }
    setSaving(false);
  };

  const handleDuplicate = async (banner: BannerRow) => {
    const maxOrder = banners.length > 0 ? Math.max(...banners.map(b => b.order_index)) + 1 : 0;
    const { error } = await supabase.from("banner_schedules").insert({
      brand_id: brandId,
      brand_section_id: sectionId,
      image_url: banner.image_url,
      title: `${banner.title || "Banner"} (cópia)`,
      link_type: banner.link_type,
      link_url: banner.link_url,
      link_target_id: banner.link_target_id,
      link_label: banner.link_label,
      height: banner.height,
      order_index: maxOrder,
      is_active: true,
      start_at: new Date().toISOString(),
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Banner duplicado!" });
      fetchBanners();
    }
  };

  if (loading) {
    return <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;
  }

  if (editingBanner) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold">Editar Banner</h4>
          <Button size="sm" variant="ghost" onClick={() => setEditingBanner(null)} className="text-xs">← Voltar</Button>
        </div>

        {/* Image upload */}
        <StorageImageUpload
          value={editingBanner.image_url}
          onChange={(url) => setEditingBanner(b => b ? { ...b, image_url: url } : b)}
          label="Imagem do Banner"
          folder="banners"
          aspectHint="Recomendado: 1080×400px"
        />

        {/* Title */}
        <div>
          <Label className="text-xs">Título (opcional)</Label>
          <Input value={editingBanner.title || ""} onChange={e => setEditingBanner(b => b ? { ...b, title: e.target.value } : b)} placeholder="Nome do banner" className="text-xs" />
        </div>

        {/* Height / Size */}
        <div>
          <Label className="text-xs flex items-center gap-1"><Maximize2 className="h-3 w-3" /> Tamanho do Banner</Label>
          <Select value={editingBanner.height || "medium"} onValueChange={v => setEditingBanner(b => b ? { ...b, height: v } : b)}>
            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {HEIGHT_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Link Type */}
        <div>
          <Label className="text-xs">Tipo de Link</Label>
          <Select value={editingBanner.link_type} onValueChange={v => setEditingBanner(b => b ? { ...b, link_type: v, link_url: null, link_target_id: null } : b)}>
            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LINK_TYPE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Link URL - for external, internal, webview */}
        {["external", "internal", "webview", "custom_page"].includes(editingBanner.link_type) && (
          <div>
            <Label className="text-xs">
              {editingBanner.link_type === "external" ? "URL do link" :
               editingBanner.link_type === "internal" ? "Rota interna" :
               editingBanner.link_type === "webview" ? "URL da WebView" :
               "Slug da página"}
            </Label>
            <Input
              value={editingBanner.link_url || ""}
              onChange={e => setEditingBanner(b => b ? { ...b, link_url: e.target.value } : b)}
              placeholder={
                editingBanner.link_type === "external" ? "https://www.exemplo.com" :
                editingBanner.link_type === "internal" ? "/offers, /wallet, /stores" :
                editingBanner.link_type === "webview" ? "https://..." :
                "minha-pagina"
              }
              className="text-xs"
            />
          </div>
        )}

        {/* Link Target ID - for offer, store, category */}
        {["offer", "store", "category"].includes(editingBanner.link_type) && (
          <div>
            <Label className="text-xs">
              ID {editingBanner.link_type === "offer" ? "da Oferta" : editingBanner.link_type === "store" ? "do Parceiro" : "da Categoria"}
            </Label>
            <Input
              value={editingBanner.link_target_id || ""}
              onChange={e => setEditingBanner(b => b ? { ...b, link_target_id: e.target.value } : b)}
              placeholder="Cole o UUID aqui"
              className="text-xs font-mono"
            />
          </div>
        )}

        {/* Link Label */}
        {editingBanner.link_type !== "none" && (
          <div>
            <Label className="text-xs">Texto do botão (opcional)</Label>
            <Input
              value={editingBanner.link_label || ""}
              onChange={e => setEditingBanner(b => b ? { ...b, link_label: e.target.value } : b)}
              placeholder="Ex: Saiba mais, Aproveite, Ver oferta"
              className="text-xs"
            />
          </div>
        )}

        {/* Schedule */}
        <div className="rounded-lg border p-3 space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground">📅 Agendamento</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px]">Início</Label>
              <Input
                type="datetime-local"
                value={editingBanner.start_at?.slice(0, 16) || ""}
                onChange={e => setEditingBanner(b => b ? { ...b, start_at: e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString() } : b)}
                className="text-[10px] h-8"
              />
            </div>
            <div>
              <Label className="text-[10px]">Fim (opcional)</Label>
              <Input
                type="datetime-local"
                value={editingBanner.end_at?.slice(0, 16) || ""}
                onChange={e => setEditingBanner(b => b ? { ...b, end_at: e.target.value ? new Date(e.target.value).toISOString() : null } : b)}
                className="text-[10px] h-8"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        {editingBanner.image_url && (
          <div className="rounded-lg overflow-hidden border">
            <p className="text-[10px] font-semibold text-muted-foreground px-2 pt-2">Pré-visualização</p>
            <img
              src={editingBanner.image_url}
              alt={editingBanner.title || "Banner"}
              className="w-full object-cover"
              style={{
                height: editingBanner.height === "small" ? "120px" :
                       editingBanner.height === "large" ? "240px" :
                       editingBanner.height === "xlarge" ? "320px" :
                       editingBanner.height === "full" ? "400px" : "180px"
              }}
            />
            {editingBanner.link_label && editingBanner.link_type !== "none" && (
              <div className="p-2 bg-primary/5 text-center">
                <span className="text-xs font-medium text-primary">{editingBanner.link_label} →</span>
              </div>
            )}
          </div>
        )}

        <Button className="w-full text-xs" size="sm" onClick={handleSaveBanner} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
          Salvar Banner
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-muted-foreground">Banners ({banners.length})</h4>
        <Button size="sm" variant="outline" onClick={handleAdd} className="text-xs h-7">
          <Plus className="h-3 w-3 mr-1" /> Adicionar
        </Button>
      </div>

      {banners.length === 0 && (
        <p className="text-[10px] text-muted-foreground text-center py-3">Nenhum banner. Clique em Adicionar.</p>
      )}

      {banners.map((b, idx) => (
        <div
          key={b.id}
          className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer hover:bg-accent/50 transition-colors ${!b.is_active ? "opacity-50" : ""}`}
          onClick={() => setEditingBanner(b)}
        >
          {/* Reorder arrows */}
          <div className="flex flex-col gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
            <button onClick={() => handleMove(b.id, -1)} disabled={idx === 0} className="text-muted-foreground hover:text-foreground p-0.5 disabled:opacity-30">
              <ChevronUp className="h-2.5 w-2.5" />
            </button>
            <button onClick={() => handleMove(b.id, 1)} disabled={idx === banners.length - 1} className="text-muted-foreground hover:text-foreground p-0.5 disabled:opacity-30">
              <ChevronDown className="h-2.5 w-2.5" />
            </button>
          </div>

          {/* Thumbnail */}
          {b.image_url ? (
            <img src={b.image_url} alt="" className="h-8 w-14 object-cover rounded shrink-0" />
          ) : (
            <div className="h-8 w-14 rounded bg-muted flex items-center justify-center shrink-0">
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <span className="truncate block">{b.title || "Sem título"}</span>
            <div className="flex gap-1 mt-0.5">
              <span className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground">
                {HEIGHT_OPTIONS.find(h => h.value === b.height)?.label?.split(" ")[0] || "Médio"}
              </span>
              {b.link_type !== "none" && (
                <span className="text-[9px] px-1 py-0.5 rounded bg-primary/10 text-primary">
                  {LINK_TYPE_OPTIONS.find(l => l.value === b.link_type)?.label || b.link_type}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
            <button onClick={() => handleDuplicate(b)} className="text-muted-foreground hover:text-foreground" title="Duplicar">
              <Plus className="h-3 w-3" />
            </button>
            <button onClick={() => handleToggle(b)} className="text-muted-foreground hover:text-foreground">
              {b.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            </button>
            <button onClick={() => handleDelete(b.id)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
