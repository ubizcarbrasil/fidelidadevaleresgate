import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LayoutTemplate, Zap, Star, Eye, Loader2 } from "lucide-react";
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

interface HomeTemplate {
  id: string;
  key: string;
  name: string;
  description: string | null;
  preview_image_url: string | null;
  template_payload_json: { sections: TemplateSection[] };
  is_active: boolean;
  is_default: boolean;
}

const TEMPLATE_ICONS: Record<string, string> = {
  "ofertas-classico": "🛍️",
  "catalogo-categorias": "📂",
  "perto-de-voce": "📍",
  "minimalista-premium": "✨",
};

const SECTION_TYPE_LABELS: Record<string, string> = {
  BANNER_CAROUSEL: "Banner Carrossel",
  OFFERS_CAROUSEL: "Carrossel de Ofertas",
  OFFERS_GRID: "Grade de Ofertas",
  STORES_GRID: "Grade de Lojas",
  STORES_LIST: "Lista de Lojas",
  VOUCHERS_CARDS: "Cards de Vouchers",
};

export default function HomeTemplatesPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [applyOpen, setApplyOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<HomeTemplate | null>(null);
  const [scopeType, setScopeType] = useState<"BRAND" | "TENANT" | "ALL">("BRAND");
  const [scopeId, setScopeId] = useState<string>("");
  const [overwrite, setOverwrite] = useState(true);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["home-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_template_library")
        .select("*")
        .eq("is_active", true)
        .order("is_default", { ascending: false });
      if (error) throw error;
      return data as unknown as HomeTemplate[];
    },
  });

  const { data: brands } = useQuery({
    queryKey: ["brands-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brands").select("id, name, tenant_id").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: tenants } = useQuery({
    queryKey: ["tenants-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tenants").select("id, name").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate || !user) throw new Error("Dados insuficientes");

      const payload = selectedTemplate.template_payload_json;
      let targetBrandIds: string[] = [];

      if (scopeType === "BRAND") {
        if (!scopeId) throw new Error("Selecione uma Brand");
        targetBrandIds = [scopeId];
      } else if (scopeType === "TENANT") {
        if (!scopeId) throw new Error("Selecione um Tenant");
        const filtered = brands?.filter(b => b.tenant_id === scopeId) || [];
        targetBrandIds = filtered.map(b => b.id);
      } else {
        targetBrandIds = brands?.map(b => b.id) || [];
      }

      if (targetBrandIds.length === 0) throw new Error("Nenhuma brand encontrada no escopo");

      // Create job record
      const { data: job, error: jobErr } = await supabase
        .from("home_template_apply_jobs")
        .insert({
          created_by: user.id,
          template_id: selectedTemplate.id,
          scope_type: scopeType,
          scope_id: scopeType !== "ALL" ? scopeId : null,
          overwrite,
          status: "RUNNING",
        })
        .select("id")
        .single();
      if (jobErr) throw jobErr;

      const logs: string[] = [];
      let successCount = 0;
      let errorCount = 0;

      for (const brandId of targetBrandIds) {
        try {
          // Get section_templates mapping (template_type -> section_template id)
          const { data: sectionTemplates } = await supabase
            .from("section_templates")
            .select("id, type")
            .eq("is_active", true);

          const typeToTemplateId = new Map<string, string>();
          sectionTemplates?.forEach(st => typeToTemplateId.set(st.type, st.id));

          if (overwrite) {
            // Delete existing brand_sections and their sources
            const { data: existingSections } = await supabase
              .from("brand_sections")
              .select("id")
              .eq("brand_id", brandId);

            if (existingSections && existingSections.length > 0) {
              const sectionIds = existingSections.map(s => s.id);
              await supabase.from("brand_section_sources").delete().in("brand_section_id", sectionIds);
              await supabase.from("brand_section_manual_items").delete().in("brand_section_id", sectionIds);
              await supabase.from("brand_sections").delete().eq("brand_id", brandId);
            }
          }

          // Create new sections
          for (const section of payload.sections) {
            const templateId = typeToTemplateId.get(section.template_type);
            if (!templateId) {
              logs.push(`[${brandId}] Tipo "${section.template_type}" sem template cadastrado, ignorado.`);
              continue;
            }

            const { data: newSection, error: secErr } = await supabase
              .from("brand_sections")
              .insert({
                brand_id: brandId,
                template_id: templateId,
                title: section.title,
                subtitle: section.subtitle,
                cta_text: section.cta_text,
                order_index: section.order_index,
                visual_json: section.visual_json,
                is_enabled: true,
              })
              .select("id")
              .single();

            if (secErr) {
              logs.push(`[${brandId}] Erro ao criar seção "${section.title}": ${secErr.message}`);
              continue;
            }

            // Create sources
            if (section.sources && newSection) {
              for (const src of section.sources) {
                await supabase.from("brand_section_sources").insert({
                  brand_section_id: newSection.id,
                  source_type: src.source_type as any,
                  filters_json: src.filters_json,
                  limit: src.limit,
                });
              }
            }
          }

          successCount++;
          logs.push(`[${brandId}] Template aplicado com sucesso.`);
        } catch (err: any) {
          errorCount++;
          logs.push(`[${brandId}] Erro: ${err.message}`);
        }
      }

      // Update job
      await supabase
        .from("home_template_apply_jobs")
        .update({
          status: errorCount > 0 ? "FAILED" : "DONE",
          finished_at: new Date().toISOString(),
          logs_json: logs,
        })
        .eq("id", job.id);

      // Audit log
      await supabase.from("audit_logs").insert({
        actor_user_id: user.id,
        action: "APPLY_HOME_TEMPLATE",
        entity_type: "home_template_library",
        entity_id: selectedTemplate.id,
        details_json: { scope_type: scopeType, scope_id: scopeId, overwrite, success: successCount, errors: errorCount },
      });

      return { successCount, errorCount, logs };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["home-templates"] });
      if (result.errorCount > 0) {
        toast.warning(`Concluído com ${result.errorCount} erro(s) e ${result.successCount} sucesso(s).`);
      } else {
        toast.success(`Template aplicado em ${result.successCount} brand(s) com sucesso!`);
      }
      setApplyOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openApplyDialog = (template: HomeTemplate) => {
    setSelectedTemplate(template);
    setScopeType("BRAND");
    setScopeId("");
    setOverwrite(true);
    setApplyOpen(true);
  };

  const openPreview = (template: HomeTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <LayoutTemplate className="h-6 w-6" />
          Galeria de Templates de Home
        </h2>
        <p className="text-muted-foreground">Aplique rapidamente um layout completo na vitrine de uma ou mais Brands.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates?.map(t => (
            <Card key={t.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{TEMPLATE_ICONS[t.key] || "📄"}</span>
                    <div>
                      <CardTitle className="text-lg">{t.name}</CardTitle>
                      {t.is_default && <Badge variant="default" className="mt-1">Padrão</Badge>}
                    </div>
                  </div>
                  <Badge variant="outline">{t.template_payload_json.sections.length} seções</Badge>
                </div>
                <CardDescription className="mt-2">{t.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-1.5">
                  {t.template_payload_json.sections.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span className="font-medium text-foreground">{s.title}</span>
                      <span>—</span>
                      <span>{SECTION_TYPE_LABELS[s.template_type] || s.template_type}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="gap-2 border-t pt-4">
                <Button variant="outline" size="sm" onClick={() => openPreview(t)}>
                  <Eye className="h-4 w-4 mr-1" /> Preview
                </Button>
                <Button size="sm" onClick={() => openApplyDialog(t)}>
                  <Zap className="h-4 w-4 mr-1" /> Aplicar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">{selectedTemplate ? TEMPLATE_ICONS[selectedTemplate.key] || "📄" : ""}</span>
              {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{selectedTemplate?.description}</p>
          <Separator />
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-4">
              {selectedTemplate?.template_payload_json.sections.map((s, i) => (
                <div key={i} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{s.title}</span>
                    <Badge variant="outline" className="text-xs">{SECTION_TYPE_LABELS[s.template_type] || s.template_type}</Badge>
                  </div>
                  {s.subtitle && <p className="text-xs text-muted-foreground">{s.subtitle}</p>}
                  {s.cta_text && <p className="text-xs">CTA: <span className="font-medium">{s.cta_text}</span></p>}
                  {s.sources.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Fontes: {s.sources.map(src => `${src.source_type} (limit: ${src.limit})`).join(", ")}
                    </div>
                  )}
                  {Object.keys(s.visual_json).length > 0 && (
                    <pre className="text-xs bg-muted rounded p-1.5 overflow-auto">{JSON.stringify(s.visual_json, null, 2)}</pre>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Apply Dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Aplicar "{selectedTemplate?.name}"
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Escopo de Aplicação</Label>
              <RadioGroup value={scopeType} onValueChange={v => { setScopeType(v as any); setScopeId(""); }}>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="BRAND" id="scope-brand" />
                  <Label htmlFor="scope-brand">Aplicar nesta Brand</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="TENANT" id="scope-tenant" />
                  <Label htmlFor="scope-tenant">Aplicar em todas as Brands do Tenant</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="ALL" id="scope-all" />
                  <Label htmlFor="scope-all">Aplicar em todas as Brands da plataforma</Label>
                </div>
              </RadioGroup>
            </div>

            {scopeType === "BRAND" && (
              <div className="space-y-2">
                 <Label>Marca</Label>
                 <Select value={scopeId} onValueChange={setScopeId}>
                   <SelectTrigger><SelectValue placeholder="Selecione a Marca" /></SelectTrigger>
                  <SelectContent>
                    {brands?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {scopeType === "TENANT" && (
              <div className="space-y-2">
                 <Label>Organização</Label>
                 <Select value={scopeId} onValueChange={setScopeId}>
                   <SelectTrigger><SelectValue placeholder="Selecione a Organização" /></SelectTrigger>
                  <SelectContent>
                    {tenants?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox id="overwrite" checked={overwrite} onCheckedChange={v => setOverwrite(!!v)} />
                <Label htmlFor="overwrite">Sobrescrever home atual?</Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                {overwrite
                  ? "As seções existentes serão removidas e substituídas pelo template."
                  : "As novas seções serão adicionadas às existentes."}
              </p>
            </div>

            <Button
              className="w-full"
              onClick={() => applyMutation.mutate()}
              disabled={applyMutation.isPending || (scopeType !== "ALL" && !scopeId)}
            >
              {applyMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Aplicando...</>
              ) : (
                <><Zap className="h-4 w-4 mr-2" /> Aplicar Template</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
