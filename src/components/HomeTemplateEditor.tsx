import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TemplateSection {
  title: string;
  subtitle: string | null;
  cta_text: string | null;
  template_type: string;
  order_index: number;
  visual_json: Record<string, any>;
  sources: { source_type: string; filters_json: Record<string, any>; limit: number }[];
}

interface TemplateData {
  id?: string;
  key: string;
  name: string;
  description: string;
  is_default: boolean;
  template_payload_json: { sections: TemplateSection[] };
}

const AVAILABLE_EMOJIS = ["🛍️", "📂", "📍", "✨", "🎯", "🔥", "💎", "🏪", "🎁", "⭐", "🚀", "📄"];

const SECTION_TYPES: { type: string; name: string }[] = [
  { type: "BANNER_CAROUSEL", name: "Banner Hero Carousel" },
  { type: "OFFERS_CAROUSEL", name: "Carrossel de Ofertas" },
  { type: "OFFERS_GRID", name: "Grade de Ofertas" },
  { type: "STORES_GRID", name: "Grade de Lojas" },
  { type: "STORES_LIST", name: "Lista de Lojas" },
  { type: "VOUCHERS_CARDS", name: "Cards de Vouchers" },
  { type: "MANUAL_LINKS_GRID", name: "Grade de Links Manuais" },
  { type: "MANUAL_LINKS_CAROUSEL", name: "Carrossel de Links Manuais" },
  { type: "GRID_LOGOS", name: "Grade de Logos/Atalhos" },
  { type: "GRID_INFO", name: "Grade com Informações" },
  { type: "LIST_INFO", name: "Lista com Informações" },
];

const SOURCE_TYPES = [
  "OFFERS_ACTIVE", "OFFERS_NEWEST", "OFFERS_POPULAR", "OFFERS_NEARBY",
  "STORES_ACTIVE", "STORES_NEWEST", "STORES_NEARBY", "STORES_RANDOM",
  "VOUCHERS_ACTIVE", "BANNERS_ACTIVE", "MANUAL",
];

interface HomeTemplateEditorProps {
  initialData?: TemplateData;
  onSave: (data: TemplateData) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export default function HomeTemplateEditor({ initialData, onSave, onCancel, saving }: HomeTemplateEditorProps) {
  const isEdit = !!initialData?.id;
  const [data, setData] = useState<TemplateData>(
    initialData || {
      key: "",
      name: "",
      description: "",
      is_default: false,
      template_payload_json: { sections: [] },
    }
  );

  const sections = data.template_payload_json.sections;

  const updateField = <K extends keyof TemplateData>(key: K, value: TemplateData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const setSections = (newSections: TemplateSection[]) => {
    setData(prev => ({
      ...prev,
      template_payload_json: { sections: newSections.map((s, i) => ({ ...s, order_index: i })) },
    }));
  };

  const addSection = (type: string) => {
    const typeName = SECTION_TYPES.find(t => t.type === type)?.name || type;
    setSections([
      ...sections,
      {
        title: typeName,
        subtitle: null,
        cta_text: null,
        template_type: type,
        order_index: sections.length,
        visual_json: {},
        sources: [],
      },
    ]);
  };

  const removeSection = (idx: number) => setSections(sections.filter((_, i) => i !== idx));

  const moveSection = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= sections.length) return;
    const arr = [...sections];
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setSections(arr);
  };

  const updateSection = (idx: number, patch: Partial<TemplateSection>) => {
    setSections(sections.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const addSource = (sectionIdx: number) => {
    const sec = sections[sectionIdx];
    updateSection(sectionIdx, {
      sources: [...sec.sources, { source_type: "OFFERS_ACTIVE", filters_json: {}, limit: 10 }],
    });
  };

  const removeSource = (sectionIdx: number, srcIdx: number) => {
    const sec = sections[sectionIdx];
    updateSection(sectionIdx, { sources: sec.sources.filter((_, i) => i !== srcIdx) });
  };

  const updateSource = (sectionIdx: number, srcIdx: number, patch: Partial<TemplateSection["sources"][0]>) => {
    const sec = sections[sectionIdx];
    updateSection(sectionIdx, {
      sources: sec.sources.map((s, i) => (i === srcIdx ? { ...s, ...patch } : s)),
    });
  };

  const handleSave = async () => {
    if (!data.name.trim()) return toast.error("Nome é obrigatório");
    if (!data.key.trim()) return toast.error("Key é obrigatória");
    if (sections.length === 0) return toast.error("Adicione pelo menos uma seção");
    await onSave(data);
  };

  return (
    <div className="space-y-6">
      {/* Basic info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome do Template</Label>
          <Input value={data.name} onChange={e => updateField("name", e.target.value)} placeholder="Ex: Ofertas Clássico" />
        </div>
        <div className="space-y-2">
          <Label>Key (slug único)</Label>
          <Input
            value={data.key}
            onChange={e => updateField("key", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
            placeholder="Ex: ofertas-classico"
            disabled={isEdit}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea value={data.description} onChange={e => updateField("description", e.target.value)} rows={2} placeholder="Descreva o template..." />
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={data.is_default} onCheckedChange={v => updateField("is_default", v)} id="is-default" />
        <Label htmlFor="is-default">Template padrão</Label>
      </div>

      <Separator />

      {/* Sections */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Seções ({sections.length})</Label>
          <Select onValueChange={addSection}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="＋ Adicionar Seção" />
            </SelectTrigger>
            <SelectContent>
              {SECTION_TYPES.map(st => (
                <SelectItem key={st.type} value={st.type}>{st.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="max-h-[420px] pr-2">
          <div className="space-y-3">
            {sections.map((sec, idx) => (
              <Card key={idx} className="border-dashed">
                <CardContent className="p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{sec.template_type}</span>
                    <span className="text-xs text-muted-foreground ml-auto">#{idx + 1}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(idx, -1)} disabled={idx === 0}>
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1}>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeSection(idx)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Input
                      value={sec.title}
                      onChange={e => updateSection(idx, { title: e.target.value })}
                      placeholder="Título"
                      className="text-sm"
                    />
                    <Input
                      value={sec.subtitle || ""}
                      onChange={e => updateSection(idx, { subtitle: e.target.value || null })}
                      placeholder="Subtítulo"
                      className="text-sm"
                    />
                    <Input
                      value={sec.cta_text || ""}
                      onChange={e => updateSection(idx, { cta_text: e.target.value || null })}
                      placeholder="CTA (ex: Ver tudo)"
                      className="text-sm"
                    />
                  </div>

                  {/* Sources */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Fontes de dados</span>
                      <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => addSource(idx)}>
                        <Plus className="h-3 w-3 mr-1" /> Fonte
                      </Button>
                    </div>
                    {sec.sources.map((src, srcIdx) => (
                      <div key={srcIdx} className="flex items-center gap-2">
                        <Select value={src.source_type} onValueChange={v => updateSource(idx, srcIdx, { source_type: v })}>
                          <SelectTrigger className="h-7 text-xs flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SOURCE_TYPES.map(st => (
                              <SelectItem key={st} value={st}>{st}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          value={src.limit}
                          onChange={e => updateSource(idx, srcIdx, { limit: parseInt(e.target.value) || 10 })}
                          className="h-7 w-16 text-xs"
                          min={1}
                          max={50}
                        />
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeSource(idx, srcIdx)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            {sections.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma seção adicionada. Use o seletor acima.</p>
            )}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {isEdit ? "Salvar Alterações" : "Criar Template"}
        </Button>
      </div>
    </div>
  );
}
