import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, GripVertical, Eye, EyeOff, Copy, Settings2, Loader2, Layers, Link2, Image as ImageIcon } from "lucide-react";
import SectionEditor from "./SectionEditor";
import ManualLinksEditor from "./ManualLinksEditor";
import SectionCreatorWizard from "./SectionCreatorWizard";

interface PageRow {
  id: string;
  brand_id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  is_published: boolean;
  search_enabled: boolean;
  visibility_type: string;
}

interface SectionRow {
  id: string;
  brand_id: string;
  page_id: string | null;
  title: string | null;
  subtitle: string | null;
  cta_text: string | null;
  template_id: string;
  order_index: number;
  is_enabled: boolean;
  display_mode: string;
  filter_mode: string;
  columns_count: number;
  rows_count: number;
  min_stores_visible: number;
  max_stores_visible: number | null;
  icon_size: string;
  banner_height: string;
  coupon_type_filter: string | null;
  city_filter_json: any[];
  visual_json: any;
  section_templates?: { key: string; name: string; type: string };
}

interface Props {
  page: PageRow;
  onBack: () => void;
}


export default function PageSectionsEditor({ page, onBack }: Props) {
  const { brand } = useBrand();
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [editingSection, setEditingSection] = useState<SectionRow | null>(null);
  const [editingManualLinks, setEditingManualLinks] = useState<SectionRow | null>(null);
  const [pageSettings, setPageSettings] = useState({
    title: page.title,
    subtitle: page.subtitle || "",
    search_enabled: page.search_enabled,
    visibility_type: page.visibility_type,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const fetchSections = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase
      .from("brand_sections")
      .select("*, section_templates(key, name, type)") as any)
      .eq("page_id", page.id)
      .order("order_index");
    setSections((data as any[]) || []);
    setLoading(false);
  }, [page.id]);

  useEffect(() => { fetchSections(); }, [fetchSections]);

  // handleAddSection is now handled by SectionCreatorWizard

  const handleDeleteSection = async (id: string) => {
    if (!confirm("Excluir esta sessão?")) return;
    await supabase.from("brand_sections").delete().eq("id", id);
    toast({ title: "Sessão removida" });
    fetchSections();
  };

  const handleToggleSection = async (section: SectionRow) => {
    await supabase.from("brand_sections").update({ is_enabled: !section.is_enabled }).eq("id", section.id);
    fetchSections();
  };

  const handleDuplicateSection = async (section: SectionRow) => {
    if (!brand) return;
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

  const handleMoveSection = async (idx: number, direction: "up" | "down") => {
    const newSections = [...sections];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newSections.length) return;

    // Swap order_index
    const tempOrder = newSections[idx].order_index;
    newSections[idx].order_index = newSections[targetIdx].order_index;
    newSections[targetIdx].order_index = tempOrder;

    await Promise.all([
      supabase.from("brand_sections").update({ order_index: newSections[idx].order_index }).eq("id", newSections[idx].id),
      supabase.from("brand_sections").update({ order_index: newSections[targetIdx].order_index }).eq("id", newSections[targetIdx].id),
    ]);
    fetchSections();
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

  // If editing a specific section's config
  if (editingSection) {
    return (
      <SectionEditor
        section={editingSection}
        onBack={() => { setEditingSection(null); fetchSections(); }}
      />
    );
  }

  // If editing manual links for a section
  if (editingManualLinks) {
    return (
      <ManualLinksEditor
        section={editingManualLinks}
        onBack={() => { setEditingManualLinks(null); fetchSections(); }}
      />
    );
  }

  const isManualLinksType = (section: SectionRow) => {
    const key = section.section_templates?.key || "";
    return key.includes("MANUAL_LINKS");
  };

  // Show wizard full-screen
  if (showWizard && brand) {
    return (
      <SectionCreatorWizard
        brandId={brand.id}
        pageId={page.id}
        currentSectionCount={sections.length}
        onCreated={() => { setShowWizard(false); fetchSections(); }}
        onCancel={() => setShowWizard(false)}
      />
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{page.title}</h1>
          <p className="text-sm text-muted-foreground">/p/{page.slug} · {sections.length} sessões</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
          <Settings2 className="h-4 w-4 mr-1" /> Configurações
        </Button>
        <Button size="sm" onClick={() => setShowWizard(true)}>
          <Plus className="h-4 w-4 mr-1" /> Sessão
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : sections.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
          <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma sessão ainda</p>
          <p className="text-sm mb-4">Adicione sessões para construir o conteúdo desta página.</p>
          <Button onClick={() => setShowWizard(true)}>
            <Plus className="h-4 w-4 mr-2" /> Adicionar Sessão
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {sections.map((section, idx) => (
            <div
              key={section.id}
              className={`flex items-center gap-3 p-4 rounded-xl border bg-card transition-all ${!section.is_enabled ? "opacity-50" : ""}`}
            >
              <div className="flex flex-col gap-0.5">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMoveSection(idx, "up")} disabled={idx === 0}>
                  <span className="text-xs">▲</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMoveSection(idx, "down")} disabled={idx === sections.length - 1}>
                  <span className="text-xs">▼</span>
                </Button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm truncate">{section.title || "Sem título"}</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    {section.section_templates?.key || "—"}
                  </span>
                </div>
                {section.subtitle && <p className="text-xs text-muted-foreground truncate">{section.subtitle}</p>}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => handleToggleSection(section)} title={section.is_enabled ? "Desativar" : "Ativar"}>
                  {section.is_enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                {isManualLinksType(section) && (
                  <Button variant="ghost" size="icon" onClick={() => setEditingManualLinks(section)} title="Gerenciar links">
                    <Link2 className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setEditingSection(section)} title="Configurar sessão">
                  <Settings2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDuplicateSection(section)} title="Duplicar">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteSection(section.id)} title="Excluir">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Page Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurações da Página</DialogTitle>
          </DialogHeader>
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
    </div>
  );
}
