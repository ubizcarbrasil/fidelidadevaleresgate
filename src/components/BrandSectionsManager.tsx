import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BrandSectionsManagerProps {
  brandId: string;
}

const TEMPLATE_TYPE_LABELS: Record<string, string> = {
  BANNER_CAROUSEL: "Banner Carousel",
  OFFERS_CAROUSEL: "Carrossel de Ofertas",
  OFFERS_GRID: "Grade de Ofertas",
  STORES_GRID: "Grade de Parceiros",
  STORES_LIST: "Lista de Parceiros",
  VOUCHERS_CARDS: "Cards de Vouchers",
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  OFFERS: "Ofertas",
  STORES: "Parceiros",
  CATEGORIES: "Categorias",
  CUSTOM_QUERY: "Query Customizada",
  MANUAL: "Manual",
};

const FILTER_MODE_LABELS: Record<string, string> = {
  recent: "Mais recentes",
  most_redeemed: "Mais resgatados",
  newest: "Novos (últimos dias)",
  random: "Aleatório",
  by_category: "Por categoria",
  by_tag: "Por etiqueta",
  by_credit_range: "Faixa de créditos",
  by_coupon_type: "Por tipo de cupom",
};

const ICON_SIZE_LABELS: Record<string, string> = {
  small: "Pequeno",
  medium: "Médio",
  large: "Grande",
};

export default function BrandSectionsManager({ brandId }: BrandSectionsManagerProps) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", subtitle: "", ctaText: "", templateId: "", sourceType: "OFFERS",
    limit: "10", bannerUrl: "", bannerHeight: "medium", displayMode: "carousel",
    rowsCount: "1", columnsCount: "4", iconSize: "medium", filterMode: "recent",
    couponTypeFilter: "", minStoresVisible: "1", maxStoresVisible: "",
  });

  const updateForm = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const resetForm = () => setForm({
    title: "", subtitle: "", ctaText: "", templateId: "", sourceType: "OFFERS",
    limit: "10", bannerUrl: "", bannerHeight: "medium", displayMode: "carousel",
    rowsCount: "1", columnsCount: "4", iconSize: "medium", filterMode: "recent",
    couponTypeFilter: "", minStoresVisible: "1", maxStoresVisible: "",
  });

  const { data: templates } = useQuery({
    queryKey: ["section-templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("section_templates").select("*").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: sections, isLoading } = useQuery({
    queryKey: ["brand-sections", brandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_sections")
        .select("*, section_templates(key, name, type), brand_section_sources(*)")
        .eq("brand_id", brandId)
        .order("order_index");
      if (error) throw error;
      return data;
    },
  });

  const addSection = useMutation({
    mutationFn: async () => {
      const maxOrder = sections?.length ? Math.max(...sections.map((s: any) => s.order_index)) + 1 : 0;
      const { data: section, error } = await supabase
        .from("brand_sections")
        .insert({
          brand_id: brandId,
          template_id: form.templateId,
          title: form.title || null,
          subtitle: form.subtitle || null,
          cta_text: form.ctaText || null,
          order_index: maxOrder,
          banner_image_url: form.bannerUrl || null,
          banner_height: form.bannerHeight,
          display_mode: form.displayMode,
          rows_count: parseInt(form.rowsCount) || 1,
          columns_count: parseInt(form.columnsCount) || 4,
          icon_size: form.iconSize,
          filter_mode: form.filterMode,
          coupon_type_filter: form.couponTypeFilter || null,
          min_stores_visible: parseInt(form.minStoresVisible) || 1,
          max_stores_visible: form.maxStoresVisible ? parseInt(form.maxStoresVisible) : null,
        })
        .select()
        .single();
      if (error) throw error;

      const { error: srcError } = await supabase
        .from("brand_section_sources")
        .insert({
          brand_section_id: section.id,
          source_type: form.sourceType as any,
          limit: parseInt(form.limit) || 10,
        });
      if (srcError) throw srcError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-sections", brandId] });
      toast.success("Seção adicionada!");
      setAddOpen(false);
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("brand_sections").update({ is_enabled: enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["brand-sections", brandId] }),
  });

  const deleteSection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("brand_sections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-sections", brandId] });
      toast.success("Seção removida!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const moveSection = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      if (!sections) return;
      const idx = sections.findIndex((s: any) => s.id === id);
      if (idx === -1) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sections.length) return;
      const current = sections[idx] as any;
      const swap = sections[swapIdx] as any;
      await Promise.all([
        supabase.from("brand_sections").update({ order_index: swap.order_index }).eq("id", current.id),
        supabase.from("brand_sections").update({ order_index: current.order_index }).eq("id", swap.id),
      ]);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["brand-sections", brandId] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Seções da Home</h3>
          <p className="text-sm text-muted-foreground">Configure as seções exibidas na página pública</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Adicionar Seção</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Nova Seção</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-4 pt-2">
                {/* Template */}
                <div className="space-y-2">
                  <Label>Template</Label>
                  <Select value={form.templateId} onValueChange={v => updateForm("templateId", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione o template" /></SelectTrigger>
                    <SelectContent>
                      {templates?.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} ({TEMPLATE_TYPE_LABELS[t.type] || t.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Title / Subtitle / CTA */}
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input value={form.title} onChange={e => updateForm("title", e.target.value)} placeholder="Ex: Ofertas em Destaque" />
                </div>
                <div className="space-y-2">
                  <Label>Subtítulo</Label>
                  <Input value={form.subtitle} onChange={e => updateForm("subtitle", e.target.value)} placeholder="Opcional" />
                </div>
                <div className="space-y-2">
                  <Label>CTA Text</Label>
                  <Input value={form.ctaText} onChange={e => updateForm("ctaText", e.target.value)} placeholder="Ex: Ver todas" />
                </div>

                {/* Data Source + Limit */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fonte de dados</Label>
                    <Select value={form.sourceType} onValueChange={v => updateForm("sourceType", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(SOURCE_TYPE_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Limite</Label>
                    <Input type="number" value={form.limit} onChange={e => updateForm("limit", e.target.value)} min="1" max="50" />
                  </div>
                </div>

                {/* Grid: Rows x Columns */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Linhas</Label>
                    <Input type="number" value={form.rowsCount} onChange={e => updateForm("rowsCount", e.target.value)} min="1" max="10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Colunas</Label>
                    <Input type="number" value={form.columnsCount} onChange={e => updateForm("columnsCount", e.target.value)} min="1" max="6" />
                  </div>
                </div>

                {/* Icon Size + Filter Mode */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tamanho do ícone</Label>
                    <Select value={form.iconSize} onValueChange={v => updateForm("iconSize", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ICON_SIZE_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Filtro / Ordenação</Label>
                    <Select value={form.filterMode} onValueChange={v => updateForm("filterMode", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(FILTER_MODE_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Coupon Type Filter */}
                <div className="space-y-2">
                  <Label>Tipo de cupom</Label>
                  <Select value={form.couponTypeFilter || "all"} onValueChange={v => updateForm("couponTypeFilter", v === "all" ? "" : v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="PRODUCT">Produto</SelectItem>
                      <SelectItem value="STORE">Estabelecimento todo</SelectItem>
                      <SelectItem value="MIXED">Misturado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Min/Max stores */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mín. parceiros visíveis</Label>
                    <Input type="number" value={form.minStoresVisible} onChange={e => updateForm("minStoresVisible", e.target.value)} min="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Máx. parceiros visíveis</Label>
                    <Input type="number" value={form.maxStoresVisible} onChange={e => updateForm("maxStoresVisible", e.target.value)} placeholder="Sem limite" />
                  </div>
                </div>

                {/* Display Mode + Banner Height */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Modo de exibição</Label>
                    <Select value={form.displayMode} onValueChange={v => updateForm("displayMode", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="carousel">Carrossel</SelectItem>
                        <SelectItem value="grid">Grade</SelectItem>
                        <SelectItem value="list">Lista</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Altura do banner</Label>
                    <Select value={form.bannerHeight} onValueChange={v => updateForm("bannerHeight", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Pequeno</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="large">Grande</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Banner URL */}
                <div className="space-y-2">
                  <Label>Banner da Seção (URL)</Label>
                  <Input value={form.bannerUrl} onChange={e => updateForm("bannerUrl", e.target.value)} placeholder="https://..." />
                </div>

                <Button onClick={() => addSection.mutate()} disabled={!form.templateId} className="w-full">
                  Criar Seção
                </Button>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : !sections?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma seção configurada. Adicione seções para construir a home pública.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sections.map((section: any, idx: number) => (
            <Card key={section.id} className="transition-shadow hover:shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === 0}
                    onClick={() => moveSection.mutate({ id: section.id, direction: "up" })}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === sections.length - 1}
                    onClick={() => moveSection.mutate({ id: section.id, direction: "down" })}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">
                      {section.title || section.section_templates?.name || "Sem título"}
                    </span>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {TEMPLATE_TYPE_LABELS[section.section_templates?.type] || section.section_templates?.type}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {section.brand_section_sources?.map((src: any) => (
                      <Badge key={src.id} variant="secondary" className="text-xs">
                        {SOURCE_TYPE_LABELS[src.source_type] || src.source_type} ({src.limit})
                      </Badge>
                    ))}
                    <Badge variant="secondary" className="text-xs">
                      {section.rows_count}×{section.columns_count}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {ICON_SIZE_LABELS[section.icon_size] || section.icon_size}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {FILTER_MODE_LABELS[section.filter_mode] || section.filter_mode}
                    </Badge>
                  </div>
                </div>

                <Switch
                  checked={section.is_enabled}
                  onCheckedChange={(checked) => toggleEnabled.mutate({ id: section.id, enabled: checked })}
                />
                <Button variant="ghost" size="icon" onClick={() => deleteSection.mutate(section.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
