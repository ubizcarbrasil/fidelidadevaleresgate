import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, FileText, ExternalLink, Layers, GripVertical, Copy, Settings2, ChevronDown, ChevronUp, ToggleLeft } from "lucide-react";
import PageSectionsEditor from "@/components/page-builder-v2/PageSectionsEditor";

interface PageRow {
  id: string;
  brand_id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  is_published: boolean;
  published_at: string | null;
  search_enabled: boolean;
  visibility_type: string;
  visibility_config_json: any;
  banner_config_json: any[];
  page_version: number;
  created_at: string;
}

export default function PageBuilderV2Page() {
  const { currentBrandId } = useBrandGuard();
  const brandId = currentBrandId;
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<PageRow | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPages = useCallback(async () => {
    if (!brand) return;
    setLoading(true);
    const { data } = await supabase
      .from("custom_pages")
      .select("*")
      .eq("brand_id", brand.id)
      .order("created_at", { ascending: false });
    setPages((data as any[]) || []);
    setLoading(false);
  }, [brand]);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const handleCreate = async () => {
    if (!brand || !newTitle.trim() || !newSlug.trim()) return;
    setSaving(true);
    const slug = newSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    const { error } = await supabase.from("custom_pages").insert({
      brand_id: brand.id,
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || null,
      slug,
      elements_json: [],
      permissions_json: {},
      tags_json: [],
      banner_config_json: [],
      search_enabled: false,
      visibility_type: "public",
      visibility_config_json: {},
    } as any);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Página criada!" });
      setShowCreate(false);
      setNewTitle(""); setNewSlug(""); setNewSubtitle("");
      fetchPages();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta página e todas as sessões vinculadas?")) return;
    await supabase.from("custom_pages").delete().eq("id", id);
    toast({ title: "Página excluída" });
    fetchPages();
  };

  const handleTogglePublish = async (page: PageRow) => {
    const newPublished = !page.is_published;
    await supabase.from("custom_pages").update({
      is_published: newPublished,
      published_at: newPublished ? new Date().toISOString() : null,
      page_version: page.page_version + (newPublished ? 1 : 0),
    } as any).eq("id", page.id);
    toast({ title: newPublished ? "Página publicada!" : "Página despublicada" });
    fetchPages();
  };

  // If editing a page, show the section editor
  if (editingPage) {
    return (
      <PageSectionsEditor
        page={editingPage}
        onBack={() => { setEditingPage(null); fetchPages(); }}
      />
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Construtor de Páginas"
        description="Crie páginas internas do app com sessões, banners e filtros. Cada página pode conter múltiplas sessões de conteúdo."
      />

      <div className="flex justify-end mb-6">
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nova Página
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : pages.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma página criada</p>
          <p className="text-sm">Clique em "Nova Página" para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pages.map((page) => (
            <div key={page.id} className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{page.title}</h3>
                {page.subtitle && <p className="text-xs text-muted-foreground truncate">{page.subtitle}</p>}
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">/p/{page.slug}</p>
              </div>
              <div className="flex items-center gap-2 text-xs shrink-0">
                <span className={`px-2 py-0.5 rounded-full font-medium ${page.is_published ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                  {page.is_published ? "Publicada" : "Rascunho"}
                </span>
                {page.search_enabled && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">Busca</span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="icon" variant="ghost" onClick={() => handleTogglePublish(page)} title={page.is_published ? "Despublicar" : "Publicar"}>
                  {page.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditingPage(page)} title="Editar sessões">
                  <Layers className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(page.id)} title="Excluir">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
      <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Nova Página</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={newTitle}
                onChange={(e) => {
                  setNewTitle(e.target.value);
                  setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, ""));
                }}
                placeholder="Ex: Promoções de Verão"
              />
            </div>
            <div>
              <Label>Subtítulo (opcional)</Label>
              <Input value={newSubtitle} onChange={(e) => setNewSubtitle(e.target.value)} placeholder="Descrição curta da página" />
            </div>
            <div>
              <Label>Slug (URL)</Label>
              <Input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="ex: promocoes-verao" />
              <p className="text-xs text-muted-foreground mt-1">Acessível em /p/{newSlug || "..."}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving || !newTitle.trim() || !newSlug.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Criar Página
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
