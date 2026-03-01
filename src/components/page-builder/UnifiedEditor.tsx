import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft, Plus, Trash2, GripVertical, Eye, EyeOff, Save, Copy,
  Settings2, Loader2, Layers, Link2, Type, MousePointer, Image as ImageIcon,
  Minus, Square, Smartphone, RefreshCw, ChevronUp, ChevronDown,
  LayoutList, SlidersHorizontal, MonitorSmartphone,
} from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import type { PageElement, PageElementStyle, SectionRow, UnifiedBlock } from "./types";
import { DEFAULT_ELEMENT, ELEMENT_TYPE_LABELS, SECTION_TYPES } from "./types";
import LivePreview from "./LivePreview";
import SectionEditor from "@/components/page-builder-v2/SectionEditor";
import ManualLinksEditor from "@/components/page-builder-v2/ManualLinksEditor";
import StorageImageUpload from "./StorageImageUpload";
import InlineBannerManager from "./InlineBannerManager";

interface PageRow {
  id: string;
  brand_id: string;
  title: string;
  slug: string;
  is_published: boolean;
  elements_json: any;
  subtitle?: string | null;
  search_enabled?: boolean;
  visibility_type?: string;
}

interface Props {
  page: PageRow;
  onBack: () => void;
  isHomePage?: boolean;
}

export default function UnifiedEditor({ page, onBack, isHomePage }: Props) {
  const { brand } = useBrand();
  const isMobile = useIsMobile();
  const [elements, setElements] = useState<PageElement[]>(isHomePage ? [] : ((page.elements_json as PageElement[]) || []));
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Mobile tab state
  const [mobileTab, setMobileTab] = useState<"blocks" | "props" | "preview">("blocks");

  // Sub-editors
  const [editingSection, setEditingSection] = useState<SectionRow | null>(null);
  const [editingManualLinks, setEditingManualLinks] = useState<SectionRow | null>(null);

  // Add dialogs
  const [showAddStatic, setShowAddStatic] = useState(false);
  const [showAddDynamic, setShowAddDynamic] = useState(false);
  const [newSectionType, setNewSectionType] = useState("");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [addingSection, setAddingSection] = useState(false);

  // Page settings
  const [showSettings, setShowSettings] = useState(false);
  const [pageSettings, setPageSettings] = useState({
    title: page.title,
    subtitle: (page as any).subtitle || "",
    search_enabled: (page as any).search_enabled || false,
    visibility_type: (page as any).visibility_type || "public",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Inline editing state for section properties
  const [inlineTitle, setInlineTitle] = useState("");
  const [inlineSubtitle, setInlineSubtitle] = useState("");
  const [inlineCtaText, setInlineCtaText] = useState("");
  const [inlineDisplayMode, setInlineDisplayMode] = useState("");
  const [inlineFilterMode, setInlineFilterMode] = useState("");
  const [inlineCouponTypeFilter, setInlineCouponTypeFilter] = useState("");
  const [inlineColumnsCount, setInlineColumnsCount] = useState(2);
  const [savingInline, setSavingInline] = useState(false);

  const fetchSections = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("brand_sections")
      .select("*, section_templates(key, name, type), brand_section_sources(*)") as any;

    if (isHomePage) {
      query = query.eq("brand_id", brand?.id || page.brand_id).is("page_id", null);
    } else {
      query = query.eq("page_id", page.id);
    }

    const { data } = await query.order("order_index");
    setSections((data as SectionRow[]) || []);
    setLoading(false);
  }, [page.id, page.brand_id, brand?.id, isHomePage]);

  useEffect(() => { fetchSections(); }, [fetchSections]);

  // Build unified block list
  const blocks: UnifiedBlock[] = [];
  if (!isHomePage) {
    elements.forEach((el, idx) => {
      blocks.push({ blockType: "static", id: el.id, orderIndex: idx, element: el });
    });
  }
  sections.forEach((sec) => {
    blocks.push({ blockType: "dynamic", id: sec.id, orderIndex: (isHomePage ? 0 : elements.length) + sec.order_index, section: sec });
  });
  blocks.sort((a, b) => a.orderIndex - b.orderIndex);

  // When selecting a section, populate inline editing fields
  useEffect(() => {
    const selectedBlock = blocks.find(b => b.id === selectedBlockId);
    if (selectedBlock?.blockType === "dynamic") {
      const sec = selectedBlock.section;
      setInlineTitle(sec.title || "");
      setInlineSubtitle(sec.subtitle || "");
      setInlineCtaText(sec.cta_text || "");
      setInlineDisplayMode(sec.display_mode || "carousel");
      setInlineFilterMode(sec.filter_mode || "recent");
      setInlineCouponTypeFilter(sec.coupon_type_filter || "all");
      setInlineColumnsCount(sec.columns_count || 2);
    }
  }, [selectedBlockId]);

  // Auto-switch to props tab on mobile when selecting a block
  useEffect(() => {
    if (isMobile && selectedBlockId) {
      setMobileTab("props");
    }
  }, [selectedBlockId, isMobile]);

  // Static element operations
  const addElement = (type: PageElement["type"]) => {
    const el: PageElement = {
      ...DEFAULT_ELEMENT,
      id: crypto.randomUUID(),
      type,
      content: type === "divider" ? "" : type === "spacer" ? "" : type === "button" ? "Clique aqui" : type === "banner" ? "" : "Texto",
      style: {
        ...DEFAULT_ELEMENT.style,
        ...(type === "button" ? { backgroundColor: "hsl(var(--primary))", color: "#ffffff", textAlign: "center", fontWeight: "bold", borderRadius: "12px" } : {}),
        ...(type === "banner" ? { height: "160px", borderRadius: "16px" } : {}),
        ...(type === "divider" ? { height: "1px", backgroundColor: "#E5E5E5", padding: "0" } : {}),
        ...(type === "spacer" ? { height: "24px", padding: "0" } : {}),
      },
    };
    setElements(prev => [...prev, el]);
    setSelectedBlockId(el.id);
    setShowAddStatic(false);
  };

  const updateElement = (id: string, patch: Partial<PageElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...patch } : el));
  };

  const updateStyle = (id: string, patch: Partial<PageElementStyle>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, style: { ...el.style, ...patch } } : el));
  };

  const removeElement = (id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    setSelectedBlockId(null);
    if (isMobile) setMobileTab("blocks");
  };

  const duplicateElement = (id: string) => {
    const idx = elements.findIndex(el => el.id === id);
    if (idx === -1) return;
    const copy = { ...elements[idx], id: crypto.randomUUID() };
    const newElements = [...elements];
    newElements.splice(idx + 1, 0, copy);
    setElements(newElements);
    setSelectedBlockId(copy.id);
  };

  // Dynamic section operations
  const handleAddSection = async () => {
    if (!brand && !page.brand_id) return;
    if (!newSectionType) return;
    setAddingSection(true);
    const brandId = brand?.id || page.brand_id;
    const { data: templates } = await supabase
      .from("section_templates")
      .select("id, key")
      .eq("key", newSectionType)
      .limit(1);
    if (!templates?.length) {
      toast({ title: "Template não encontrado", variant: "destructive" });
      setAddingSection(false);
      return;
    }
    const maxOrder = sections.length > 0 ? Math.max(...sections.map(s => s.order_index)) + 1 : 0;
    const insertData: any = {
      brand_id: brandId,
      template_id: templates[0].id,
      title: newSectionTitle.trim() || null,
      order_index: maxOrder,
      is_enabled: true,
      display_mode: "carousel",
      filter_mode: "recent",
      columns_count: 2,
      rows_count: 1,
      min_stores_visible: 1,
      icon_size: "medium",
      banner_height: "medium",
    };
    if (!isHomePage) {
      insertData.page_id = page.id;
    }
    const { error } = await supabase.from("brand_sections").insert(insertData);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sessão adicionada!" });
      setShowAddDynamic(false);
      setNewSectionType("");
      setNewSectionTitle("");
      fetchSections();
    }
    setAddingSection(false);
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm("Excluir esta sessão?")) return;
    await supabase.from("brand_sections").delete().eq("id", id);
    toast({ title: "Sessão removida" });
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
      if (isMobile) setMobileTab("blocks");
    }
    fetchSections();
  };

  const handleToggleSection = async (section: SectionRow) => {
    await supabase.from("brand_sections").update({ is_enabled: !section.is_enabled }).eq("id", section.id);
    fetchSections();
  };

  const handleDuplicateSection = async (section: SectionRow) => {
    const brandId = brand?.id || page.brand_id;
    if (!brandId) return;
    const maxOrder = sections.length > 0 ? Math.max(...sections.map(s => s.order_index)) + 1 : 0;
    const { id, section_templates, ...rest } = section as any;
    await supabase.from("brand_sections").insert({
      ...rest,
      order_index: maxOrder,
      title: `${section.title || "Sessão"} (cópia)`,
    });
    toast({ title: "Sessão duplicada!" });
    fetchSections();
  };

  const handleMoveSection = async (sectionId: string, direction: -1 | 1) => {
    const idx = sections.findIndex(s => s.id === sectionId);
    if (idx === -1) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const a = sections[idx];
    const b = sections[newIdx];
    await Promise.all([
      supabase.from("brand_sections").update({ order_index: b.order_index }).eq("id", a.id),
      supabase.from("brand_sections").update({ order_index: a.order_index }).eq("id", b.id),
    ]);
    fetchSections();
  };

  const handleSaveInline = async (sectionId: string) => {
    setSavingInline(true);
    const { error } = await supabase.from("brand_sections").update({
      title: inlineTitle.trim() || null,
      subtitle: inlineSubtitle.trim() || null,
      cta_text: inlineCtaText.trim() || null,
      display_mode: inlineDisplayMode,
      filter_mode: inlineFilterMode,
      coupon_type_filter: inlineCouponTypeFilter === "all" ? null : inlineCouponTypeFilter,
      columns_count: inlineColumnsCount,
    }).eq("id", sectionId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sessão atualizada!" });
      fetchSections();
    }
    setSavingInline(false);
  };

  // Drag-and-drop for static elements
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const copy = [...elements];
    const [moved] = copy.splice(dragIdx, 1);
    copy.splice(idx, 0, moved);
    setElements(copy);
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  // Save all
  const handleSave = async () => {
    if (isHomePage) {
      toast({ title: "Home salva automaticamente ao editar sessões" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("custom_pages").update({
      elements_json: elements as any,
    }).eq("id", page.id);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Página salva!" });
    }
    setSaving(false);
  };

  const handleSavePageSettings = async () => {
    setSavingSettings(true);
    await supabase.from("custom_pages").update({
      title: pageSettings.title,
      subtitle: pageSettings.subtitle || null,
      search_enabled: pageSettings.search_enabled,
      visibility_type: pageSettings.visibility_type,
    } as any).eq("id", page.id);
    toast({ title: "Configurações salvas!" });
    setSavingSettings(false);
    setShowSettings(false);
  };

  const isManualLinksType = (section: SectionRow) => {
    const key = section.section_templates?.key || "";
    return key.includes("MANUAL_LINKS");
  };

  const isBannerCarouselType = (section: SectionRow) => {
    const key = section.section_templates?.key || "";
    return key === "BANNER_CAROUSEL";
  };

  // Sub-editor views
  if (editingSection) {
    return (
      <SectionEditor
        section={editingSection}
        onBack={() => { setEditingSection(null); fetchSections(); }}
      />
    );
  }
  if (editingManualLinks) {
    return (
      <ManualLinksEditor
        section={editingManualLinks}
        onBack={() => { setEditingManualLinks(null); fetchSections(); }}
      />
    );
  }

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);
  const selectedElement = selectedBlock?.blockType === "static" ? selectedBlock.element : null;
  const selectedSection = selectedBlock?.blockType === "dynamic" ? selectedBlock.section : null;

  // --- Shared panel content ---
  const blockListContent = (
    <div className="flex flex-col h-full bg-muted/30">
      {/* Add buttons */}
      <div className="p-3 border-b space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Adicionar bloco</p>
        <div className="flex gap-1.5">
          {!isHomePage && (
            <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setShowAddStatic(true)}>
              <Type className="h-3 w-3 mr-1" /> Elemento
            </Button>
          )}
          <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setShowAddDynamic(true)}>
            <Layers className="h-3 w-3 mr-1" /> Sessão
          </Button>
        </div>
      </div>

      {/* Block list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && blocks.length === 0 && (
          <p className="text-xs text-center text-muted-foreground py-8">
            {isHomePage ? "Adicione sessões acima" : "Adicione elementos ou sessões acima"}
          </p>
        )}
        {!loading && blocks.map((block, blockIdx) => {
          if (block.blockType === "static") {
            const elIdx = elements.findIndex(el => el.id === block.id);
            return (
              <div
                key={block.id}
                draggable={!isMobile}
                onDragStart={() => handleDragStart(elIdx)}
                onDragOver={(e) => handleDragOver(e, elIdx)}
                onDragEnd={handleDragEnd}
                onClick={() => setSelectedBlockId(block.id)}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm transition-colors ${
                  selectedBlockId === block.id ? "bg-primary/10 border border-primary/30" : "hover:bg-accent"
                }`}
              >
                {!isMobile && <GripVertical className="h-3 w-3 text-muted-foreground shrink-0 cursor-grab" />}
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] px-1 py-0.5 rounded bg-blue-50 text-blue-600 font-mono mr-1">
                    {ELEMENT_TYPE_LABELS[block.element.type]}
                  </span>
                  <span className="text-xs truncate">{block.element.content || "(vazio)"}</span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); duplicateElement(block.id); }} className="text-muted-foreground hover:text-foreground p-1">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); removeElement(block.id); }} className="text-muted-foreground hover:text-destructive p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          }
          // Dynamic block
          const secIdx = sections.findIndex(s => s.id === block.id);
          return (
            <div
              key={block.id}
              onClick={() => setSelectedBlockId(block.id)}
              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm transition-colors ${
                !block.section.is_enabled ? "opacity-50" : ""
              } ${selectedBlockId === block.id ? "bg-primary/10 border border-primary/30" : "hover:bg-accent"}`}
            >
              <Layers className="h-3 w-3 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] px-1 py-0.5 rounded bg-primary/10 text-primary font-mono mr-1">
                  {block.section.section_templates?.key || "SESSÃO"}
                </span>
                <span className="text-xs truncate block mt-0.5">{block.section.title || "Sem título"}</span>
              </div>
              <div className="flex gap-0.5 shrink-0">
                {secIdx > 0 && (
                  <button onClick={(e) => { e.stopPropagation(); handleMoveSection(block.id, -1); }} className="text-muted-foreground hover:text-foreground p-1" title="Mover acima">
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                )}
                {secIdx < sections.length - 1 && (
                  <button onClick={(e) => { e.stopPropagation(); handleMoveSection(block.id, 1); }} className="text-muted-foreground hover:text-foreground p-1" title="Mover abaixo">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); handleToggleSection(block.section); }} className="text-muted-foreground hover:text-foreground p-1">
                  {block.section.is_enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteSection(block.id); }} className="text-muted-foreground hover:text-destructive p-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const propertiesContent = (
    <div className="h-full overflow-y-auto p-4">
      {!selectedBlock ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          <Layers className="h-8 w-8 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Selecione um bloco</p>
          <p className="text-xs mt-1">Clique em um bloco na lista{!isMobile ? " ou no preview" : ""} para editar</p>
        </div>
      ) : selectedElement ? (
        <StaticPropertiesPanel
          element={selectedElement}
          onUpdate={(patch) => updateElement(selectedElement.id, patch)}
          onUpdateStyle={(patch) => updateStyle(selectedElement.id, patch)}
          onRemove={() => removeElement(selectedElement.id)}
        />
      ) : selectedSection ? (
        <InlineSectionEditor
          section={selectedSection}
          brandId={brand?.id || page.brand_id}
          title={inlineTitle}
          subtitle={inlineSubtitle}
          ctaText={inlineCtaText}
          displayMode={inlineDisplayMode}
          filterMode={inlineFilterMode}
          couponTypeFilter={inlineCouponTypeFilter}
          columnsCount={inlineColumnsCount}
          onTitleChange={setInlineTitle}
          onSubtitleChange={setInlineSubtitle}
          onCtaTextChange={setInlineCtaText}
          onDisplayModeChange={setInlineDisplayMode}
          onFilterModeChange={setInlineFilterMode}
          onCouponTypeFilterChange={setInlineCouponTypeFilter}
          onColumnsCountChange={setInlineColumnsCount}
          onSave={() => handleSaveInline(selectedSection.id)}
          saving={savingInline}
          onToggle={() => handleToggleSection(selectedSection)}
          onDelete={() => handleDeleteSection(selectedSection.id)}
          onDuplicate={() => handleDuplicateSection(selectedSection)}
          onEditConfig={() => setEditingSection(selectedSection)}
          onEditLinks={() => setEditingManualLinks(selectedSection)}
          isManualLinks={isManualLinksType(selectedSection)}
          isBannerCarousel={isBannerCarouselType(selectedSection)}
        />
      ) : null}
    </div>
  );

  const previewContent = (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-muted/50 to-muted/20">
      <LivePreview
        blocks={blocks}
        pageTitle={pageSettings.title}
        pageSubtitle={pageSettings.subtitle}
        searchEnabled={pageSettings.search_enabled}
        selectedBlockId={selectedBlockId}
        onSelectBlock={(id) => {
          setSelectedBlockId(id);
          if (isMobile) setMobileTab("props");
        }}
        isHomePage={isHomePage}
      />
    </div>
  );

  // --- Shared dialogs ---
  const dialogs = (
    <>
      {/* Add Static Element Dialog */}
      {!isHomePage && (
        <Dialog open={showAddStatic} onOpenChange={setShowAddStatic}>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader><DialogTitle>Adicionar Elemento Visual</DialogTitle></DialogHeader>
            <div className="grid grid-cols-3 gap-3 py-4">
              {(["text", "button", "banner", "icon", "divider", "spacer"] as PageElement["type"][]).map((t) => (
                <button
                  key={t}
                  onClick={() => addElement(t)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border hover:bg-accent transition-colors"
                >
                  {t === "text" && <Type className="h-6 w-6" />}
                  {t === "button" && <MousePointer className="h-6 w-6" />}
                  {t === "banner" && <ImageIcon className="h-6 w-6" />}
                  {t === "icon" && <Square className="h-6 w-6" />}
                  {t === "divider" && <Minus className="h-6 w-6" />}
                  {t === "spacer" && <GripVertical className="h-6 w-6" />}
                  <span className="text-xs font-medium">{ELEMENT_TYPE_LABELS[t]}</span>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Dynamic Section Dialog */}
      <Dialog open={showAddDynamic} onOpenChange={setShowAddDynamic}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Adicionar Sessão Dinâmica</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo da Sessão</Label>
              <Select value={newSectionType} onValueChange={setNewSectionType}>
                <SelectTrigger><SelectValue placeholder="Escolha o tipo..." /></SelectTrigger>
                <SelectContent>
                  {SECTION_TYPES.map(st => (
                    <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Título (opcional)</Label>
              <Input value={newSectionTitle} onChange={e => setNewSectionTitle(e.target.value)} placeholder="Ex: Ofertas Imperdíveis" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDynamic(false)}>Cancelar</Button>
            <Button onClick={handleAddSection} disabled={addingSection || !newSectionType}>
              {addingSection && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Page Settings Dialog */}
      {!isHomePage && (
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader><DialogTitle>Configurações da Página</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input value={pageSettings.title} onChange={e => setPageSettings(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <Label>Subtítulo</Label>
                <Input value={pageSettings.subtitle} onChange={e => setPageSettings(p => ({ ...p, subtitle: e.target.value }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Busca habilitada</Label>
                <Switch checked={pageSettings.search_enabled} onCheckedChange={v => setPageSettings(p => ({ ...p, search_enabled: v }))} />
              </div>
              <div>
                <Label>Visibilidade</Label>
                <Select value={pageSettings.visibility_type} onValueChange={v => setPageSettings(p => ({ ...p, visibility_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Pública</SelectItem>
                    <SelectItem value="authenticated">Apenas logado</SelectItem>
                    <SelectItem value="role_based">Por papel</SelectItem>
                    <SelectItem value="branch_based">Por cidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSettings(false)}>Cancelar</Button>
              <Button onClick={handleSavePageSettings} disabled={savingSettings}>
                {savingSettings && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );

  // ========= MOBILE LAYOUT =========
  if (isMobile) {
    return (
      <div className="flex flex-col h-[100dvh]">
        {/* Compact header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b bg-card shrink-0 pwa-safe-top">
          <Button size="icon" variant="ghost" onClick={onBack} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-xs truncate">
              {isHomePage ? "Home" : page.title}
            </h2>
          </div>
          <div className="flex gap-1">
            {!isHomePage && (
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowSettings(true)}>
                <Settings2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={fetchSections}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            {!isHomePage && (
              <Button size="sm" className="h-8 text-xs px-2" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              </Button>
            )}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {mobileTab === "blocks" && blockListContent}
          {mobileTab === "props" && propertiesContent}
          {mobileTab === "preview" && previewContent}
        </div>

        {/* Bottom tab bar */}
        <div className="flex border-t bg-card shrink-0 pwa-safe-bottom">
          {([
            { key: "blocks" as const, label: "Blocos", icon: LayoutList },
            { key: "props" as const, label: "Editar", icon: SlidersHorizontal },
            { key: "preview" as const, label: "Preview", icon: MonitorSmartphone },
          ]).map(tab => {
            const Icon = tab.icon;
            const isActive = mobileTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setMobileTab(tab.key)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.6} />
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {dialogs}
      </div>
    );
  }

  // ========= DESKTOP LAYOUT =========
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b bg-card shrink-0">
        <Button size="icon" variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {isHomePage && <Smartphone className="h-4 w-4 text-primary shrink-0" />}
          <div>
            <h2 className="font-bold text-sm truncate">{isHomePage ? "Tela Inicial (Home)" : page.title}</h2>
            <p className="text-[10px] text-muted-foreground font-mono">
              {isHomePage ? "Sessões dinâmicas da home" : `/p/${page.slug}`}
            </p>
          </div>
        </div>
        {!isHomePage && (
          <Button size="sm" variant="outline" onClick={() => setShowSettings(true)}>
            <Settings2 className="h-3.5 w-3.5 mr-1" /> Config
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={fetchSections}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Atualizar
        </Button>
        {!isHomePage && (
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
            Salvar
          </Button>
        )}
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left panel: Block list */}
        <ResizablePanel defaultSize={25} minSize={18} maxSize={40}>
          {blockListContent}
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Middle panel: Properties */}
        <ResizablePanel defaultSize={30} minSize={22}>
          {propertiesContent}
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right panel: Live Preview */}
        <ResizablePanel defaultSize={45} minSize={30}>
          {previewContent}
        </ResizablePanel>
      </ResizablePanelGroup>

      {dialogs}
    </div>
  );
}

// --- Inline Section Editor ---
function InlineSectionEditor({
  section,
  brandId,
  title, subtitle, ctaText, displayMode, filterMode, couponTypeFilter, columnsCount,
  onTitleChange, onSubtitleChange, onCtaTextChange, onDisplayModeChange, onFilterModeChange,
  onCouponTypeFilterChange, onColumnsCountChange,
  onSave, saving, onToggle, onDelete, onDuplicate, onEditConfig, onEditLinks,
  isManualLinks, isBannerCarousel,
}: {
  section: SectionRow;
  brandId: string;
  title: string; subtitle: string; ctaText: string; displayMode: string;
  filterMode: string; couponTypeFilter: string; columnsCount: number;
  onTitleChange: (v: string) => void; onSubtitleChange: (v: string) => void;
  onCtaTextChange: (v: string) => void; onDisplayModeChange: (v: string) => void;
  onFilterModeChange: (v: string) => void; onCouponTypeFilterChange: (v: string) => void;
  onColumnsCountChange: (v: number) => void;
  onSave: () => void; saving: boolean;
  onToggle: () => void; onDelete: () => void; onDuplicate: () => void;
  onEditConfig: () => void; onEditLinks: () => void;
  isManualLinks: boolean; isBannerCarousel: boolean;
}) {
  const templateKey = section.section_templates?.key || "";

  return (
    <div className="max-w-md space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm">Editar Sessão</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">
            {templateKey}
          </span>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={onDuplicate} title="Duplicar">
            <Copy className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={onToggle}>
            {section.is_enabled ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {!section.is_enabled && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-2 text-xs text-yellow-700 text-center">
          Sessão desativada — não aparece no app
        </div>
      )}

      <div className="space-y-3">
        <div>
          <Label className="text-xs">Título</Label>
          <Input value={title} onChange={e => onTitleChange(e.target.value)} placeholder="Ex: Ofertas Imperdíveis" />
        </div>
        <div>
          <Label className="text-xs">Subtítulo</Label>
          <Input value={subtitle} onChange={e => onSubtitleChange(e.target.value)} placeholder="Texto descritivo" />
        </div>
        <div>
          <Label className="text-xs">Texto CTA</Label>
          <Input value={ctaText} onChange={e => onCtaTextChange(e.target.value)} placeholder="Ver tudo" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Exibição</Label>
            <Select value={displayMode} onValueChange={onDisplayModeChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="carousel">Carrossel</SelectItem>
                <SelectItem value="grid">Grade</SelectItem>
                <SelectItem value="list">Lista</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Colunas</Label>
            <Select value={String(columnsCount)} onValueChange={v => onColumnsCountChange(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {(templateKey.includes("OFFERS") || templateKey.includes("STORES")) && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Ordenação</Label>
              <Select value={filterMode} onValueChange={onFilterModeChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recentes</SelectItem>
                  <SelectItem value="most_redeemed">Mais resgatados</SelectItem>
                  <SelectItem value="newest">Novos (14 dias)</SelectItem>
                  <SelectItem value="random">Aleatório</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {templateKey.includes("OFFERS") && (
              <div>
                <Label className="text-xs">Tipo de cupom</Label>
                <Select value={couponTypeFilter} onValueChange={onCouponTypeFilterChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="STORE">Loja</SelectItem>
                    <SelectItem value="BRAND">Marca</SelectItem>
                    <SelectItem value="PLATFORM">Plataforma</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </div>

      <Button className="w-full" onClick={onSave} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Salvar Alterações
      </Button>

      {/* Inline Banner Manager for BANNER_CAROUSEL */}
      {isBannerCarousel && (
        <div className="border-t pt-3">
          <InlineBannerManager sectionId={section.id} brandId={brandId} />
        </div>
      )}

      <div className="border-t pt-3 flex gap-2">
        <Button variant="outline" className="flex-1 text-xs" onClick={onEditConfig}>
          <Settings2 className="h-3.5 w-3.5 mr-1" /> Config Avançada
        </Button>
        {isManualLinks && (
          <Button variant="outline" className="flex-1 text-xs" onClick={onEditLinks}>
            <Link2 className="h-3.5 w-3.5 mr-1" /> Gerenciar Links
          </Button>
        )}
      </div>
    </div>
  );
}

// --- Static Properties Panel ---
function StaticPropertiesPanel({
  element,
  onUpdate,
  onUpdateStyle,
  onRemove,
}: {
  element: PageElement;
  onUpdate: (patch: Partial<PageElement>) => void;
  onUpdateStyle: (patch: Partial<PageElementStyle>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="max-w-md space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">{ELEMENT_TYPE_LABELS[element.type]}</h3>
        <Button size="sm" variant="destructive" onClick={onRemove}>
          <Trash2 className="h-3 w-3 mr-1" /> Remover
        </Button>
      </div>

      {!["divider", "spacer"].includes(element.type) && (
        <div>
          <Label className="text-xs">Conteúdo</Label>
          {element.type === "text" ? (
            <textarea
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={element.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
              rows={3}
            />
          ) : (
            <Input value={element.content} onChange={(e) => onUpdate({ content: e.target.value })} />
          )}
        </div>
      )}

      {element.type === "banner" && (
        <StorageImageUpload
          value={element.imageUrl || ""}
          onChange={(url) => onUpdate({ imageUrl: url })}
          label="Imagem do Banner"
          folder="page-builder/banners"
          aspectHint="Recomendado: 1080×400px"
        />
      )}

      {element.type === "icon" && (
        <StorageImageUpload
          value={element.imageUrl || ""}
          onChange={(url) => onUpdate({ imageUrl: url })}
          label="Imagem do Ícone"
          folder="page-builder/icons"
          aspectHint="Recomendado: 200×200px (quadrado)"
          compact
        />
      )}

      {["banner", "button"].includes(element.type) && (
        <div>
          <Label className="text-xs">Badge / Tag</Label>
          <Input value={element.badgeText || ""} onChange={(e) => onUpdate({ badgeText: e.target.value })} placeholder="Ex: IMPERDÍVEL" />
        </div>
      )}

      <div className="border-t pt-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground">Estilo</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Tamanho da Fonte</Label>
            <Input value={element.style.fontSize || ""} onChange={(e) => onUpdateStyle({ fontSize: e.target.value })} placeholder="16px" />
          </div>
          <div>
            <Label className="text-xs">Peso da Fonte</Label>
            <Select value={element.style.fontWeight || "normal"} onValueChange={(v) => onUpdateStyle({ fontWeight: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="bold">Negrito</SelectItem>
                <SelectItem value="800">Extra Bold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Cor do Texto</Label>
            <div className="flex gap-2">
              <input type="color" value={element.style.color || "#000000"} onChange={(e) => onUpdateStyle({ color: e.target.value })} className="h-9 w-9 rounded border cursor-pointer" />
              <Input value={element.style.color || ""} onChange={(e) => onUpdateStyle({ color: e.target.value })} className="flex-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Cor de Fundo</Label>
            <div className="flex gap-2">
              <input type="color" value={element.style.backgroundColor || "#ffffff"} onChange={(e) => onUpdateStyle({ backgroundColor: e.target.value })} className="h-9 w-9 rounded border cursor-pointer" />
              <Input value={element.style.backgroundColor || ""} onChange={(e) => onUpdateStyle({ backgroundColor: e.target.value })} className="flex-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Border Radius</Label>
            <Input value={element.style.borderRadius || ""} onChange={(e) => onUpdateStyle({ borderRadius: e.target.value })} placeholder="8px" />
          </div>
          <div>
            <Label className="text-xs">Padding</Label>
            <Input value={element.style.padding || ""} onChange={(e) => onUpdateStyle({ padding: e.target.value })} placeholder="12px" />
          </div>
          <div>
            <Label className="text-xs">Alinhamento</Label>
            <Select value={element.style.textAlign || "left"} onValueChange={(v) => onUpdateStyle({ textAlign: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Esquerda</SelectItem>
                <SelectItem value="center">Centro</SelectItem>
                <SelectItem value="right">Direita</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Sombra</Label>
            <Select value={element.style.boxShadow || "none"} onValueChange={(v) => onUpdateStyle({ boxShadow: v === "none" ? undefined : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem sombra</SelectItem>
                <SelectItem value="0 2px 8px rgba(0,0,0,0.1)">Suave</SelectItem>
                <SelectItem value="0 4px 16px rgba(0,0,0,0.15)">Média</SelectItem>
                <SelectItem value="0 8px 32px rgba(0,0,0,0.2)">Forte</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {["banner", "divider", "spacer"].includes(element.type) && (
            <div>
              <Label className="text-xs">Altura</Label>
              <Input value={element.style.height || ""} onChange={(e) => onUpdateStyle({ height: e.target.value })} placeholder="160px" />
            </div>
          )}
          <div>
            <Label className="text-xs">Opacidade</Label>
            <Input type="range" min="0" max="1" step="0.05" value={element.style.opacity || "1"} onChange={(e) => onUpdateStyle({ opacity: e.target.value })} className="h-9" />
          </div>
        </div>
      </div>

      <div className="border-t pt-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground">Ação ao clicar</p>
        <Select value={element.action.type} onValueChange={(v: any) => onUpdate({ action: { ...element.action, type: v } })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma</SelectItem>
            <SelectItem value="external_link">Link Externo</SelectItem>
            <SelectItem value="internal_route">Rota Interna</SelectItem>
            <SelectItem value="webview">WebView</SelectItem>
          </SelectContent>
        </Select>
        {element.action.type === "external_link" && (
          <Input value={element.action.url || ""} onChange={(e) => onUpdate({ action: { ...element.action, url: e.target.value } })} placeholder="https://..." />
        )}
        {element.action.type === "internal_route" && (
          <Input value={element.action.route || ""} onChange={(e) => onUpdate({ action: { ...element.action, route: e.target.value } })} placeholder="/offers, /wallet, etc." />
        )}
        {element.action.type === "webview" && (
          <Input value={element.action.url || ""} onChange={(e) => onUpdate({ action: { ...element.action, url: e.target.value } })} placeholder="https://..." />
        )}
      </div>
    </div>
  );
}
