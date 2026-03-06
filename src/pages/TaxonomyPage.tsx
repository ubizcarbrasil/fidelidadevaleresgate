import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Tag, FolderTree, ChevronRight, icons, Store, ImageIcon } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import IconPickerDialog from "@/components/IconPickerDialog";
import { useBrand } from "@/contexts/BrandContext";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon_name: string | null;
  is_active: boolean;
  order_index: number;
}

interface Segment {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string | null;
  aliases: string[];
  keywords: string[];
  related_segment_ids: string[];
  is_active: boolean;
  order_index: number;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function kebabToPascal(name: string): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function IconPreview({ name, className = "h-4 w-4" }: { name: string | null; className?: string }) {
  if (!name) return <Store className={className + " text-muted-foreground"} />;
  // If it's a URL (custom icon from gallery)
  if (name.startsWith("http")) {
    return <img src={name} alt="icon" className={className + " object-contain"} />;
  }
  const pascalName = kebabToPascal(name);
  const Icon = (icons as Record<string, any>)[pascalName];
  if (!Icon) return <Store className={className + " text-muted-foreground"} />;
  return <Icon className={className} />;
}

function IconPickerField({
  value,
  onChange,
  label,
  brandId,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  brandId?: string;
}) {
  const [open, setOpen] = useState(false);
  const isUrl = value?.startsWith("http");
  const displayName = isUrl ? "Personalizado" : value || "Padrão";

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-lg border flex items-center justify-center shrink-0 bg-muted/30">
          <IconPreview name={value || null} className="h-5 w-5" />
        </div>
        <Button variant="outline" size="sm" className="flex-1 justify-start gap-2" onClick={() => setOpen(true)}>
          {isUrl ? <ImageIcon className="h-3.5 w-3.5" /> : null}
          <span className="truncate text-xs">{displayName}</span>
        </Button>
        {value && (
          <Button variant="ghost" size="sm" onClick={() => onChange("")} className="text-xs text-muted-foreground">
            Limpar
          </Button>
        )}
      </div>
      <IconPickerDialog
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(icon) => {
          if (icon.type === "lucide") {
            // Store as kebab-case for consistency with existing data
            const kebab = icon.name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
            onChange(kebab);
          } else {
            onChange(icon.url);
          }
        }}
        brandId={brandId}
      />
    </div>
  );
}

export default function TaxonomyPage() {
  const { brand } = useBrand();
  const [categories, setCategories] = useState<Category[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Category dialog
  const [catDialog, setCatDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ name: "", icon_name: "" });

  // Segment dialog
  const [segDialog, setSegDialog] = useState(false);
  const [editingSeg, setEditingSeg] = useState<Segment | null>(null);
  const [segForm, setSegForm] = useState({
    name: "",
    description: "",
    aliases: "",
    keywords: "",
    icon_name: "",
  });

  const fetchData = async () => {
    setLoading(true);
    const [catRes, segRes] = await Promise.all([
      supabase.from("taxonomy_categories").select("*").order("order_index"),
      supabase.from("taxonomy_segments").select("*").order("order_index"),
    ]);
    setCategories((catRes.data as Category[]) || []);
    setSegments((segRes.data as Segment[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredSegments = segments.filter((s) => {
    const matchesCat = selectedCategory ? s.category_id === selectedCategory : true;
    if (!search.trim()) return matchesCat;
    const q = search.toLowerCase();
    return (
      matchesCat &&
      (s.name.toLowerCase().includes(q) ||
        s.aliases.some((a) => a.toLowerCase().includes(q)) ||
        s.keywords.some((k) => k.toLowerCase().includes(q)))
    );
  });

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name || "";

  // Category CRUD
  const openNewCat = () => {
    setEditingCat(null);
    setCatForm({ name: "", icon_name: "" });
    setCatDialog(true);
  };

  const openEditCat = (cat: Category) => {
    setEditingCat(cat);
    setCatForm({ name: cat.name, icon_name: cat.icon_name || "" });
    setCatDialog(true);
  };

  const saveCat = async () => {
    const slug = slugify(catForm.name);
    if (editingCat) {
      const { error } = await supabase
        .from("taxonomy_categories")
        .update({ name: catForm.name, slug, icon_name: catForm.icon_name || null })
        .eq("id", editingCat.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Categoria atualizada!");
    } else {
      const { error } = await supabase
        .from("taxonomy_categories")
        .insert({ name: catForm.name, slug, icon_name: catForm.icon_name || null, order_index: categories.length });
      if (error) { toast.error(error.message); return; }
      toast.success("Categoria criada!");
    }
    setCatDialog(false);
    fetchData();
  };

  const deleteCat = async (id: string) => {
    if (!confirm("Excluir categoria e todos os seus segmentos?")) return;
    const { error } = await supabase.from("taxonomy_categories").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Categoria removida!");
    if (selectedCategory === id) setSelectedCategory(null);
    fetchData();
  };

  // Segment CRUD
  const openNewSeg = () => {
    if (!selectedCategory) { toast.error("Selecione uma categoria primeiro"); return; }
    setEditingSeg(null);
    setSegForm({ name: "", description: "", aliases: "", keywords: "", icon_name: "" });
    setSegDialog(true);
  };

  const openEditSeg = (seg: Segment) => {
    setEditingSeg(seg);
    setSegForm({
      name: seg.name,
      description: seg.description || "",
      aliases: seg.aliases.join(", "),
      keywords: seg.keywords.join(", "),
      icon_name: seg.icon_name || "",
    });
    setSegDialog(true);
  };

  const saveSeg = async () => {
    const catId = editingSeg?.category_id || selectedCategory!;
    const slug = slugify(segForm.name);
    const aliases = segForm.aliases.split(",").map((a) => a.trim()).filter(Boolean);
    const keywords = segForm.keywords.split(",").map((k) => k.trim()).filter(Boolean);

    if (editingSeg) {
      const { error } = await supabase
        .from("taxonomy_segments")
        .update({
          name: segForm.name,
          slug,
          description: segForm.description || null,
          aliases,
          keywords,
          icon_name: segForm.icon_name || null,
        })
        .eq("id", editingSeg.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Segmento atualizado!");
    } else {
      const { error } = await supabase
        .from("taxonomy_segments")
        .insert({
          category_id: catId,
          name: segForm.name,
          slug,
          description: segForm.description || null,
          aliases,
          keywords,
          icon_name: segForm.icon_name || null,
          order_index: filteredSegments.length,
        });
      if (error) { toast.error(error.message); return; }
      toast.success("Segmento criado!");
    }
    setSegDialog(false);
    fetchData();
  };

  const deleteSeg = async (id: string) => {
    if (!confirm("Excluir segmento?")) return;
    const { error } = await supabase.from("taxonomy_segments").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Segmento removido!");
    fetchData();
  };

  const segCountByCat = (catId: string) => segments.filter((s) => s.category_id === catId).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Taxonomia de Segmentos"
        description="Gerencie categorias e segmentos para classificação de parceiros e ofertas"
      />

      <Tabs defaultValue="segments" className="w-full">
        <TabsList>
          <TabsTrigger value="segments">
            <FolderTree className="h-4 w-4 mr-1.5" /> Segmentos
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Tag className="h-4 w-4 mr-1.5" /> Logs de Matching
          </TabsTrigger>
        </TabsList>

        <TabsContent value="segments" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Categories Panel */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Categorias ({categories.length})</CardTitle>
                  <Button size="icon" variant="ghost" onClick={openNewCat} className="h-7 w-7">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted/50 ${!selectedCategory ? "bg-primary/10 text-primary font-medium" : ""}`}
                >
                  Todas ({segments.length})
                </button>
                {categories.map((cat) => (
                  <div key={cat.id} className="group flex items-center">
                    <button
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex-1 text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted/50 flex items-center gap-2 ${selectedCategory === cat.id ? "bg-primary/10 text-primary font-medium" : ""}`}
                    >
                      <IconPreview name={cat.icon_name} className="h-4 w-4 shrink-0" />
                      <span className="truncate flex-1">{cat.name}</span>
                      <Badge variant="secondary" className="text-xs ml-auto shrink-0">{segCountByCat(cat.id)}</Badge>
                    </button>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEditCat(cat)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteCat(cat.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Segments Panel */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <CardTitle className="text-sm">
                    {selectedCategory ? getCategoryName(selectedCategory) : "Todos os Segmentos"} ({filteredSegments.length})
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome, alias, keyword..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-8 w-60 text-sm"
                      />
                    </div>
                    <Button size="sm" onClick={openNewSeg}>
                      <Plus className="h-4 w-4 mr-1" /> Segmento
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
                ) : filteredSegments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum segmento encontrado</p>
                ) : (
                  <div className="space-y-2">
                    {filteredSegments.map((seg) => (
                      <div
                        key={seg.id}
                        className="group flex items-start gap-3 p-3 rounded-xl border hover:border-primary/30 transition-colors"
                      >
                        <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
                          <IconPreview name={seg.icon_name} className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{seg.name}</span>
                            {!selectedCategory && (
                              <Badge variant="outline" className="text-xs">
                                {getCategoryName(seg.category_id)}
                              </Badge>
                            )}
                            {seg.icon_name && (
                              <Badge variant="secondary" className="text-[10px] font-mono">
                                {seg.icon_name}
                              </Badge>
                            )}
                          </div>
                          {seg.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{seg.description}</p>
                          )}
                          {seg.aliases.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {seg.aliases.slice(0, 8).map((a, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                                  {a}
                                </Badge>
                              ))}
                              {seg.aliases.length > 8 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  +{seg.aliases.length - 8}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditSeg(seg)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteSeg(seg.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <SynonymLogsTab />
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCat ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="Ex: Alimentação" />
            </div>
             <IconPickerField
               value={catForm.icon_name}
               onChange={(v) => setCatForm({ ...catForm, icon_name: v })}
               label="Ícone da Categoria"
               brandId={brand?.id}
             />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialog(false)}>Cancelar</Button>
            <Button onClick={saveCat} disabled={!catForm.name.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Segment Dialog */}
      <Dialog open={segDialog} onOpenChange={setSegDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSeg ? "Editar Segmento" : "Novo Segmento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={segForm.name} onChange={(e) => setSegForm({ ...segForm, name: e.target.value })} placeholder="Ex: Hamburgueria" />
            </div>
            <IconInput
              value={segForm.icon_name}
              onChange={(v) => setSegForm({ ...segForm, icon_name: v })}
              label="Ícone do Segmento"
            />
            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea value={segForm.description} onChange={(e) => setSegForm({ ...segForm, description: e.target.value })} placeholder="Descreva este segmento..." rows={2} />
            </div>
            <div>
              <Label>Aliases (separados por vírgula)</Label>
              <Textarea
                value={segForm.aliases}
                onChange={(e) => setSegForm({ ...segForm, aliases: e.target.value })}
                placeholder="hamburger, burger, lanche, artesanal"
                rows={2}
              />
              <p className="text-xs text-muted-foreground mt-1">Sinônimos e termos que o cliente pode digitar</p>
            </div>
            <div>
              <Label>Keywords (separadas por vírgula)</Label>
              <Textarea
                value={segForm.keywords}
                onChange={(e) => setSegForm({ ...segForm, keywords: e.target.value })}
                placeholder="fast-food, hambúrguer"
                rows={2}
              />
              <p className="text-xs text-muted-foreground mt-1">Termos de indexação para melhorar a busca</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSegDialog(false)}>Cancelar</Button>
            <Button onClick={saveSeg} disabled={!segForm.name.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SynonymLogsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("segment_synonym_logs")
        .select("*, taxonomy_segments(name, taxonomy_categories(name))")
        .order("created_at", { ascending: false })
        .limit(100);
      setLogs(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Carregando logs...</p>;
  if (logs.length === 0) return <p className="text-sm text-muted-foreground py-8 text-center">Nenhum log de matching registrado ainda</p>;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl border text-sm">
              <div className="flex-1 min-w-0">
                <span className="font-medium">"{log.free_text}"</span>
                {log.taxonomy_segments && (
                  <span className="text-muted-foreground">
                    {" "}→ {log.taxonomy_segments.taxonomy_categories?.name} <ChevronRight className="inline h-3 w-3" /> {log.taxonomy_segments.name}
                  </span>
                )}
              </div>
              <Badge variant={log.was_accepted ? "default" : "secondary"} className="text-xs shrink-0">
                {log.match_method || "—"} ({Math.round(log.match_score)}%)
              </Badge>
              <Badge variant={log.was_accepted ? "default" : "outline"} className="text-xs shrink-0">
                {log.was_accepted ? "Aceito" : "Pendente"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
