import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, GripVertical, FileText, Loader2, ExternalLink } from "lucide-react";
import ElementEditor from "@/components/page-builder/ElementEditor";
import PagePreview from "@/components/page-builder/PagePreview";
import type { PageElement } from "@/components/page-builder/types";

interface CustomPage {
  id: string;
  brand_id: string;
  title: string;
  slug: string;
  is_published: boolean;
  elements_json: PageElement[];
  permissions_json: any;
  tags_json: any[];
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
  const [saving, setSaving] = useState(false);
  const [previewPage, setPreviewPage] = useState<CustomPage | null>(null);

  useEffect(() => {
    if (!brand) return;
    fetchPages();
  }, [brand]);

  const fetchPages = async () => {
    if (!brand) return;
    setLoading(true);
    const { data } = await supabase
      .from("custom_pages")
      .select("*")
      .eq("brand_id", brand.id)
      .order("created_at", { ascending: false });
    setPages((data as any[]) || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!brand || !newTitle.trim() || !newSlug.trim()) return;
    setSaving(true);
    const slug = newSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    const { error } = await supabase.from("custom_pages").insert({
      brand_id: brand.id,
      title: newTitle.trim(),
      slug,
      elements_json: [],
      permissions_json: {},
      tags_json: [],
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Página criada!" });
      setShowCreate(false);
      setNewTitle("");
      setNewSlug("");
      fetchPages();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta página?")) return;
    await supabase.from("custom_pages").delete().eq("id", id);
    toast({ title: "Página excluída" });
    fetchPages();
  };

  const handleTogglePublish = async (page: CustomPage) => {
    await supabase.from("custom_pages").update({ is_published: !page.is_published }).eq("id", page.id);
    fetchPages();
  };

  const handleSaveElements = async (pageId: string, elements: PageElement[]) => {
    const { error } = await supabase.from("custom_pages").update({ elements_json: elements as any }).eq("id", pageId);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Página salva!" });
      fetchPages();
    }
  };

  if (editing) {
    return (
      <ElementEditor
        page={editing}
        onSave={(elements) => {
          handleSaveElements(editing.id, elements);
          setEditing({ ...editing, elements_json: elements });
        }}
        onBack={() => setEditing(null)}
        onPreview={() => setPreviewPage(editing)}
      />
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader title="Construtor de Páginas" description="Crie páginas customizadas com elementos visuais configuráveis." />

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
            <div key={page.id} className="flex items-center gap-4 p-4 rounded-xl border bg-card">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{page.title}</h3>
                <p className="text-xs text-muted-foreground">/p/{page.slug}</p>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className={`px-2 py-0.5 rounded-full font-medium ${page.is_published ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                  {page.is_published ? "Publicada" : "Rascunho"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => handleTogglePublish(page)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditing(page)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(page.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Página</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input value={newTitle} onChange={(e) => { setNewTitle(e.target.value); setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")); }} placeholder="Ex: Promoções de Verão" />
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
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview overlay */}
      {previewPage && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-bold text-sm">Preview: {previewPage.title}</span>
              <Button size="sm" variant="outline" onClick={() => setPreviewPage(null)}>Fechar</Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <PagePreview elements={previewPage.elements_json} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
