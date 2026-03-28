import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Wand2, Smartphone, Import } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Plus, Pencil, Trash2, ExternalLink, MousePointerClick, X, Upload, Download, Save } from "lucide-react";
import { toast } from "sonner";
import { DataTableControls } from "@/components/DataTableControls";
import { useDebounce } from "@/hooks/useDebounce";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import ImageUploadField from "@/components/ImageUploadField";

const PAGE_SIZE = 20;

interface DealDraft {
  id: string;
  title: string;
  description: string;
  image_url: string;
  store_logo_url: string;
  store_name: string;
  affiliate_url: string;
  price: string;
  original_price: string;
  category: string;
  category_id: string;
  badge_label: string;
  is_redeemable?: boolean;
  redeem_points_cost?: string;
}

const BADGE_SUGGESTIONS = ["Baratinho", "Imperdível", "Oferta Relâmpago", "Mais Vendido", "Exclusivo"];

const newDraft = (): DealDraft => ({
  id: crypto.randomUUID(),
  title: "",
  description: "",
  image_url: "",
  store_logo_url: "",
  store_name: "",
  affiliate_url: "",
  price: "",
  original_price: "",
  category: "",
  category_id: "",
  badge_label: "",
});

export default function AffiliateDealsPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const qc = useQueryClient();
  const { currentBrandId, isRootAdmin } = useBrandGuard();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("list");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  // Bulk manual creation
  const [drafts, setDrafts] = useState<DealDraft[]>([newDraft()]);

  // CSV import
  const [csvRows, setCsvRows] = useState<DealDraft[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);

  // Edit inline in existing table
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<DealDraft | null>(null);

  // Categories for dropdown
  const { data: brandCategories } = useQuery({
    queryKey: ["affiliate-categories", currentBrandId],
    queryFn: async () => {
      if (!currentBrandId) return [];
      const { data } = await supabase
        .from("affiliate_deal_categories")
        .select("id, name, icon_name, color")
        .eq("brand_id", currentBrandId)
        .eq("is_active", true)
        .order("order_index");
      return data || [];
    },
    enabled: !!currentBrandId,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["affiliate-deals", debouncedSearch, page, currentBrandId],
    queryFn: async () => {
      let query = supabase.from("affiliate_deals").select("*", { count: "exact" });
      if (!isRootAdmin && currentBrandId) query = query.eq("brand_id", currentBrandId);
      if (debouncedSearch) query = query.ilike("title", `%${debouncedSearch}%`);
      const from = (page - 1) * PAGE_SIZE;
      const { data, error, count } = await query.order("order_index").range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      return { items: data, total: count || 0 };
    },
  });

  // --- Draft helpers ---
  const addDraft = () => setDrafts((d) => [...d, newDraft()]);
  const removeDraft = (id: string) => setDrafts((d) => d.filter((x) => x.id !== id));
  const updateDraft = (id: string, field: keyof DealDraft, value: string) =>
    setDrafts((d) => d.map((x) => (x.id === id ? { ...x, [field]: value } : x)));

  // --- Scrape product URL ---
  const [scrapingIds, setScrapingIds] = useState<Set<string>>(new Set());

  const scrapeProduct = async (draftId: string) => {
    const draft = drafts.find((d) => d.id === draftId);
    if (!draft?.affiliate_url.trim()) {
      toast.error("Cole o link do produto antes de buscar.");
      return;
    }
    setScrapingIds((s) => new Set(s).add(draftId));
    try {
      const { data, error } = await supabase.functions.invoke("scrape-product", {
        body: { url: draft.affiliate_url.trim(), brand_id: currentBrandId },
      });
      if (error || !data?.success) {
        toast.error(data?.error || error?.message || "Não foi possível buscar dados do produto.");
        return;
      }
      const p = data.product;
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === draftId
            ? {
                ...d,
                title: p.title || d.title,
                description: p.description || d.description,
                image_url: p.image_url || d.image_url,
                price: p.price != null ? String(p.price) : d.price,
                original_price: p.original_price != null ? String(p.original_price) : d.original_price,
                store_name: p.store_name || d.store_name,
                store_logo_url: p.store_logo_url || d.store_logo_url,
                category_id: p.category_id || d.category_id,
                category: p.category_name || d.category,
              }
            : d
        )
      );
      toast.success("Dados do produto preenchidos! Revise e ajuste se necessário.");
    } catch (err: any) {
      toast.error("Erro ao buscar dados do produto.");
    } finally {
      setScrapingIds((s) => {
        const n = new Set(s);
        n.delete(draftId);
        return n;
      });
    }
  };

  // --- Save all drafts ---
  const saveDrafts = useMutation({
    mutationFn: async () => {
      const valid = drafts.filter((d) => d.title.trim() && d.affiliate_url.trim());
      if (!valid.length) throw new Error("Preencha ao menos título e link em um achadinho.");
      if (!currentBrandId) throw new Error("Brand não identificada.");

      const payload = valid.map((d, idx) => ({
        brand_id: currentBrandId,
        title: d.title.trim(),
        description: d.description.trim() || null,
        image_url: d.image_url.trim() || null,
        store_logo_url: d.store_logo_url.trim() || null,
        store_name: d.store_name.trim() || null,
        affiliate_url: d.affiliate_url.trim(),
        price: d.price ? Number(d.price) : null,
        original_price: d.original_price ? Number(d.original_price) : null,
        category: d.category.trim() || null,
        category_id: d.category_id.trim() || null,
        badge_label: d.badge_label.trim() || null,
        is_active: true,
        order_index: idx,
      }));

      const { error } = await supabase.from("affiliate_deals").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["affiliate-deals"] });
      toast.success(`${drafts.filter((d) => d.title && d.affiliate_url).length} achadinhos criados!`);
      setDrafts([newDraft()]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // --- CSV import ---
  const handleCsvUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (!text) return;
        const sep = text.includes(";") ? ";" : ",";
        const lines = text.split("\n").filter((l) => l.trim());
        // skip header
        const rows: DealDraft[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
          // Columns: image_url, description, price, original_price, store_logo_url, affiliate_url
          rows.push({
            id: crypto.randomUUID(),
            image_url: cols[0] || "",
            description: cols[1] || "",
            title: cols[1] || `Achadinho ${i}`,
            price: cols[2] || "",
            original_price: cols[3] || "",
            store_logo_url: cols[4] || "",
            affiliate_url: cols[5] || "",
            store_name: "",
            category: "",
            category_id: "",
            badge_label: "",
          });
        }
        setCsvRows(rows);
        toast.success(`${rows.length} registros carregados da planilha`);
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    []
  );

  const importCsv = useCallback(async () => {
    if (!currentBrandId || !csvRows.length) return;
    setImporting(true);
    setImportProgress(0);
    setImportTotal(csvRows.length);

    const BATCH = 50;
    let done = 0;
    for (let i = 0; i < csvRows.length; i += BATCH) {
      const batch = csvRows.slice(i, i + BATCH).map((d, idx) => ({
        brand_id: currentBrandId,
        title: d.title.trim() || `Achadinho`,
        description: d.description.trim() || null,
        image_url: d.image_url.trim() || null,
        store_logo_url: d.store_logo_url.trim() || null,
        store_name: d.store_name.trim() || null,
        affiliate_url: d.affiliate_url.trim() || "",
        price: d.price ? Number(d.price) : null,
        original_price: d.original_price ? Number(d.original_price) : null,
        category: d.category.trim() || null,
        badge_label: d.badge_label?.trim() || null,
        is_active: true,
        order_index: i + idx,
      }));
      const { error } = await supabase.from("affiliate_deals").insert(batch);
      if (error) {
        toast.error(`Erro no lote ${Math.floor(i / BATCH) + 1}: ${error.message}`);
        break;
      }
      done += batch.length;
      setImportProgress(done);
    }

    setImporting(false);
    qc.invalidateQueries({ queryKey: ["affiliate-deals"] });
    toast.success(`${done} achadinhos importados!`);
    setCsvRows([]);
  }, [csvRows, currentBrandId, qc]);

  // --- Delete ---
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("affiliate_deals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["affiliate-deals"] });
      toast.success("Achadinho removido!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // --- Inline edit ---
  const startEdit = (d: any) => {
    setEditId(d.id);
    setEditForm({
      id: d.id,
      title: d.title || "",
      description: d.description || "",
      image_url: d.image_url || "",
      store_logo_url: d.store_logo_url || "",
      store_name: d.store_name || "",
      affiliate_url: d.affiliate_url || "",
      price: d.price != null ? String(d.price) : "",
      original_price: d.original_price != null ? String(d.original_price) : "",
      category: d.category || "",
      category_id: d.category_id || "",
      badge_label: d.badge_label || "",
      is_redeemable: d.is_redeemable || false,
      redeem_points_cost: d.redeem_points_cost != null ? String(d.redeem_points_cost) : "",
    });
  };

  const saveEdit = useMutation({
    mutationFn: async () => {
      if (!editForm || !editId) return;
      const { error } = await supabase
        .from("affiliate_deals")
        .update({
          title: editForm.title,
          description: editForm.description || null,
          image_url: editForm.image_url || null,
          store_logo_url: editForm.store_logo_url || null,
          store_name: editForm.store_name || null,
          affiliate_url: editForm.affiliate_url,
          price: editForm.price ? Number(editForm.price) : null,
          original_price: editForm.original_price ? Number(editForm.original_price) : null,
          category: editForm.category || null,
          category_id: editForm.category_id || null,
          badge_label: editForm.badge_label?.trim() || null,
          is_redeemable: (editForm as any).is_redeemable || false,
          redeem_points_cost: (editForm as any).redeem_points_cost ? Number((editForm as any).redeem_points_cost) : null,
        } as any)
        .eq("id", editId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["affiliate-deals"] });
      toast.success("Achadinho atualizado!");
      setEditId(null);
      setEditForm(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const downloadTemplate = () => {
    const header = "imagem_produto;descricao;preco;preco_original;logo_loja_parceira;link_afiliado";
    const example = "https://img.com/prod.jpg;Fone Bluetooth;99.90;149.90;https://img.com/logo.png;https://loja.com/produto";
    const blob = new Blob([header + "\n" + example], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_achadinhos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatPrice = (val: number | null | undefined) => {
    if (val == null || val === 0) return null;
    return `R$ ${Number(val).toFixed(2).replace(".", ",")}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Achadinhos</h2>
          <p className="text-muted-foreground">Gerencie ofertas de afiliados do marketplace</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/affiliate-deals/import-mobile")}>
          <Smartphone className="h-4 w-4 mr-2" />
          Importar pelo Celular
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Listagem</TabsTrigger>
          <TabsTrigger value="manual">+ Adicionar em Massa</TabsTrigger>
          <TabsTrigger value="csv">Importar Planilha</TabsTrigger>
        </TabsList>

        {/* ==================== LISTAGEM ==================== */}
        <TabsContent value="list" forceMount className={activeTab !== "list" ? "hidden" : "space-y-4"}>
          <DataTableControls
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder="Buscar achadinho..."
            page={page}
            pageSize={PAGE_SIZE}
            totalCount={data?.total || 0}
            onPageChange={setPage}
          />
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Loja</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Cliques</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && !data?.items?.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum achadinho encontrado
                      </TableCell>
                    </TableRow>
                  )}
                  {data?.items?.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {d.image_url && (
                            <img src={d.image_url} alt="" className="h-8 w-8 rounded object-cover" />
                          )}
                          <span className="font-medium">{d.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {d.store_logo_url && (
                            <img src={d.store_logo_url} alt="" className="h-5 w-5 rounded-sm object-contain" />
                          )}
                          <span className="text-muted-foreground">{d.store_name || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatPrice(d.price) ? (
                          <div>
                            <span className="font-medium">{formatPrice(d.price)}</span>
                            {formatPrice(d.original_price) && (
                              <span className="text-xs text-muted-foreground line-through ml-2">
                                {formatPrice(d.original_price)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MousePointerClick className="h-3 w-3" />
                          {d.click_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={d.is_active ? "default" : "secondary"}>
                          {d.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(d)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <a href={d.affiliate_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove.mutate(d.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Inline edit panel */}
          {editId && editForm && (
            <Card className="border-primary">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Editando: {editForm.title || "Sem título"}</h3>
                  <Button variant="ghost" size="icon" onClick={() => { setEditId(null); setEditForm(null); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Título</Label>
                    <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Link Afiliado</Label>
                    <Input value={editForm.affiliate_url} onChange={(e) => setEditForm({ ...editForm, affiliate_url: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Imagem Produto</Label>
                    <ImageUploadField
                      value={editForm.image_url}
                      onChange={(url) => setEditForm({ ...editForm, image_url: url })}
                      folder="affiliate-deals"
                      label="Imagem do Produto"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Logo Loja Parceira</Label>
                    <ImageUploadField
                      value={editForm.store_logo_url}
                      onChange={(url) => setEditForm({ ...editForm, store_logo_url: url })}
                      folder="affiliate-deals"
                      label="Logo da Loja"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Nome da Loja</Label>
                    <Input value={editForm.store_name} onChange={(e) => setEditForm({ ...editForm, store_name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Descrição</Label>
                    <Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Preço (R$)</Label>
                    <Input type="number" step="0.01" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Preço Original (R$)</Label>
                    <Input type="number" step="0.01" value={editForm.original_price} onChange={(e) => setEditForm({ ...editForm, original_price: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Badge</Label>
                    <Input value={editForm.badge_label} onChange={(e) => setEditForm({ ...editForm, badge_label: e.target.value })} placeholder="Ex: Baratinho, Imperdível" />
                    <div className="flex flex-wrap gap-1 mt-1">
                      {BADGE_SUGGESTIONS.map((b) => (
                        <button key={b} type="button" onClick={() => setEditForm({ ...editForm, badge_label: b })} className="text-[10px] px-2 py-0.5 rounded-full bg-muted hover:bg-accent transition-colors">{b}</button>
                      ))}
                    </div>
                  </div>
                  {/* Resgate com pontos */}
                  <div className="col-span-1 md:col-span-2 border-t pt-3 mt-2 space-y-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={(editForm as any).is_redeemable || false}
                        onCheckedChange={(v) => setEditForm({ ...editForm, is_redeemable: v as any })}
                      />
                      <Label className="text-xs font-medium">Resgatável com Pontos</Label>
                    </div>
                    {(editForm as any).is_redeemable && (
                      <div className="space-y-1">
                        <Label className="text-xs">Custo em Pontos (deixe vazio p/ usar preço × 1)</Label>
                        <Input
                          type="number"
                          value={(editForm as any).redeem_points_cost || ""}
                          onChange={(e) => setEditForm({ ...editForm, redeem_points_cost: e.target.value as any })}
                          placeholder={editForm.price ? `${Math.ceil(Number(editForm.price))} pts (automático)` : "Ex: 500"}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <Button onClick={() => saveEdit.mutate()} disabled={!editForm.title}>
                  <Save className="h-4 w-4 mr-2" />Salvar Edição
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ==================== ADICIONAR EM MASSA ==================== */}
        <TabsContent value="manual" forceMount className={activeTab !== "manual" ? "hidden" : "space-y-4"}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Adicione vários achadinhos de uma vez. Somente título e link são obrigatórios.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={addDraft}>
                <Plus className="h-4 w-4 mr-2" />Adicionar
              </Button>
              <Button
                onClick={() => saveDrafts.mutate()}
                disabled={saveDrafts.isPending || !drafts.some((d) => d.title && d.affiliate_url)}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Todos ({drafts.filter((d) => d.title && d.affiliate_url).length})
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {drafts.map((draft, idx) => (
              <Card key={draft.id} className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => removeDraft(draft.id)}
                  disabled={drafts.length === 1}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
                <CardContent className="p-4 pt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">#{idx + 1}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Título *</Label>
                      <Input
                        value={draft.title}
                        onChange={(e) => updateDraft(draft.id, "title", e.target.value)}
                        placeholder="Ex: Fone Bluetooth Pro"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Link Afiliado *</Label>
                      <div className="flex gap-1">
                        <Input
                          value={draft.affiliate_url}
                          onChange={(e) => updateDraft(draft.id, "affiliate_url", e.target.value)}
                          placeholder="https://..."
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          disabled={!draft.affiliate_url.trim() || scrapingIds.has(draft.id)}
                          onClick={() => scrapeProduct(draft.id)}
                          title="Buscar dados do produto"
                        >
                          {scrapingIds.has(draft.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Wand2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Imagem Produto</Label>
                      <ImageUploadField
                        value={draft.image_url}
                        onChange={(url) => updateDraft(draft.id, "image_url", url)}
                        folder="affiliate-deals"
                        label="Imagem do Produto"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Logo Loja Parceira</Label>
                      <ImageUploadField
                        value={draft.store_logo_url}
                        onChange={(url) => updateDraft(draft.id, "store_logo_url", url)}
                        folder="affiliate-deals"
                        label="Logo da Loja"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Nome da Loja</Label>
                      <Input
                        value={draft.store_name}
                        onChange={(e) => updateDraft(draft.id, "store_name", e.target.value)}
                        placeholder="Ex: Mercado Livre"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Descrição</Label>
                      <Input
                        value={draft.description}
                        onChange={(e) => updateDraft(draft.id, "description", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Preço (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={draft.price}
                        onChange={(e) => updateDraft(draft.id, "price", e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Preço Original (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={draft.original_price}
                        onChange={(e) => updateDraft(draft.id, "original_price", e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Badge</Label>
                      <Input
                        value={draft.badge_label}
                        onChange={(e) => updateDraft(draft.id, "badge_label", e.target.value)}
                        placeholder="Ex: Baratinho"
                      />
                      <div className="flex flex-wrap gap-1 mt-1">
                        {BADGE_SUGGESTIONS.map((b) => (
                          <button key={b} type="button" onClick={() => updateDraft(draft.id, "badge_label", b)} className="text-[10px] px-2 py-0.5 rounded-full bg-muted hover:bg-accent transition-colors">{b}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Categoria</Label>
                      <select
                        value={draft.category_id}
                        onChange={(e) => {
                          const cat = (brandCategories || []).find(c => c.id === e.target.value);
                          updateDraft(draft.id, "category_id", e.target.value);
                          if (cat) updateDraft(draft.id, "category", cat.name);
                        }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Selecionar...</option>
                        {(brandCategories || []).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      {draft.category_id && (
                        <p className="text-[10px] text-muted-foreground">Auto-detectada ou selecionada</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ==================== IMPORTAR PLANILHA ==================== */}
        <TabsContent value="csv" forceMount className={activeTab !== "csv" ? "hidden" : "space-y-4"}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Faça upload de um CSV com as colunas: imagem_produto, descricao, preco, preco_original, logo_loja_parceira, link_afiliado
              </p>
              <p className="text-xs text-muted-foreground mt-1">Separador: ponto-e-vírgula (;) ou vírgula (,)</p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />Template
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 cursor-pointer hover:border-primary/40 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Clique para selecionar arquivo CSV</span>
                <input type="file" accept=".csv,.txt" className="hidden" onChange={handleCsvUpload} />
              </label>
            </CardContent>
          </Card>

          {csvRows.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{csvRows.length} registros carregados</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCsvRows([])}>Limpar</Button>
                  <Button onClick={importCsv} disabled={importing}>
                    <Save className="h-4 w-4 mr-2" />Importar Todos
                  </Button>
                </div>
              </div>

              {importing && (
                <div className="space-y-2">
                  <Progress value={(importProgress / importTotal) * 100} />
                  <p className="text-xs text-muted-foreground text-center">
                    Importando {importProgress} de {importTotal} registros...
                  </p>
                </div>
              )}

              <Card>
                <CardContent className="p-0">
                  <div className="max-h-[400px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Imagem</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead>De</TableHead>
                          <TableHead>Logo Loja</TableHead>
                          <TableHead>Link</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvRows.slice(0, 50).map((r, i) => (
                          <TableRow key={r.id}>
                            <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                            <TableCell>
                              {r.image_url ? (
                                <img src={r.image_url} alt="" className="h-8 w-8 rounded object-cover" />
                              ) : "—"}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">{r.description || "—"}</TableCell>
                            <TableCell>{r.price || "—"}</TableCell>
                            <TableCell>{r.original_price || "—"}</TableCell>
                            <TableCell>
                              {r.store_logo_url ? (
                                <img src={r.store_logo_url} alt="" className="h-5 w-5 rounded-sm object-contain" />
                              ) : "—"}
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate text-xs">{r.affiliate_url || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {csvRows.length > 50 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Mostrando 50 de {csvRows.length} registros
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
      {isMobile && (
        <Button
          onClick={() => navigate("/affiliate-deals/import-mobile")}
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg p-0"
          size="icon"
        >
          <Import className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
