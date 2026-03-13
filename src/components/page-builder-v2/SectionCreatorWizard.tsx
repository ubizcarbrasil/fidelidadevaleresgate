import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft, ArrowRight, Check, Loader2,
  ShoppingBag, Store, Tag, Link2, Image as ImageIcon,
  Info, LayoutGrid, LayoutList, GalleryHorizontal,
  Columns2, Columns3, Columns4, RectangleHorizontal,
  Square, CircleDot, Rows3, Star, FolderTree, Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import SectionWizardPreview from "./SectionWizardPreview";

/* ─── Types ─── */

interface ContentType {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  templateKeys: string[];
}

interface LayoutOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface Props {
  brandId: string;
  pageId?: string | null; // null = home
  currentSectionCount: number;
  onCreated: () => void;
  onCancel: () => void;
}

/* ─── Constants ─── */

const CONTENT_TYPES: ContentType[] = [
  {
    id: "offers",
    label: "Ofertas",
    description: "Cupons e promoções das lojas parceiras",
    icon: <Tag className="h-6 w-6" />,
    templateKeys: ["offers_carousel", "offers_grid"],
  },
  {
    id: "stores",
    label: "Parceiros",
    description: "Lojas e estabelecimentos da rede",
    icon: <Store className="h-6 w-6" />,
    templateKeys: ["stores_grid", "stores_list"],
  },
  {
    id: "vouchers",
    label: "Cupons / Vouchers",
    description: "Cards de cupons resgatáveis",
    icon: <ShoppingBag className="h-6 w-6" />,
    templateKeys: ["vouchers_cards"],
  },
  {
    id: "links",
    label: "Links Manuais",
    description: "Atalhos personalizados com ícones",
    icon: <Link2 className="h-6 w-6" />,
    templateKeys: ["MANUAL_LINKS_CAROUSEL", "MANUAL_LINKS_GRID"],
  },
  {
    id: "banners",
    label: "Banners",
    description: "Carrossel de imagens promocionais",
    icon: <ImageIcon className="h-6 w-6" />,
    templateKeys: ["banner_hero"],
  },
  {
    id: "info",
    label: "Informações",
    description: "Listas ou grades informativas",
    icon: <Info className="h-6 w-6" />,
    templateKeys: ["LIST_INFO", "GRID_INFO", "GRID_LOGOS"],
  },
  {
    id: "highlights",
    label: "Destaques da Semana",
    description: "Seleção especial com destaque visual",
    icon: <Star className="h-6 w-6" />,
    templateKeys: ["highlights_weekly"],
  },
  {
    id: "by_category",
    label: "Por Categoria",
    description: "Filtre lojas ou ofertas por segmento",
    icon: <FolderTree className="h-6 w-6" />,
    templateKeys: ["stores_grid", "offers_carousel"],
  },
];

const LAYOUT_OPTIONS: Record<string, LayoutOption[]> = {
  offers: [
    { id: "carousel", label: "Carrossel", description: "Deslize horizontal", icon: <GalleryHorizontal className="h-5 w-5" /> },
    { id: "grid", label: "Grade", description: "Cards em grid", icon: <LayoutGrid className="h-5 w-5" /> },
  ],
  stores: [
    { id: "grid", label: "Grade", description: "Logos em grid", icon: <LayoutGrid className="h-5 w-5" /> },
    { id: "list", label: "Lista", description: "Lista detalhada", icon: <LayoutList className="h-5 w-5" /> },
  ],
  vouchers: [
    { id: "carousel", label: "Cards", description: "Carrossel de vouchers", icon: <GalleryHorizontal className="h-5 w-5" /> },
  ],
  links: [
    { id: "carousel", label: "Carrossel", description: "Deslize horizontal", icon: <GalleryHorizontal className="h-5 w-5" /> },
    { id: "grid", label: "Grade", description: "Grade de ícones", icon: <LayoutGrid className="h-5 w-5" /> },
  ],
  banners: [
    { id: "carousel", label: "Carrossel", description: "Banners deslizantes", icon: <GalleryHorizontal className="h-5 w-5" /> },
  ],
  info: [
    { id: "list", label: "Lista", description: "Itens empilhados", icon: <LayoutList className="h-5 w-5" /> },
    { id: "grid", label: "Grade", description: "Cards informativos", icon: <LayoutGrid className="h-5 w-5" /> },
    { id: "logos", label: "Logos/Atalhos", description: "Ícones circulares", icon: <CircleDot className="h-5 w-5" /> },
  ],
  highlights: [
    { id: "carousel", label: "Carrossel", description: "Cards grandes em destaque", icon: <GalleryHorizontal className="h-5 w-5" /> },
    { id: "grid", label: "Grade", description: "Grade com destaque visual", icon: <LayoutGrid className="h-5 w-5" /> },
  ],
  by_category: [
    { id: "grid_stores", label: "Grade de Parceiros", description: "Lojas do segmento em grade", icon: <LayoutGrid className="h-5 w-5" /> },
    { id: "carousel_offers", label: "Carrossel de Ofertas", description: "Ofertas do segmento em carrossel", icon: <GalleryHorizontal className="h-5 w-5" /> },
    { id: "grid_offers", label: "Grade de Ofertas", description: "Ofertas do segmento em grade", icon: <LayoutGrid className="h-5 w-5" /> },
  ],
};

const ICON_SIZES = [
  { id: "small", label: "P", px: "48px" },
  { id: "medium", label: "M", px: "64px" },
  { id: "large", label: "G", px: "80px" },
];

const COUPON_FILTERS = [
  { id: "all", label: "Todos" },
  { id: "STORE", label: "Da Loja" },
  { id: "PRODUCT", label: "De Produto" },
];

const FILTER_MODES = [
  { id: "recent", label: "Mais recentes" },
  { id: "most_redeemed", label: "Mais resgatados" },
  { id: "newest", label: "Novos (14 dias)" },
  { id: "random", label: "Aleatório" },
  { id: "featured", label: "Destaques" },
];

/* ─── Wizard Steps ─── */

const STEPS = ["Conteúdo", "Layout", "Aparência", "Detalhes"];

function resolveTemplateKey(contentId: string, layoutId: string): string {
  const map: Record<string, Record<string, string>> = {
    offers: { carousel: "offers_carousel", grid: "offers_grid" },
    stores: { grid: "stores_grid", list: "stores_list" },
    vouchers: { carousel: "vouchers_cards" },
    links: { carousel: "MANUAL_LINKS_CAROUSEL", grid: "MANUAL_LINKS_GRID" },
    banners: { carousel: "banner_hero" },
    info: { list: "LIST_INFO", grid: "GRID_INFO", logos: "GRID_LOGOS" },
    highlights: { carousel: "highlights_weekly", grid: "highlights_weekly" },
    by_category: { grid_stores: "stores_grid", carousel_offers: "offers_carousel", grid_offers: "offers_grid" },
  };
  return map[contentId]?.[layoutId] || "offers_carousel";
}

/* ─── Component ─── */

export default function SectionCreatorWizard({ brandId, pageId, currentSectionCount, onCreated, onCancel }: Props) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 - Content
  const [contentType, setContentType] = useState<string>("");

  // Step 2 - Layout
  const [layoutType, setLayoutType] = useState<string>("");

  // Step 3 - Appearance
  const [iconSize, setIconSize] = useState("medium");
  const [columnsCount, setColumnsCount] = useState(2);
  const [rowsCount, setRowsCount] = useState(1);
  const [maxItems, setMaxItems] = useState(10);
  const [cardRadius, setCardRadius] = useState(16);
  const [cardShadow, setCardShadow] = useState(true);

  // Step 4 - Details
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [hasSubtitle, setHasSubtitle] = useState(false);
  const [ctaText, setCtaText] = useState("");
  const [hasCta, setHasCta] = useState(false);
  const [filterMode, setFilterMode] = useState("recent");
  const [couponFilter, setCouponFilter] = useState("all");
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<string[]>([]);

  // Fetch taxonomy segments for by_category
  const { data: taxonomyData } = useQuery({
    queryKey: ["taxonomy-segments-wizard", brandId],
    enabled: contentType === "by_category",
    queryFn: async () => {
      const [catRes, segRes] = await Promise.all([
        supabase.from("taxonomy_categories").select("*").order("name"),
        supabase.from("taxonomy_segments").select("*").eq("is_active", true).order("name"),
      ]);
      return {
        categories: catRes.data || [],
        segments: segRes.data || [],
      };
    },
  });

  // Auto-fill title from selected segments
  useEffect(() => {
    if (contentType !== "by_category" || !taxonomyData) return;
    if (selectedSegmentIds.length === 0) { setTitle(""); return; }
    if (selectedSegmentIds.length === 1) {
      const seg = taxonomyData.segments.find((s: any) => s.id === selectedSegmentIds[0]);
      if (seg) setTitle(seg.name);
    } else {
      const names = selectedSegmentIds
        .map(id => taxonomyData.segments.find((s: any) => s.id === id)?.name)
        .filter(Boolean);
      setTitle(names.slice(0, 3).join(", ") + (names.length > 3 ? "..." : ""));
    }
  }, [selectedSegmentIds, taxonomyData, contentType]);

  const canNext = () => {
    if (step === 0) return !!contentType;
    if (step === 1) return !!layoutType;
    return true;
  };

  const handleNext = () => {
    if (step === 0 && contentType) {
      const layouts = LAYOUT_OPTIONS[contentType] || [];
      if (layouts.length === 1) {
        setLayoutType(layouts[0].id);
      } else {
        setLayoutType("");
      }
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    if (step === 0) {
      onCancel();
    } else {
      setStep(s => s - 1);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    const templateKey = resolveTemplateKey(contentType, layoutType);

    // Find template_id
    let { data: templates } = await supabase
      .from("section_templates")
      .select("id, key")
      .eq("key", templateKey)
      .limit(1);
    if (!templates?.length) {
      const res = await supabase
        .from("section_templates")
        .select("id, key")
        .eq("type", templateKey as any)
        .limit(1);
      templates = res.data;
    }
    if (!templates?.length) {
      toast({ title: "Template não encontrado", description: `Key: ${templateKey}`, variant: "destructive" });
      setSaving(false);
      return;
    }

    const displayMode = layoutType === "logos" ? "grid" : layoutType;

    const insertData: any = {
      brand_id: brandId,
      template_id: templates[0].id,
      title: title.trim() || null,
      subtitle: hasSubtitle && subtitle.trim() ? subtitle.trim() : null,
      cta_text: hasCta && ctaText.trim() ? ctaText.trim() : null,
      order_index: currentSectionCount,
      is_enabled: true,
      display_mode: displayMode,
      filter_mode: filterMode,
      columns_count: columnsCount,
      rows_count: rowsCount,
      min_stores_visible: 1,
      max_stores_visible: maxItems,
      icon_size: iconSize,
      banner_height: "medium",
      coupon_type_filter: couponFilter === "all" ? null : couponFilter,
      visual_json: { card_radius: cardRadius, card_shadow: cardShadow },
    };
    if (pageId) {
      insertData.page_id = pageId;
    }
    if (contentType === "by_category" && selectedSegmentIds.length > 0) {
      insertData.segment_filter_ids = selectedSegmentIds;
    }

    const { data: inserted, error } = await supabase.from("brand_sections").insert(insertData).select("id").single();
    if (error || !inserted) {
      toast({ title: "Erro ao criar sessão", description: error?.message || "Erro desconhecido", variant: "destructive" });
      setSaving(false);
      return;
    }

    // Determine source_type from layout/content
    let sourceType: string = "STORES";
    if (contentType === "by_category") {
      sourceType = layoutType === "grid_stores" ? "STORES" : "OFFERS";
    } else if (contentType === "offers" || contentType === "highlights") {
      sourceType = "OFFERS";
    } else if (contentType === "vouchers") {
      sourceType = "VOUCHERS";
    } else if (contentType === "stores") {
      sourceType = "STORES";
    }

    // Insert brand_section_sources
    const { error: srcError } = await supabase.from("brand_section_sources").insert({
      brand_section_id: inserted.id,
      source_type: sourceType as any,
      filters_json: {},
      limit: maxItems,
    });
    if (srcError) {
      console.warn("Failed to insert section source:", srcError.message);
    }

    toast({ title: "Sessão criada com sucesso!" });
    onCreated();
    setSaving(false);
  };

  const previewProps = {
    contentType, layoutType, columnsCount, rowsCount, maxItems,
    cardRadius, cardShadow, iconSize, title, subtitle, hasSubtitle,
    ctaText, hasCta,
  };

  return (
    <div className="flex gap-6">
      {/* Wizard form */}
      <div className="p-4 sm:p-6 max-w-2xl mx-auto flex-1 min-w-0">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">Nova Sessão</h1>
          <p className="text-xs text-muted-foreground">{STEPS[step]}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5 mb-8">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= step ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Step 1: Content Type */}
      {step === 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground mb-4">
            O que esta sessão vai exibir?
          </p>
          <div className="grid grid-cols-2 gap-3">
            {CONTENT_TYPES.map((ct) => (
              <button
                key={ct.id}
                onClick={() => setContentType(ct.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center",
                  "hover:border-primary/50 hover:bg-accent/50",
                  contentType === ct.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                  contentType === ct.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {ct.icon}
                </div>
                <span className="font-semibold text-sm">{ct.label}</span>
                <span className="text-[11px] text-muted-foreground leading-tight">{ct.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Layout */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground mb-4">
            Como os itens serão exibidos?
          </p>
          <div className="grid grid-cols-1 gap-3">
            {(LAYOUT_OPTIONS[contentType] || []).map((lo) => (
              <button
                key={lo.id}
                onClick={() => setLayoutType(lo.id)}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                  "hover:border-primary/50 hover:bg-accent/50",
                  layoutType === lo.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                  layoutType === lo.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {lo.icon}
                </div>
                <div>
                  <span className="font-semibold text-sm block">{lo.label}</span>
                  <span className="text-xs text-muted-foreground">{lo.description}</span>
                </div>
                {layoutType === lo.id && (
                  <Check className="h-5 w-5 text-primary ml-auto shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Appearance */}
      {step === 2 && (
        <div className="space-y-5">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Defina a aparência da sessão
          </p>

          {/* Card/icon size */}
          <div className="rounded-xl border p-4 space-y-3">
            <Label className="text-sm font-semibold">Tamanho dos cards</Label>
            <div className="flex gap-2">
              {ICON_SIZES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setIconSize(s.id)}
                  className={cn(
                    "flex-1 py-3 rounded-lg border-2 text-center font-semibold text-sm transition-all",
                    iconSize === s.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  )}
                >
                  {s.label}
                  <span className="block text-[10px] font-normal mt-0.5">{s.px}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Grid config */}
          <div className="rounded-xl border p-4 space-y-4">
            <Label className="text-sm font-semibold">Grade</Label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Colunas</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setColumnsCount(Math.max(1, columnsCount - 1))} disabled={columnsCount <= 1}>-</Button>
                  <span className="text-lg font-bold w-6 text-center">{columnsCount}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setColumnsCount(Math.min(6, columnsCount + 1))} disabled={columnsCount >= 6}>+</Button>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Linhas</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setRowsCount(Math.max(1, rowsCount - 1))} disabled={rowsCount <= 1}>-</Button>
                  <span className="text-lg font-bold w-6 text-center">{rowsCount}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setRowsCount(Math.min(5, rowsCount + 1))} disabled={rowsCount >= 5}>+</Button>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Limite</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setMaxItems(Math.max(1, maxItems - 1))} disabled={maxItems <= 1}>-</Button>
                  <span className="text-lg font-bold w-6 text-center">{maxItems}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setMaxItems(Math.min(50, maxItems + 1))} disabled={maxItems >= 50}>+</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Card style */}
          <div className="rounded-xl border p-4 space-y-4">
            <Label className="text-sm font-semibold">Estilo dos cards</Label>
            <div>
              <Label className="text-xs text-muted-foreground">Arredondamento: {cardRadius}px</Label>
              <Slider
                value={[cardRadius]}
                onValueChange={([v]) => setCardRadius(v)}
                min={0} max={32} step={2}
                className="mt-2"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Sombra nos cards</Label>
              <Switch checked={cardShadow} onCheckedChange={setCardShadow} />
            </div>
          </div>

          {/* Live preview mini */}
          <div className="rounded-xl border p-4">
            <Label className="text-xs text-muted-foreground mb-3 block">Pré-visualização</Label>
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${columnsCount}, 1fr)` }}
            >
              {Array.from({ length: Math.min(columnsCount * rowsCount, maxItems) }).map((_, i) => (
                <div
                  key={i}
                  className={cn("bg-muted/60 aspect-square flex items-center justify-center")}
                  style={{
                    borderRadius: `${cardRadius}px`,
                    boxShadow: cardShadow ? "0 2px 8px -2px hsl(var(--foreground) / 0.1)" : "none",
                  }}
                >
                  <div className="w-6 h-6 rounded-full bg-muted-foreground/20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Details */}
      {step === 3 && (
        <div className="space-y-5">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Finalize as informações
          </p>

          <div className="rounded-xl border p-4 space-y-4">
            <div>
              <Label>Nome da sessão</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Ofertas Imperdíveis"
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">Descrição (subtítulo)</Label>
              <Switch checked={hasSubtitle} onCheckedChange={setHasSubtitle} />
            </div>
            {hasSubtitle && (
              <Input
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                placeholder="Breve descrição da sessão"
              />
            )}

            <div className="flex items-center justify-between">
              <Label className="text-sm">Botão "Ver todos"</Label>
              <Switch checked={hasCta} onCheckedChange={setHasCta} />
            </div>
            {hasCta && (
              <Input
                value={ctaText}
                onChange={e => setCtaText(e.target.value)}
                placeholder="Ex: Ver todas as ofertas"
              />
            )}
          </div>

          {/* Segment picker for by_category */}
          {contentType === "by_category" && taxonomyData && (
            <div className="rounded-xl border p-4 space-y-4">
              <Label className="text-sm font-semibold">Selecione os segmentos</Label>
              {taxonomyData.categories.map((cat: any) => {
                const segs = taxonomyData.segments.filter((s: any) => s.category_id === cat.id);
                if (!segs.length) return null;
                return (
                  <div key={cat.id} className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">{cat.name}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {segs.map((seg: any) => {
                        const checked = selectedSegmentIds.includes(seg.id);
                        return (
                          <label
                            key={seg.id}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm",
                              checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(v) => {
                                setSelectedSegmentIds(prev =>
                                  v ? [...prev, seg.id] : prev.filter(id => id !== seg.id)
                                );
                              }}
                            />
                            <span className="truncate">{seg.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {selectedSegmentIds.length === 0 && (
                <p className="text-xs text-destructive">Selecione ao menos um segmento</p>
              )}
            </div>
          )}

          {/* Filters - only for offers/stores/vouchers */}
          {["offers", "stores", "vouchers", "highlights", "by_category"].includes(contentType) && (
            <div className="rounded-xl border p-4 space-y-4">
              <Label className="text-sm font-semibold">Filtros</Label>
              <div>
                <Label className="text-xs text-muted-foreground">Ordenação</Label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {FILTER_MODES.map(fm => (
                    <button
                      key={fm.id}
                      onClick={() => setFilterMode(fm.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        filterMode === fm.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      {fm.label}
                    </button>
                  ))}
                </div>
              </div>
              {contentType === "offers" && (
                <div>
                  <Label className="text-xs text-muted-foreground">Tipo de oferta</Label>
                  <div className="flex gap-2 mt-1.5">
                    {COUPON_FILTERS.map(cf => (
                      <button
                        key={cf.id}
                        onClick={() => setCouponFilter(cf.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                          couponFilter === cf.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/30"
                        )}
                      >
                        {cf.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Summary card */}
          <div className="rounded-xl bg-muted/50 border p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Resumo</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                {CONTENT_TYPES.find(c => c.id === contentType)?.label}
              </span>
              <span className="px-2 py-1 rounded-md bg-accent text-accent-foreground text-xs font-medium">
                {(LAYOUT_OPTIONS[contentType] || []).find(l => l.id === layoutType)?.label}
              </span>
              <span className="px-2 py-1 rounded-md bg-accent text-accent-foreground text-xs font-medium">
                {columnsCount}col × {rowsCount}lin
              </span>
              <span className="px-2 py-1 rounded-md bg-accent text-accent-foreground text-xs font-medium">
                Máx {maxItems}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex gap-3 mt-8">
        <Button variant="outline" className="flex-1" onClick={handleBack}>
          {step === 0 ? "Cancelar" : "Voltar"}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button className="flex-1" onClick={handleNext} disabled={!canNext()}>
            Próximo <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button className="flex-1" onClick={handleCreate} disabled={saving || !title.trim() || (contentType === "by_category" && selectedSegmentIds.length === 0)}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            <Check className="h-4 w-4 mr-1" /> Criar Sessão
          </Button>
        )}
      </div>
    </div>
  );
}
