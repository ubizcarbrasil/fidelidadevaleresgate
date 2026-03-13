import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Eye, EyeOff, Loader2, FileText, Layers, Smartphone } from "lucide-react";
import UnifiedEditor from "@/components/page-builder/UnifiedEditor";

interface CustomPage {
  id: string;
  brand_id: string;
  title: string;
  slug: string;
  is_published: boolean;
  elements_json: any;
  subtitle?: string | null;
  search_enabled?: boolean;
  visibility_type?: string;
  created_at: string;
}

// Virtual page representing the home screen
const HOME_PAGE_SENTINEL: CustomPage = {
  id: "__HOME__",
  brand_id: "",
  title: "Tela Inicial (Home)",
  slug: "home",
  is_published: true,
  elements_json: [],
  subtitle: "Sessões dinâmicas da home do app",
  search_enabled: false,
  visibility_type: "public",
  created_at: "",
};

export default function PageBuilderPage() {
  const { brand } = useBrand();
  const { isRootAdmin, currentBrandId } = useBrandGuard();

  // For root admins without a brand context, allow selecting a brand
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>(currentBrandId || "");
  const [loadingBrands, setLoadingBrands] = useState(false);

  // Effective brand id: context brand > role brand > manually selected
  const effectiveBrandId = brand?.id || currentBrandId || selectedBrandId;

  const [pages, setPages] = useState<CustomPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CustomPage | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch brands for root admin selector
  useEffect(() => {
    if (!isRootAdmin || brand || currentBrandId) return;
    setLoadingBrands(true);
    supabase
      .from("brands")
      .select("id, name")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        setBrands(data || []);
        if (data?.length === 1) setSelectedBrandId(data[0].id);
        setLoadingBrands(false);
      });
  }, [isRootAdmin, brand, currentBrandId]);

  // Update selectedBrandId when currentBrandId changes
  useEffect(() => {
    if (currentBrandId && !selectedBrandId) {
      setSelectedBrandId(currentBrandId);
    }
  }, [currentBrandId]);

  const fetchPages = useCallback(async () => {
    if (!effectiveBrandId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("custom_pages")
      .select("*")
      .eq("brand_id", effectiveBrandId)
      .order("created_at", { ascending: false });
    setPages((data as any[]) || []);
    setLoading(false);
  }, [effectiveBrandId]);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const handleCreate = async () => {
    if (!effectiveBrandId || !newTitle.trim() || !newSlug.trim()) return;
    setSaving(true);
    const slug = newSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    const { error } = await supabase.from("custom_pages").insert({
      brand_id: effectiveBrandId,
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || null,
      slug,
      elements_json: [],
      permissions_json: {},
      tags_json: [],
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

  const handleTogglePublish = async (page: CustomPage) => {
    const newPublished = !page.is_published;
    await supabase.from("custom_pages").update({
      is_published: newPublished,
    }).eq("id", page.id);
    toast({ title: newPublished ? "Página publicada!" : "Página despublicada" });
    fetchPages();
  };

  if (editing) {
    const isHome = editing.id === "__HOME__";
    return (
      <UnifiedEditor
        page={isHome ? { ...editing, brand_id: effectiveBrandId || "", id: "__HOME__" } : editing}
        onBack={() => { setEditing(null); fetchPages(); }}
        isHomePage={isHome}
      />
    );
  }

  // Show brand selector for root admins without brand context
  const needsBrandSelector = isRootAdmin && !brand && !currentBrandId;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Construtor de Páginas"
        description="Visualize e edite o app inteiro — home, páginas e sessões — em um só lugar."
      />

      {/* Brand selector for root admins */}
      {needsBrandSelector && (
        <div className="mb-6 p-4 rounded-xl border-2 border-dashed border-primary/20 bg-primary/5">
          <Label className="text-sm font-semibold mb-2 block">Selecione a Brand para editar</Label>
          {loadingBrands ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Escolha uma brand..." />
              </SelectTrigger>
              <SelectContent>
                {brands.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      <div className="flex justify-end mb-6">
        <Button onClick={() => setShowCreate(true)} disabled={!effectiveBrandId}>
          <Plus className="h-4 w-4 mr-2" /> Nova Página
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !effectiveBrandId ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Selecione uma brand acima para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Home page entry - always on top */}
          <div
            onClick={() => setEditing(HOME_PAGE_SENTINEL)}
            className="flex items-center gap-4 p-4 rounded-xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors"
          >
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold truncate">Tela Inicial (Home)</h3>
              <p className="text-xs text-muted-foreground truncate">Edite todas as sessões da home do app com preview ao vivo</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                App Principal
              </span>
            </div>
          </div>

          {pages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma página customizada criada ainda.</p>
            </div>
          )}

          {pages.map((page) => (
            <div
              key={page.id}
              onClick={() => setEditing(page)}
              className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-sm hover:bg-accent/5 cursor-pointer transition-all"
            >
              <div className="h-12 w-12 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                <Layers className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{page.title}</h3>
                {(page as any).subtitle && <p className="text-xs text-muted-foreground truncate">{(page as any).subtitle}</p>}
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">/p/{page.slug}</p>
              </div>
              <div className="flex items-center gap-2 text-xs shrink-0">
                <span className={`px-2 py-0.5 rounded-full font-medium ${page.is_published ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                  {page.is_published ? "Publicada" : "Rascunho"}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="sm" variant="outline" className="text-xs hidden sm:flex" onClick={(e) => { e.stopPropagation(); setEditing(page); }}>
                  <Layers className="h-3.5 w-3.5 mr-1" /> Editar Sessões
                </Button>
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleTogglePublish(page); }} title={page.is_published ? "Despublicar" : "Publicar"}>
                  {page.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDelete(page.id); }} title="Excluir">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

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
