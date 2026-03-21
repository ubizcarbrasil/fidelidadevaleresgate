import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Link2, FileSpreadsheet, X, Check, Loader2, Download, Upload, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useQueryClient } from "@tanstack/react-query";

type Step = "method" | "links" | "csv" | "review" | "success";

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
}

const CSV_TEMPLATE = "title,affiliate_url,price,original_price,store_name,image_url,description\nProduto Exemplo,https://loja.com/produto,49.90,99.90,Loja X,https://img.com/foto.jpg,Descrição curta";

export default function AchadinhosMobileImportPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentBrandId } = useBrandGuard();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("method");
  const [linksText, setLinksText] = useState("");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [scrapeProgress, setScrapeProgress] = useState({ done: 0, total: 0 });
  const [isScraping, setIsScraping] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState({ done: 0, total: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);

  const updateProduct = useCallback((id: string, field: keyof ProductItem, value: string | number | null) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  }, []);

  // ── Scrape links ──
  const handleScrapeLinks = useCallback(async () => {
    const urls = linksText
      .split("\n")
      .map(l => l.trim())
      .filter(l => l.length > 5);

    if (urls.length === 0) {
      toast.error("Cole pelo menos um link.");
      return;
    }

    setIsScraping(true);
    setScrapeProgress({ done: 0, total: urls.length });
    const results: ProductItem[] = [];

    // Process in batches of 5
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
        } catch {
          // skip failed
        }
        return null;
      });

      const batchResults = await Promise.all(promises);
      batchResults.forEach(r => { if (r) results.push(r); });
      setScrapeProgress({ done: Math.min(i + batch.length, urls.length), total: urls.length });
    }

    setProducts(results);
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
      if (lines.length < 2) {
        toast.error("CSV vazio ou sem dados.");
        return;
      }
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

      setProducts(items);
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

  const stepIndex = step === "method" ? 0 : step === "links" || step === "csv" ? 1 : step === "review" ? 2 : 3;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fixed Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => {
            if (step === "method") navigate(-1);
            else if (step === "links" || step === "csv") setStep("method");
            else if (step === "review") setStep(products.length > 0 ? "review" : "method");
            else navigate("/affiliate-deals");
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold truncate">Importar Achadinhos</h1>
      </header>

      {/* Step Indicator */}
      {step !== "success" && (
        <div className="flex items-center gap-2 px-6 py-3 justify-center">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i <= stepIndex ? "bg-primary w-8" : "bg-muted w-6"
              }`}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 px-4 pb-8 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* ── STEP: Method ── */}
          {step === "method" && (
            <motion.div
              key="method"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 pt-4"
            >
              <p className="text-muted-foreground text-sm text-center">
                Como deseja importar os achadinhos?
              </p>

              <Card
                className="cursor-pointer hover:border-primary transition-colors active:scale-[0.98]"
                onClick={() => setStep("links")}
              >
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Link2 className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">Colar Links</h3>
                    <p className="text-muted-foreground text-sm mt-0.5">
                      Cole vários links de produtos. Buscamos título, preço e imagem automaticamente.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:border-primary transition-colors active:scale-[0.98]"
                onClick={() => setStep("csv")}
              >
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="h-14 w-14 rounded-xl bg-accent/50 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="h-7 w-7 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">Importar Planilha</h3>
                    <p className="text-muted-foreground text-sm mt-0.5">
                      Envie um CSV com seus produtos já organizados.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── STEP: Links ── */}
          {step === "links" && (
            <motion.div
              key="links"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 pt-4"
            >
              <p className="text-muted-foreground text-sm">
                Cole os links dos produtos, um por linha. Vamos buscar as informações automaticamente.
              </p>

              <Textarea
                value={linksText}
                onChange={e => setLinksText(e.target.value)}
                placeholder={"https://loja.com/produto-1\nhttps://loja.com/produto-2\nhttps://loja.com/produto-3"}
                className="min-h-[180px] text-base"
              />

              {isScraping && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 animate-pulse text-primary" />
                      Buscando produtos...
                    </span>
                    <span>{scrapeProgress.done} de {scrapeProgress.total}</span>
                  </div>
                  <Progress value={(scrapeProgress.done / scrapeProgress.total) * 100} className="h-2" />
                </div>
              )}

              <Button
                className="w-full h-12 text-base"
                onClick={handleScrapeLinks}
                disabled={isScraping || !linksText.trim()}
              >
                {isScraping ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-5 w-5 mr-2" />
                )}
                Buscar Produtos
              </Button>
            </motion.div>
          )}

          {/* ── STEP: CSV ── */}
          {step === "csv" && (
            <motion.div
              key="csv"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 pt-4"
            >
              <p className="text-muted-foreground text-sm">
                Envie um arquivo CSV com os dados dos produtos. Baixe o template para ver o formato esperado.
              </p>

              <Button variant="outline" className="w-full h-12 text-base" onClick={downloadTemplate}>
                <Download className="h-5 w-5 mr-2" />
                Baixar Template CSV
              </Button>

              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCsvFile}
              />

              <Button
                className="w-full h-12 text-base"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-5 w-5 mr-2" />
                Escolher Arquivo
              </Button>
            </motion.div>
          )}

          {/* ── STEP: Review ── */}
          {step === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 pt-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">
                  {products.length} produto{products.length !== 1 ? "s" : ""} pronto{products.length !== 1 ? "s" : ""}
                </h2>
                <Badge variant="secondary">{products.length}</Badge>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {products.map(p => (
                  <Card key={p.id} className="overflow-hidden">
                    <CardContent
                      className="p-3 flex gap-3 cursor-pointer"
                      onClick={() => setEditingId(prev => prev === p.id ? null : p.id)}
                    >
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.title}
                          className="h-16 w-16 rounded-lg object-cover shrink-0 bg-muted"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                          <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-2">{p.title}</p>
                        {p.store_name && (
                          <p className="text-xs text-muted-foreground mt-0.5">{p.store_name}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {p.price != null && (
                            <span className="text-sm font-bold text-primary">
                              R$ {p.price.toFixed(2).replace(".", ",")}
                            </span>
                          )}
                          {p.original_price != null && p.original_price > (p.price || 0) && (
                            <span className="text-xs text-muted-foreground line-through">
                              R$ {p.original_price.toFixed(2).replace(".", ",")}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 self-start"
                        onClick={(e) => { e.stopPropagation(); removeProduct(p.id); }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardContent>
                    {editingId === p.id && (
                      <div className="px-3 pb-3 space-y-2 border-t pt-2" onClick={e => e.stopPropagation()}>
                        <div>
                          <label className="text-xs text-muted-foreground">Título</label>
                          <Input
                            value={p.title}
                            onChange={e => updateProduct(p.id, "title", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Descrição</label>
                          <Textarea
                            value={p.description}
                            onChange={e => updateProduct(p.id, "description", e.target.value)}
                            className="min-h-[60px]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground">Preço</label>
                            <Input
                              type="number"
                              step="0.01"
                              value={p.price ?? ""}
                              onChange={e => updateProduct(p.id, "price", e.target.value ? parseFloat(e.target.value) : null)}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Preço original</label>
                            <Input
                              type="number"
                              step="0.01"
                              value={p.original_price ?? ""}
                              onChange={e => updateProduct(p.id, "original_price", e.target.value ? parseFloat(e.target.value) : null)}
                            />
                          </div>
                        </div>
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

              <Button
                className="w-full h-12 text-base"
                onClick={handlePublish}
                disabled={isPublishing || products.length === 0}
              >
                {isPublishing ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Check className="h-5 w-5 mr-2" />
                )}
                Publicar {products.length} Achadinho{products.length !== 1 ? "s" : ""}
              </Button>
            </motion.div>
          )}

          {/* ── STEP: Success ── */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center pt-16 space-y-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.15 }}
                className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center"
              >
                <Check className="h-10 w-10 text-primary" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold">Achadinhos publicados!</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Seus produtos já estão disponíveis na vitrine.
                </p>
              </div>
              <div className="space-y-3 w-full">
                <Button className="w-full h-12 text-base" onClick={() => navigate("/affiliate-deals")}>
                  Ver Achadinhos
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12 text-base"
                  onClick={() => {
                    setProducts([]);
                    setLinksText("");
                    setStep("method");
                  }}
                >
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
