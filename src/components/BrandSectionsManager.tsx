import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, GripVertical, Trash2, Settings, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface BrandSectionsManagerProps {
  brandId: string;
}

const TEMPLATE_TYPE_LABELS: Record<string, string> = {
  BANNER_CAROUSEL: "Banner Carousel",
  OFFERS_CAROUSEL: "Carrossel de Ofertas",
  OFFERS_GRID: "Grade de Ofertas",
  STORES_GRID: "Grade de Lojas",
  STORES_LIST: "Lista de Lojas",
  VOUCHERS_CARDS: "Cards de Vouchers",
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  OFFERS: "Ofertas",
  STORES: "Lojas",
  CATEGORIES: "Categorias",
  CUSTOM_QUERY: "Query Customizada",
  MANUAL: "Manual",
};

export default function BrandSectionsManager({ brandId }: BrandSectionsManagerProps) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newCtaText, setNewCtaText] = useState("");
  const [newTemplateId, setNewTemplateId] = useState("");
  const [newSourceType, setNewSourceType] = useState("OFFERS");
  const [newLimit, setNewLimit] = useState("10");

  const { data: templates } = useQuery({
    queryKey: ["section-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("section_templates")
        .select("*")
        .eq("is_active", true)
        .order("name");
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
          template_id: newTemplateId,
          title: newTitle || null,
          subtitle: newSubtitle || null,
          cta_text: newCtaText || null,
          order_index: maxOrder,
        })
        .select()
        .single();
      if (error) throw error;

      // Create default source
      const { error: srcError } = await supabase
        .from("brand_section_sources")
        .insert({
          brand_section_id: section.id,
          source_type: newSourceType as any,
          limit: parseInt(newLimit) || 10,
        });
      if (srcError) throw srcError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-sections", brandId] });
      toast.success("Seção adicionada!");
      setAddOpen(false);
      setNewTitle("");
      setNewSubtitle("");
      setNewCtaText("");
      setNewTemplateId("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("brand_sections")
        .update({ is_enabled: enabled })
        .eq("id", id);
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Seção</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Template</Label>
                <Select value={newTemplateId} onValueChange={setNewTemplateId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o template" /></SelectTrigger>
                  <SelectContent>
                    {templates?.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} <span className="text-muted-foreground ml-1">({TEMPLATE_TYPE_LABELS[t.type] || t.type})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ex: Ofertas em Destaque" />
              </div>
              <div className="space-y-2">
                <Label>Subtítulo</Label>
                <Input value={newSubtitle} onChange={(e) => setNewSubtitle(e.target.value)} placeholder="Opcional" />
              </div>
              <div className="space-y-2">
                <Label>CTA Text</Label>
                <Input value={newCtaText} onChange={(e) => setNewCtaText(e.target.value)} placeholder="Ex: Ver todas" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fonte de dados</Label>
                  <Select value={newSourceType} onValueChange={setNewSourceType}>
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
                  <Input type="number" value={newLimit} onChange={(e) => setNewLimit(e.target.value)} min="1" max="50" />
                </div>
              </div>
              <Button onClick={() => addSection.mutate()} disabled={!newTemplateId} className="w-full">
                Criar Seção
              </Button>
            </div>
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
                  <Button
                    variant="ghost" size="icon" className="h-6 w-6"
                    disabled={idx === 0}
                    onClick={() => moveSection.mutate({ id: section.id, direction: "up" })}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-6 w-6"
                    disabled={idx === sections.length - 1}
                    onClick={() => moveSection.mutate({ id: section.id, direction: "down" })}
                  >
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
                  {section.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">{section.subtitle}</p>
                  )}
                  {section.brand_section_sources?.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {section.brand_section_sources.map((src: any) => (
                        <Badge key={src.id} variant="secondary" className="text-xs">
                          {SOURCE_TYPE_LABELS[src.source_type] || src.source_type} ({src.limit})
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Switch
                  checked={section.is_enabled}
                  onCheckedChange={(checked) => toggleEnabled.mutate({ id: section.id, enabled: checked })}
                />
                <Button
                  variant="ghost" size="icon"
                  onClick={() => deleteSection.mutate(section.id)}
                >
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
