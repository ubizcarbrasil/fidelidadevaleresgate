import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Eye, EyeOff, Loader2, FileText, Layers } from "lucide-react";
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

export default function PageBuilderPage() {
  const { brand } = useBrand();
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CustomPage | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPages = useCallback(async () => {
    if (!brand) {
      setLoading(false);
      return;
    }
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
    return (
      <UnifiedEditor
        page={editing}
        onBack={() => { setEditing(null); fetchPages(); }}
      />
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Construtor de Páginas"
        description="Crie páginas customizadas com elementos visuais e sessões dinâmicas de conteúdo."
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
                {(page as any).subtitle && <p className="text-xs text-muted-foreground truncate">{(page as any).subtitle}</p>}
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">/p/{page.slug}</p>
              </div>
              <div className="flex items-center gap-2 text-xs shrink-0">
                <span className={`px-2 py-0.5 rounded-full font-medium ${page.is_published ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                  {page.is_published ? "Publicada" : "Rascunho"}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="icon" variant="ghost" onClick={() => handleTogglePublish(page)} title={page.is_published ? "Despublicar" : "Publicar"}>
                  {page.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditing(page)} title="Editar">
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
