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
import { LayoutTemplate, Zap, Eye, Loader2, Plus, Pencil, Copy } from "lucide-react";
import { toast } from "sonner";
import HomeTemplateEditor from "@/components/HomeTemplateEditor";
import HomeTemplateMobilePreview from "@/components/HomeTemplateMobilePreview";

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
  MANUAL_LINKS_GRID: "Grade de Links",
  MANUAL_LINKS_CAROUSEL: "Carrossel de Links",
  GRID_LOGOS: "Grade de Logos",
  GRID_INFO: "Grade Info",
  LIST_INFO: "Lista Info",
};

export default function HomeTemplatesPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [applyOpen, setApplyOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<HomeTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<HomeTemplate | null>(null);
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

  // Save (create/update) template
  const saveMutation = useMutation({
    mutationFn: async (tpl: { id?: string; key: string; name: string; description: string; is_default: boolean; template_payload_json: { sections: TemplateSection[] } }) => {
      if (tpl.id) {
        const { error } = await supabase.from("home_template_library").update({
          name: tpl.name,
          description: tpl.description,
          is_default: tpl.is_default,
          template_payload_json: tpl.template_payload_json as any,
        }).eq("id", tpl.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("home_template_library").insert({
          key: tpl.key,
          name: tpl.name,
          description: tpl.description,
          is_default: tpl.is_default,
          template_payload_json: tpl.template_payload_json as any,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["home-templates"] });
      toast.success(editingTemplate ? "Template atualizado!" : "Template criado!");
      setEditorOpen(false);
      setEditingTemplate(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Apply template mutation (same as before)
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
        targetBrandIds = (brands?.filter(b => b.tenant_id === scopeId) || []).map(b => b.id);
      } else {
        targetBrandIds = brands?.map(b => b.id) || [];
      }
      if (targetBrandIds.length === 0) throw new Error("Nenhuma brand encontrada no escopo");

      const { data: job, error: jobErr } = await supabase
        .from("home_template_apply_jobs")
        .insert({ created_by: user.id, template_id: selectedTemplate.id, scope_type: scopeType, scope_id: scopeType !== "ALL" ? scopeId : null, overwrite, status: "RUNNING" })
        .select("id").single();
      if (jobErr) throw jobErr;

      const logs: string[] = [];
      let successCount = 0, errorCount = 0;

      for (const brandId of targetBrandIds) {
        try {
          const { data: sectionTemplates } = await supabase.from("section_templates").select("id, type").eq("is_active", true);
          const typeToTemplateId = new Map<string, string>();
          sectionTemplates?.forEach(st => typeToTemplateId.set(st.type, st.id));

          if (overwrite) {
            const { data: existingSections } = await supabase.from("brand_sections").select("id").eq("brand_id", brandId);
            if (existingSections && existingSections.length > 0) {
              const sectionIds = existingSections.map(s => s.id);
              await supabase.from("brand_section_sources").delete().in("brand_section_id", sectionIds);
              await supabase.from("brand_section_manual_items").delete().in("brand_section_id", sectionIds);
              await supabase.from("brand_sections").delete().eq("brand_id", brandId);
            }
          }

          for (const section of payload.sections) {
            const templateId = typeToTemplateId.get(section.template_type);
            if (!templateId) { logs.push(`[${brandId}] Tipo "${section.template_type}" sem template, ignorado.`); continue; }
            const { data: newSection, error: secErr } = await supabase
              .from("brand_sections")
              .insert({ brand_id: brandId, template_id: templateId, title: section.title, subtitle: section.subtitle, cta_text: section.cta_text, order_index: section.order_index, visual_json: section.visual_json, is_enabled: true })
              .select("id").single();
            if (secErr) { logs.push(`[${brandId}] Erro: ${secErr.message}`); continue; }
            if (section.sources && newSection) {
              for (const src of section.sources) {
                await supabase.from("brand_section_sources").insert({ brand_section_id: newSection.id, source_type: src.source_type as any, filters_json: src.filters_json, limit: src.limit });
              }
            }
          }
          successCount++;
          logs.push(`[${brandId}] OK`);
        } catch (err: any) { errorCount++; logs.push(`[${brandId}] Erro: ${err.message}`); }
      }

      await supabase.from("home_template_apply_jobs").update({ status: errorCount > 0 ? "FAILED" : "DONE", finished_at: new Date().toISOString(), logs_json: logs }).eq("id", job.id);
      await supabase.from("audit_logs").insert({ actor_user_id: user.id, action: "APPLY_HOME_TEMPLATE", entity_type: "home_template_library", entity_id: selectedTemplate.id, details_json: { scope_type: scopeType, scope_id: scopeId, overwrite, success: successCount, errors: errorCount } });
      return { successCount, errorCount };
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["home-templates"] });
      r.errorCount > 0 ? toast.warning(`${r.errorCount} erro(s), ${r.successCount} sucesso(s).`) : toast.success(`Aplicado em ${r.successCount} brand(s)!`);
      setApplyOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openApplyDialog = (t: HomeTemplate) => { setSelectedTemplate(t); setScopeType("BRAND"); setScopeId(""); setOverwrite(true); setApplyOpen(true); };
  const openPreview = (t: HomeTemplate) => { setSelectedTemplate(t); setPreviewOpen(true); };
  const openEditor = (t?: HomeTemplate) => { setEditingTemplate(t || null); setEditorOpen(true); };
  const duplicateTemplate = (t: HomeTemplate) => {
    setEditingTemplate({ ...t, id: "" as any, key: t.key + "-copia", name: t.name + " (cópia)" } as HomeTemplate);
    setEditorOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <LayoutTemplate className="h-6 w-6" />
            Galeria de Templates de Home
          </h2>
          <p className="text-muted-foreground">Crie, visualize e aplique layouts na vitrine das Brands.</p>
        </div>
        <Button onClick={() => openEditor()}>
          <Plus className="h-4 w-4 mr-2" /> Novo Template
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
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
              <CardFooter className="gap-2 border-t pt-4 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => openPreview(t)}>
                  <Eye className="h-4 w-4 mr-1" /> Preview
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEditor(t)}>
                  <Pencil className="h-4 w-4 mr-1" /> Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => duplicateTemplate(t)}>
                  <Copy className="h-4 w-4 mr-1" /> Duplicar
                </Button>
                <Button size="sm" onClick={() => openApplyDialog(t)}>
                  <Zap className="h-4 w-4 mr-1" /> Aplicar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Mobile Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[400px] p-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview: {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <HomeTemplateMobilePreview
              sections={selectedTemplate.template_payload_json.sections}
              templateName={selectedTemplate.name}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={v => { if (!v) { setEditorOpen(false); setEditingTemplate(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate?.id ? "Editar Template" : "Novo Template"}</DialogTitle>
          </DialogHeader>
          <HomeTemplateEditor
            initialData={editingTemplate ? {
              id: editingTemplate.id || undefined,
              key: editingTemplate.key,
              name: editingTemplate.name,
              description: editingTemplate.description || "",
              is_default: editingTemplate.is_default,
              template_payload_json: editingTemplate.template_payload_json,
            } : undefined}
            onSave={async (data) => { await saveMutation.mutateAsync(data); }}
            onCancel={() => { setEditorOpen(false); setEditingTemplate(null); }}
            saving={saveMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Apply Dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" /> Aplicar "{selectedTemplate?.name}"
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Escopo de Aplicação</Label>
              <RadioGroup value={scopeType} onValueChange={v => { setScopeType(v as any); setScopeId(""); }}>
                <div className="flex items-center gap-2"><RadioGroupItem value="BRAND" id="scope-brand" /><Label htmlFor="scope-brand">Aplicar nesta Brand</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="TENANT" id="scope-tenant" /><Label htmlFor="scope-tenant">Todas as Brands do Tenant</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="ALL" id="scope-all" /><Label htmlFor="scope-all">Todas as Brands da plataforma</Label></div>
              </RadioGroup>
            </div>
            {scopeType === "BRAND" && (
              <div className="space-y-2">
                <Label>Marca</Label>
                <Select value={scopeId} onValueChange={setScopeId}>
                  <SelectTrigger><SelectValue placeholder="Selecione a Marca" /></SelectTrigger>
                  <SelectContent>{brands?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            {scopeType === "TENANT" && (
              <div className="space-y-2">
                <Label>Organização</Label>
                <Select value={scopeId} onValueChange={setScopeId}>
                  <SelectTrigger><SelectValue placeholder="Selecione a Organização" /></SelectTrigger>
                  <SelectContent>{tenants?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
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
                {overwrite ? "As seções existentes serão removidas e substituídas." : "As novas seções serão adicionadas às existentes."}
              </p>
            </div>
            <Button className="w-full" onClick={() => applyMutation.mutate()} disabled={applyMutation.isPending || (scopeType !== "ALL" && !scopeId)}>
              {applyMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Aplicando...</> : <><Zap className="h-4 w-4 mr-2" /> Aplicar Template</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
