import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Link2, FileSpreadsheet, X, Check, Loader2, Download, Upload, Sparkles, Camera, AlertTriangle, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { sugerirCategoria, type CategoriaAchadinho } from "@/lib/categorizadorAchadinhos";

type Step = "method" | "links" | "csv" | "photo" | "photo-links" | "review" | "success";

interface ProductItem {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  price: number | null;
  original_price: number | null;
  store_name: string;
  affiliate_url: string;
  category_id: string | null;
  category_name: string | null;
  _no_match?: boolean; // orphan link flag
  _no_link?: boolean;  // no link flag
}

const CSV_TEMPLATE = "title,affiliate_url,price,original_price,store_name,image_url,description\nProduto Exemplo,https://loja.com/produto,49.90,99.90,Loja X,https://img.com/foto.jpg,Descrição curta";

export default function AchadinhosMobileImportPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentBrandId } = useBrandGuard();
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const correctPhotoRef = useRef<HTMLInputElement>(null);
  const productImageRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("method");
  const [linksText, setLinksText] = useState("");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [scrapeProgress, setScrapeProgress] = useState({ done: 0, total: 0 });
  const [isScraping, setIsScraping] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState({ done: 0, total: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedProducts, setExtractedProducts] = useState<ProductItem[]>([]);
  const [photoLinksText, setPhotoLinksText] = useState("");
  const [correctingId, setCorrectingId] = useState<string | null>(null);
  const [flowSource, setFlowSource] = useState<"links" | "csv" | "photo">("links");
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);

  // ── Fetch categories for auto-suggestion ──
  const { data: categoriasRaw } = useQuery({
    queryKey: ["affiliate-categories", currentBrandId],
    queryFn: async () => {
      if (!currentBrandId) return [];
      const { data } = await supabase
        .from("affiliate_deal_categories")
        .select("id, name, keywords")
        .eq("brand_id", currentBrandId)
        .eq("is_active", true)
        .order("order_index");
      return (data || []) as CategoriaAchadinho[];
    },
    enabled: !!currentBrandId,
  });
  const categorias = useMemo(() => categoriasRaw || [], [categoriasRaw]);

  // ── Auto-categorize products when entering review ──
  const autoCategorizar = useCallback((items: ProductItem[]) => {
    if (categorias.length === 0) return items;
    return items.map(p => {
      if (p.category_id) return p; // already has category (from scrape)
      const sugestao = sugerirCategoria(p.title, p.description, null, p.store_name, categorias);
      if (sugestao) {
        return { ...p, category_id: sugestao.id, category_name: sugestao.name };
      }
      return p;
    });
  }, [categorias]);

  const updateProduct = useCallback((id: string, field: keyof ProductItem, value: string | number | null) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  }, []);

  // ── Convert file to base64 ──
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // ── Extract products from image ──
  const extractFromImage = useCallback(async (base64: string): Promise<ProductItem[]> => {
    const { data, error } = await supabase.functions.invoke("extract-products-from-image", {
      body: { image_base64: base64 },
    });

    if (error) throw error;

    const items: ProductItem[] = (data?.products || []).map((p: any) => ({
      id: crypto.randomUUID(),
      title: p.title || "Produto",
      description: p.description || "",
      image_url: null,
      price: p.price ?? null,
      original_price: p.original_price ?? null,
      store_name: p.store_name || "",
      affiliate_url: "",
      category_id: null,
      category_name: null,
    }));

    return items;
  }, []);

  // ── Handle photo selection ──
  const handlePhotoSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      const base64 = await fileToBase64(file);
      const items = await extractFromImage(base64);

      if (items.length === 0) {
        toast.error("Nenhum produto encontrado na imagem.");
        setIsExtracting(false);
        return;
      }

      setExtractedProducts(items);
      toast.success(`${items.length} produto(s) encontrado(s) na imagem!`);
      setStep("photo-links");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao analisar imagem. Tente novamente.");
    }
    setIsExtracting(false);
    // Reset input
    e.target.value = "";
  }, [extractFromImage]);

  // ── Associate links with extracted products ──
  const handleAssociateLinks = useCallback(async () => {
    const links = photoLinksText
      .split("\n")
      .map(l => l.trim())
      .filter(l => l.length > 5);

    const result: ProductItem[] = [];

    // Pair products with links
    for (let i = 0; i < extractedProducts.length; i++) {
      result.push({
        ...extractedProducts[i],
        affiliate_url: links[i] || "",
        _no_link: !links[i],
      });
    }

    // Orphan links (more links than products)
    for (let i = extractedProducts.length; i < links.length; i++) {
      result.push({
        id: crypto.randomUUID(),
        title: `Link ${i + 1} (sem correspondência)`,
        description: "",
        image_url: null,
        price: null,
        original_price: null,
        store_name: "",
        affiliate_url: links[i],
        category_id: null,
        category_name: null,
        _no_match: true,
      });
    }

    setProducts(autoCategorizar(result));

    // Scrape links to enrich with images & categories
    const itemsWithLinks = result.filter(p => p.affiliate_url && p.affiliate_url.length > 5);
    if (itemsWithLinks.length > 0) {
      setIsScraping(true);
      setScrapeProgress({ done: 0, total: itemsWithLinks.length });
      setStep("review");

      const enriched = [...result];

      for (let i = 0; i < itemsWithLinks.length; i += 5) {
        const batch = itemsWithLinks.slice(i, i + 5);
        const promises = batch.map(async (item) => {
          try {
            const { data } = await supabase.functions.invoke("scrape-product", {
              body: { url: item.affiliate_url, brand_id: currentBrandId },
            });
            if (data?.success && data.product) {
              return { id: item.id, product: data.product };
            }
          } catch { /* skip */ }
          return null;
        });

        const batchResults = await Promise.all(promises);
        batchResults.forEach(r => {
          if (!r) return;
          const idx = enriched.findIndex(p => p.id === r.id);
          if (idx === -1) return;
          const scraped = r.product;
          enriched[idx] = {
            ...enriched[idx],
            image_url: enriched[idx].image_url || scraped.image_url || null,
            category_id: enriched[idx].category_id || scraped.category_id || null,
            category_name: enriched[idx].category_name || scraped.category_name || null,
            store_name: enriched[idx].store_name || scraped.store_name || "",
          };
        });

        setScrapeProgress({ done: Math.min(i + batch.length, itemsWithLinks.length), total: itemsWithLinks.length });
        setProducts(autoCategorizar([...enriched]));
      }

      setIsScraping(false);
      toast.success("Imagens e categorias buscadas dos links!");
    } else {
      setStep("review");
    }
  }, [photoLinksText, extractedProducts, currentBrandId]);

  // ── Correct single product via photo ──
  const handleCorrectViaPhoto = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !correctingId) return;

    setIsExtracting(true);
    try {
      const base64 = await fileToBase64(file);
      const items = await extractFromImage(base64);
      if (items.length > 0) {
        const extracted = items[0];
        setProducts(prev => prev.map(p => {
          if (p.id !== correctingId) return p;
          return {
            ...p,
            title: extracted.title || p.title,
            description: extracted.description || p.description,
            price: extracted.price ?? p.price,
            original_price: extracted.original_price ?? p.original_price,
            store_name: extracted.store_name || p.store_name,
          };
        }));
        toast.success("Dados atualizados via IA!");
      } else {
        toast.error("Nenhum produto encontrado na imagem.");
      }
    } catch {
      toast.error("Erro ao analisar imagem.");
    }
    setIsExtracting(false);
    setCorrectingId(null);
    e.target.value = "";
  }, [correctingId, extractFromImage]);

  // ── Upload product image ──
  const handleProductImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingImageId) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB.");
      e.target.value = "";
      return;
    }

    setUploadingImageId(uploadingImageId);
    const targetId = uploadingImageId;
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const filePath = `achadinhos/${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;
      const { error } = await supabase.storage.from("brand-assets").upload(filePath, file, { upsert: true });

      if (error) {
        toast.error("Erro no upload: " + error.message);
        return;
      }

      const { data: urlData } = supabase.storage.from("brand-assets").getPublicUrl(filePath);
      updateProduct(targetId, "image_url", urlData.publicUrl);
      toast.success("Imagem adicionada!");
    } catch {
      toast.error("Erro ao enviar imagem.");
    }
    setUploadingImageId(null);
    e.target.value = "";
  }, [uploadingImageId, updateProduct]);

  // ── Scrape links ──
  const handleScrapeLinks = useCallback(async () => {
    const urls = linksText.split("\n").map(l => l.trim()).filter(l => l.length > 5);
    if (urls.length === 0) { toast.error("Cole pelo menos um link."); return; }

    setIsScraping(true);
    setScrapeProgress({ done: 0, total: urls.length });
    const results: ProductItem[] = [];

    for (let i = 0; i < urls.length; i += 5) {
      const batch = urls.slice(i, i + 5);
      const promises = batch.map(async (url) => {
        try {
          const { data } = await supabase.functions.invoke("scrape-product", {
            body: { url, brand_id: currentBrandId },
          });
          if (data?.success && data.product) {
            const p = data.product;
            return {
              id: crypto.randomUUID(),
              title: p.title || url,
              description: p.description || "",
              image_url: p.image_url,
              price: p.price,
              original_price: p.original_price,
              store_name: p.store_name || "",
              affiliate_url: url,
              category_id: p.category_id,
              category_name: p.category_name,
            } as ProductItem;
          }
        } catch { /* skip */ }
        return null;
      });
      const batchResults = await Promise.all(promises);
      batchResults.forEach(r => { if (r) results.push(r); });
      setScrapeProgress({ done: Math.min(i + batch.length, urls.length), total: urls.length });
    }

    setProducts(autoCategorizar(results));
    setIsScraping(false);
    if (results.length === 0) {
      toast.error("Nenhum produto encontrado nos links.");
    } else {
      toast.success(`${results.length} produto(s) encontrado(s)!`);
      setStep("review");
    }
  }, [linksText, currentBrandId]);

  // ── CSV import ──
  const handleCsvFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) { toast.error("CSV vazio ou sem dados."); return; }
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const items: ProductItem[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = cols[idx] || ""; });
        items.push({
          id: crypto.randomUUID(),
          title: row.title || row.titulo || `Produto ${i}`,
          description: row.description || row.descricao || "",
          image_url: row.image_url || row.imagem || null,
          price: row.price ? parseFloat(row.price.replace(",", ".")) : null,
          original_price: row.original_price ? parseFloat(row.original_price.replace(",", ".")) : null,
          store_name: row.store_name || row.loja || "",
          affiliate_url: row.affiliate_url || row.link || row.url || "",
          category_id: null,
          category_name: null,
        });
      }
      setProducts(autoCategorizar(items));
      toast.success(`${items.length} produto(s) carregado(s) do CSV.`);
      setStep("review");
    };
    reader.readAsText(file);
  }, []);

  const downloadTemplate = useCallback(() => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-achadinhos.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const removeProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  // ── Publish ──
  const handlePublish = useCallback(async () => {
    if (!currentBrandId || products.length === 0) return;
    setIsPublishing(true);
    setPublishProgress({ done: 0, total: products.length });
    let successCount = 0;
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const { error } = await supabase.from("affiliate_deals").insert({
        brand_id: currentBrandId,
        title: p.title,
        description: p.description,
        image_url: p.image_url,
        price: p.price,
        original_price: p.original_price,
        store_name: p.store_name,
        affiliate_url: p.affiliate_url || "https://example.com",
        category_id: p.category_id,
        is_active: true,
        order_index: i,
      });
      if (!error) successCount++;
      setPublishProgress({ done: i + 1, total: products.length });
    }
    setIsPublishing(false);
    queryClient.invalidateQueries({ queryKey: ["affiliate-deals"] });
    if (successCount > 0) {
      toast.success(`${successCount} achadinho(s) publicado(s)!`);
      setStep("success");
    } else {
      toast.error("Falha ao publicar. Tente novamente.");
    }
  }, [products, currentBrandId, queryClient]);

  const getStepIndex = () => {
    if (flowSource === "photo") {
      if (step === "method") return 0;
      if (step === "photo") return 1;
      if (step === "photo-links") return 2;
      if (step === "review") return 3;
      return 4;
    }
    if (step === "method") return 0;
    if (step === "links" || step === "csv") return 1;
    if (step === "review") return 2;
    return 3;
  };

  const totalSteps = flowSource === "photo" ? 4 : 3;

  const handleBack = () => {
    if (step === "method") navigate(-1);
    else if (step === "links" || step === "csv" || step === "photo") setStep("method");
    else if (step === "photo-links") setStep("photo");
    else if (step === "review") {
      if (flowSource === "photo") setStep("photo-links");
      else setStep("method");
    }
    else navigate("/affiliate-deals");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fixed Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold truncate">Importar Achadinhos</h1>
      </header>

      {/* Step Indicator */}
      {step !== "success" && (
        <div className="flex items-center gap-2 px-6 py-3 justify-center">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${i <= getStepIndex() ? "bg-primary w-8" : "bg-muted w-6"}`}
            />
          ))}
        </div>
      )}

      {/* Hidden file inputs */}
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCsvFile} />
      <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
      <input ref={productImageRef} type="file" accept="image/*" className="hidden" onChange={handleProductImageUpload} />

      {/* Content */}
      <div className="flex-1 px-4 pb-8 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* ── STEP: Method ── */}
          {step === "method" && (
            <motion.div key="method" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 pt-4">
              <p className="text-muted-foreground text-sm text-center">Como deseja importar os achadinhos?</p>

              <Card className="cursor-pointer hover:border-primary transition-colors active:scale-[0.98]" onClick={() => { setFlowSource("links"); setStep("links"); }}>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Link2 className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">Colar Links</h3>
                    <p className="text-muted-foreground text-sm mt-0.5">Cole vários links de produtos. Buscamos título, preço e imagem automaticamente.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary transition-colors active:scale-[0.98]" onClick={() => { setFlowSource("photo"); setStep("photo"); }}>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Camera className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">Print da Oferta</h3>
                    <p className="text-muted-foreground text-sm mt-0.5">Envie um print com vários produtos. A IA identifica todos automaticamente.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary transition-colors active:scale-[0.98]" onClick={() => { setFlowSource("csv"); setStep("csv"); }}>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="h-14 w-14 rounded-xl bg-accent/50 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="h-7 w-7 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">Importar Planilha</h3>
                    <p className="text-muted-foreground text-sm mt-0.5">Envie um CSV com seus produtos já organizados.</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── STEP: Links ── */}
          {step === "links" && (
            <motion.div key="links" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 pt-4">
              <p className="text-muted-foreground text-sm">Cole os links dos produtos, um por linha.</p>
              <Textarea value={linksText} onChange={e => setLinksText(e.target.value)} placeholder={"https://loja.com/produto-1\nhttps://loja.com/produto-2"} className="min-h-[180px] text-base" />
              {isScraping && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 animate-pulse text-primary" />Buscando produtos...</span>
                    <span>{scrapeProgress.done} de {scrapeProgress.total}</span>
                  </div>
                  <Progress value={(scrapeProgress.done / scrapeProgress.total) * 100} className="h-2" />
                </div>
              )}
              <Button className="w-full h-12 text-base" onClick={handleScrapeLinks} disabled={isScraping || !linksText.trim()}>
                {isScraping ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Sparkles className="h-5 w-5 mr-2" />}
                Buscar Produtos
              </Button>
            </motion.div>
          )}

          {/* ── STEP: CSV ── */}
          {step === "csv" && (
            <motion.div key="csv" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 pt-4">
              <p className="text-muted-foreground text-sm">Envie um arquivo CSV com os dados dos produtos.</p>
              <Button variant="outline" className="w-full h-12 text-base" onClick={downloadTemplate}>
                <Download className="h-5 w-5 mr-2" />Baixar Template CSV
              </Button>
              <Button className="w-full h-12 text-base" onClick={() => fileRef.current?.click()}>
                <Upload className="h-5 w-5 mr-2" />Escolher Arquivo
              </Button>
            </motion.div>
          )}

          {/* ── STEP: Photo ── */}
          {step === "photo" && (
            <motion.div key="photo" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 pt-4">
              <p className="text-muted-foreground text-sm">Envie um screenshot com os produtos. A IA vai extrair título, preço e loja de cada um.</p>

              {isExtracting ? (
                <div className="flex flex-col items-center gap-4 py-12">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                  </div>
                  <p className="text-sm text-muted-foreground">Analisando imagem com IA...</p>
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Button className="w-full h-12 text-base" onClick={() => photoRef.current?.click()}>
                  <Camera className="h-5 w-5 mr-2" />
                  Selecionar Imagem
                </Button>
              )}
            </motion.div>
          )}

          {/* ── STEP: Photo Links ── */}
          {step === "photo-links" && (
            <motion.div key="photo-links" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 pt-4">
              <p className="text-sm font-medium">{extractedProducts.length} produto(s) encontrado(s) na imagem:</p>

              <div className="space-y-2 max-h-[30vh] overflow-y-auto">
                {extractedProducts.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                    <Badge variant="secondary" className="shrink-0">{idx + 1}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{p.title}</p>
                      {p.price != null && (
                        <p className="text-xs text-primary font-semibold">R$ {p.price.toFixed(2).replace(".", ",")}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">
                  Cole os links de afiliado, um por linha. O link 1 será associado ao produto 1, e assim por diante.
                </p>
                <Textarea
                  value={photoLinksText}
                  onChange={e => setPhotoLinksText(e.target.value)}
                  placeholder={extractedProducts.map((_, i) => `https://link-produto-${i + 1}`).join("\n")}
                  className="min-h-[120px] text-base"
                />
                {(() => {
                  const linkCount = photoLinksText.split("\n").filter(l => l.trim().length > 5).length;
                  const prodCount = extractedProducts.length;
                  if (linkCount > 0 && linkCount !== prodCount) {
                    return (
                      <p className="text-xs flex items-center gap-1 text-amber-600">
                        <AlertTriangle className="h-3 w-3" />
                        {linkCount > prodCount
                          ? `${linkCount - prodCount} link(s) extra sem produto correspondente`
                          : `${prodCount - linkCount} produto(s) ficarão sem link`}
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>

              <Button className="w-full h-12 text-base" onClick={handleAssociateLinks} disabled={isScraping}>
                <Check className="h-5 w-5 mr-2" />
                Associar Links e Revisar
              </Button>
            </motion.div>
          )}

          {/* ── STEP: Review ── */}
          {step === "review" && (
            <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{products.length} produto{products.length !== 1 ? "s" : ""} pronto{products.length !== 1 ? "s" : ""}</h2>
                <Badge variant="secondary">{products.length}</Badge>
              </div>

              {isScraping && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Buscando imagens... {scrapeProgress.done}/{scrapeProgress.total}</span>
                  </div>
                  <Progress value={scrapeProgress.total > 0 ? (scrapeProgress.done / scrapeProgress.total) * 100 : 0} className="h-2" />
                </div>
              )}

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {products.map(p => (
                  <Card key={p.id} className={`overflow-hidden ${p._no_match ? "border-amber-400" : ""}`}>
                    <CardContent
                      className="p-3 flex gap-3 cursor-pointer"
                      onClick={() => setEditingId(prev => prev === p.id ? null : p.id)}
                    >
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.title} className="h-16 w-16 rounded-lg object-cover shrink-0 bg-muted" />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                          <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-2">{p.title}</p>
                        {p.store_name && <p className="text-xs text-muted-foreground mt-0.5">{p.store_name}</p>}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {p.price != null && (
                            <span className="text-sm font-bold text-primary">R$ {p.price.toFixed(2).replace(".", ",")}</span>
                          )}
                          {p.original_price != null && p.original_price > (p.price || 0) && (
                            <span className="text-xs text-muted-foreground line-through">R$ {p.original_price.toFixed(2).replace(".", ",")}</span>
                          )}
                          {p._no_match && <Badge variant="outline" className="text-amber-600 border-amber-400 text-[10px]">Sem correspondência</Badge>}
                          {p._no_link && <Badge variant="outline" className="text-amber-600 border-amber-400 text-[10px]">Sem link</Badge>}
                          {p.category_name && (
                            <Badge variant="secondary" className="text-[10px] gap-0.5">
                              <Tag className="h-2.5 w-2.5" />
                              {p.category_name}
                            </Badge>
                          )}
                          {!p.category_id && !p._no_match && (
                            <Badge variant="outline" className="text-muted-foreground text-[10px]">Sem categoria</Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0 self-start" onClick={(e) => { e.stopPropagation(); removeProduct(p.id); }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </CardContent>
                    {editingId === p.id && (
                      <div className="px-3 pb-3 space-y-2 border-t pt-2" onClick={e => e.stopPropagation()}>
                        {/* Product image upload */}
                        <div className="flex items-center gap-3">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.title} className="h-20 w-20 rounded-lg object-cover border" />
                          ) : (
                            <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center border border-dashed">
                              <Camera className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            disabled={uploadingImageId === p.id}
                            onClick={() => {
                              setUploadingImageId(p.id);
                              productImageRef.current?.click();
                            }}
                          >
                            {uploadingImageId === p.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Upload className="h-3.5 w-3.5" />
                            )}
                            {p.image_url ? "Trocar" : "Adicionar imagem"}
                          </Button>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Título</label>
                          <Input value={p.title} onChange={e => updateProduct(p.id, "title", e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Descrição</label>
                          <Textarea value={p.description} onChange={e => updateProduct(p.id, "description", e.target.value)} className="min-h-[60px]" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground">Preço</label>
                            <Input type="number" step="0.01" value={p.price ?? ""} onChange={e => updateProduct(p.id, "price", e.target.value ? parseFloat(e.target.value) : null)} />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Preço original</label>
                            <Input type="number" step="0.01" value={p.original_price ?? ""} onChange={e => updateProduct(p.id, "original_price", e.target.value ? parseFloat(e.target.value) : null)} />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Categoria</label>
                          <Select
                            value={p.category_id || "none"}
                            onValueChange={(val) => {
                              const cat = categorias.find(c => c.id === val);
                              setProducts(prev => prev.map(item =>
                                item.id === p.id
                                  ? { ...item, category_id: val === "none" ? null : val, category_name: cat?.name || null }
                                  : item
                              ));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecionar categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sem categoria</SelectItem>
                              {categorias.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Link de afiliado</label>
                          <Input value={p.affiliate_url} onChange={e => updateProduct(p.id, "affiliate_url", e.target.value)} placeholder="https://..." />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          disabled={isExtracting}
                          onClick={() => {
                            setCorrectingId(p.id);
                            correctPhotoRef.current?.click();
                          }}
                        >
                          {isExtracting && correctingId === p.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Camera className="h-4 w-4 mr-2" />
                          )}
                          Corrigir via print
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              {isPublishing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Publicando...</span>
                    <span>{publishProgress.done} de {publishProgress.total}</span>
                  </div>
                  <Progress value={(publishProgress.done / publishProgress.total) * 100} className="h-2" />
                </div>
              )}

              <Button className="w-full h-12 text-base" onClick={handlePublish} disabled={isPublishing || products.length === 0}>
                {isPublishing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Check className="h-5 w-5 mr-2" />}
                Publicar {products.length} Achadinho{products.length !== 1 ? "s" : ""}
              </Button>
            </motion.div>
          )}

          {/* ── STEP: Success ── */}
          {step === "success" && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center pt-16 space-y-6 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.15 }} className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-10 w-10 text-primary" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold">Achadinhos publicados!</h2>
                <p className="text-muted-foreground text-sm mt-1">Seus produtos já estão disponíveis na vitrine.</p>
              </div>
              <div className="space-y-3 w-full">
                <Button className="w-full h-12 text-base" onClick={() => navigate("/affiliate-deals")}>Ver Achadinhos</Button>
                <Button variant="outline" className="w-full h-12 text-base" onClick={() => { setProducts([]); setLinksText(""); setPhotoLinksText(""); setExtractedProducts([]); setStep("method"); }}>
                  Importar Mais
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
