import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, GripVertical, Loader2, Eye, EyeOff, ExternalLink, Save } from "lucide-react";
import StorageImageUpload from "./StorageImageUpload";

interface BannerRow {
  id: string;
  title: string | null;
  image_url: string;
  link_type: string;
  link_url: string | null;
  link_target_id: string | null;
  is_active: boolean;
  order_index: number;
  start_at: string;
  end_at: string | null;
}

interface Props {
  sectionId: string;
  brandId: string;
}

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
      link_type: "external",
      order_index: maxOrder,
      is_active: true,
      start_at: new Date().toISOString(),
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

  const handleSaveBanner = async () => {
    if (!editingBanner) return;
    setSaving(true);
    const { error } = await supabase.from("banner_schedules").update({
      title: editingBanner.title,
      image_url: editingBanner.image_url,
      link_type: editingBanner.link_type,
      link_url: editingBanner.link_url,
      end_at: editingBanner.end_at || null,
    }).eq("id", editingBanner.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Banner salvo!" });
      fetchBanners();
    }
    setSaving(false);
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

        <StorageImageUpload
          value={editingBanner.image_url}
          onChange={(url) => setEditingBanner(b => b ? { ...b, image_url: url } : b)}
          label="Imagem do Banner"
          folder="banners"
          aspectHint="Recomendado: 1080×400px"
        />

        <div>
          <Label className="text-xs">Título (opcional)</Label>
          <Input value={editingBanner.title || ""} onChange={e => setEditingBanner(b => b ? { ...b, title: e.target.value } : b)} placeholder="Nome do banner" className="text-xs" />
        </div>

        <div>
          <Label className="text-xs">Tipo de Link</Label>
          <Select value={editingBanner.link_type} onValueChange={v => setEditingBanner(b => b ? { ...b, link_type: v } : b)}>
            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="external">Link Externo</SelectItem>
              <SelectItem value="internal">Rota Interna</SelectItem>
              <SelectItem value="offer">Oferta</SelectItem>
              <SelectItem value="store">Parceiro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(editingBanner.link_type === "external" || editingBanner.link_type === "internal") && (
          <div>
            <Label className="text-xs">URL / Rota</Label>
            <Input value={editingBanner.link_url || ""} onChange={e => setEditingBanner(b => b ? { ...b, link_url: e.target.value } : b)} placeholder={editingBanner.link_type === "external" ? "https://..." : "/offers"} className="text-xs" />
          </div>
        )}

        <div>
          <Label className="text-xs">Data de expiração (opcional)</Label>
          <Input type="datetime-local" value={editingBanner.end_at?.slice(0, 16) || ""} onChange={e => setEditingBanner(b => b ? { ...b, end_at: e.target.value ? new Date(e.target.value).toISOString() : null } : b)} className="text-xs" />
        </div>

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

      {banners.map((b) => (
        <div
          key={b.id}
          className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer hover:bg-accent/50 transition-colors ${!b.is_active ? "opacity-50" : ""}`}
          onClick={() => setEditingBanner(b)}
        >
          {b.image_url ? (
            <img src={b.image_url} alt="" className="h-8 w-12 object-cover rounded shrink-0" />
          ) : (
            <div className="h-8 w-12 rounded bg-muted flex items-center justify-center shrink-0">
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
          <span className="flex-1 truncate">{b.title || "Sem título"}</span>
          <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
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
