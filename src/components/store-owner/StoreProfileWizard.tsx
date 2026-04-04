import { useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Camera, ImageIcon, FileText, Tag, MapPin, Images, Clock,
  CheckCircle2, ChevronLeft, ChevronRight, SkipForward, Loader2,
  Globe, Instagram, MessageCircle, X, Store,
} from "lucide-react";
import { toast } from "sonner";
import ImageUploadField from "@/components/ImageUploadField";
import SegmentAutocomplete from "@/components/SegmentAutocomplete";
import OperatingHoursEditor, { type DayHours } from "./OperatingHoursEditor";

interface WizardStep {
  key: string;
  title: string;
  subtitle: string;
  icon: typeof Camera;
  required: boolean;
}

const STEPS: WizardStep[] = [
  { key: "logo", title: "Logomarca", subtitle: "A primeira impressão do seu negócio", icon: Camera, required: true },
  { key: "banner", title: "Banner", subtitle: "Imagem de capa do seu perfil", icon: ImageIcon, required: true },
  { key: "basics", title: "Dados Básicos", subtitle: "Nome, descrição e contato", icon: FileText, required: true },
  { key: "segment", title: "Segmento", subtitle: "Qual é o ramo do seu negócio?", icon: Tag, required: true },
  { key: "contact", title: "Endereço e Contato", subtitle: "Onde te encontrar", icon: MapPin, required: true },
  { key: "gallery", title: "Galeria de Fotos", subtitle: "Mostre seu espaço e produtos", icon: Images, required: false },
  { key: "hours", title: "Horário de Funcionamento", subtitle: "Quando você atende", icon: Clock, required: false },
  { key: "review", title: "Revisão", subtitle: "Veja como ficou!", icon: CheckCircle2, required: false },
];

interface Props {
  store: any;
  initialStep?: number;
  onClose: () => void;
  onComplete: () => void;
}

export default function StoreProfileWizard({ store, initialStep = 0, onClose, onComplete }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    logo_url: store.logo_url || "",
    banner_url: store.banner_url || "",
    name: store.name || "",
    email: store.email || "",
    phone: store.phone || "",
    description: store.description || "",
    taxonomy_segment_id: store.taxonomy_segment_id || "",
    segment: store.segment || "",
    tags: (store.tags || []) as string[],
    address: store.address || "",
    whatsapp: store.whatsapp || "",
    instagram: store.instagram || "",
    site_url: store.site_url || "",
    gallery_urls: (store.gallery_urls || []) as string[],
    operating_hours_json: (store.operating_hours_json || []) as DayHours[],
  });
  const [availableTags, setAvailableTags] = useState<{ id: string; name: string }[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  // Calculate which steps are already filled based on current form state
  const stepFilledMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    map["logo"] = !!form.logo_url;
    map["banner"] = !!form.banner_url;
    map["basics"] = !!(form.name && form.description);
    map["segment"] = !!form.taxonomy_segment_id;
    map["contact"] = !!form.address;
    map["gallery"] = form.gallery_urls.length > 0;
    map["hours"] = form.operating_hours_json.length > 0;
    map["review"] = Object.entries(map).every(([, v]) => v);
    return map;
  }, [form]);

  // Find first missing step for smart start
  const firstMissingIdx = useMemo(() => {
    const idx = STEPS.findIndex(s => !stepFilledMap[s.key]);
    return idx === -1 ? STEPS.length - 1 : idx;
  }, [stepFilledMap]);

  const [step, setStep] = useState(() => {
    // Use initialStep if provided and valid, otherwise compute from missing
    if (initialStep > 0) return initialStep;
    return firstMissingIdx;
  });

  const currentStep = STEPS[step];
  const progressPercent = Math.round(((step + 1) / STEPS.length) * 100);

  // Fetch sibling tags when segment changes
  useEffect(() => {
    if (!form.taxonomy_segment_id) { setAvailableTags([]); return; }
    const fetchSiblings = async () => {
      setLoadingTags(true);
      const { data: seg } = await supabase
        .from("taxonomy_segments")
        .select("category_id")
        .eq("id", form.taxonomy_segment_id)
        .maybeSingle();
      if (seg?.category_id) {
        const { data: siblings } = await supabase
          .from("taxonomy_segments")
          .select("id, name")
          .eq("category_id", seg.category_id)
          .neq("id", form.taxonomy_segment_id)
          .order("name");
        setAvailableTags(siblings || []);
      }
      setLoadingTags(false);
    };
    fetchSiblings();
  }, [form.taxonomy_segment_id]);

  const getFieldsForStep = (stepKey: string): Record<string, any> => {
    switch (stepKey) {
      case "logo": return { logo_url: form.logo_url || null };
      case "banner": return { banner_url: form.banner_url || null };
      case "basics": return { name: form.name, email: form.email || null, phone: form.phone || null, description: form.description };
      case "segment": return { taxonomy_segment_id: form.taxonomy_segment_id || null, segment: form.segment || null, tags: form.tags.length ? form.tags : null };
      case "contact": return { address: form.address || null, whatsapp: form.whatsapp || null, instagram: form.instagram || null, site_url: form.site_url || null };
      case "gallery": return { gallery_urls: form.gallery_urls.length ? form.gallery_urls : null };
      case "hours": return { operating_hours_json: form.operating_hours_json.length ? form.operating_hours_json : null };
      default: return {};
    }
  };

  const isStepValid = (stepKey: string): boolean => {
    switch (stepKey) {
      case "logo": return !!form.logo_url;
      case "banner": return !!form.banner_url;
      case "basics": return !!(form.name && form.description);
      case "segment": return !!form.taxonomy_segment_id;
      case "contact": return !!form.address;
      case "gallery": return true;
      case "hours": return true;
      case "review": return true;
      default: return true;
    }
  };

  const saveStep = useCallback(async (stepKey: string) => {
    if (stepKey === "review") return true;
    setSaving(true);
    const fields = getFieldsForStep(stepKey);
    const { error } = await supabase.from("stores").update(fields).eq("id", store.id);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar: " + error.message); return false; }
    return true;
  }, [form, store.id]);

  const handleNext = async () => {
    const saved = await saveStep(currentStep.key);
    if (!saved) return;
    if (step === STEPS.length - 1) {
      toast.success("Perfil configurado com sucesso! 🎉");
      onComplete();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => { if (step > 0) setStep(s => s - 1); };

  const handleSkip = async () => {
    await saveStep(currentStep.key);
    setStep(s => s + 1);
  };

  const toggleTag = (name: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(name) ? prev.tags.filter(t => t !== name) : [...prev.tags, name],
    }));
  };

  const StepIcon = currentStep.icon;

  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-muted transition-colors">
          <X className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium">Passo {step + 1} de {STEPS.length}</p>
        </div>
      </div>

      {/* Progress bar */}
      <Progress value={progressPercent} className="h-1.5 mb-6" />

      {/* Step dots — free navigation, filled steps show check */}
      <div className="flex justify-center gap-1.5 mb-6">
        {STEPS.map((s, i) => {
          const filled = stepFilledMap[s.key];
          return (
            <button
              key={s.key}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all ${
                i === step ? "w-6 bg-primary" : filled ? "w-2 bg-primary/60 cursor-pointer" : "w-2 bg-muted cursor-pointer"
              }`}
              title={s.title}
            />
          );
        })}
      </div>

      {/* Step content */}
      <div className="flex-1">
        {/* Title area */}
        <div className="text-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <StepIcon className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-lg font-bold">{currentStep.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{currentStep.subtitle}</p>
        </div>

        {/* Step body */}
        <div className="space-y-4">
          {currentStep.key === "logo" && (
            <div className="flex flex-col items-center gap-4">
              {form.logo_url && (
                <div className="relative">
                  <img src={form.logo_url} alt="Logo" className="h-28 w-28 rounded-full object-cover border-2 border-input shadow-md" />
                  <button onClick={() => setForm(p => ({ ...p, logo_url: "" }))} className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <ImageUploadField value={form.logo_url} onChange={url => setForm(p => ({ ...p, logo_url: url }))} folder={`stores/${store.id}/logo`} label="Enviar logo" aspectRatio={1} previewClassName="hidden" />
            </div>
          )}

          {currentStep.key === "banner" && (
            <div>
              {form.banner_url && (
                <div className="relative mb-3 rounded-xl overflow-hidden border">
                  <img src={form.banner_url} alt="Banner" className="w-full aspect-[16/9] object-cover" />
                  <button onClick={() => setForm(p => ({ ...p, banner_url: "" }))} className="absolute top-2 right-2 h-7 w-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <ImageUploadField value={form.banner_url} onChange={url => setForm(p => ({ ...p, banner_url: url }))} folder={`stores/${store.id}/banner`} label="Enviar banner" aspectRatio={16 / 9} previewClassName="hidden" />
            </div>
          )}

          {currentStep.key === "basics" && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Nome do estabelecimento *</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Pizzaria do João" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Descrição *</Label>
                <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Descreva seu negócio, produtos e diferenciais..." rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">E-mail</Label>
                  <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="contato@loja.com" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Telefone</Label>
                  <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="(11) 99999-9999" />
                </div>
              </div>
            </div>
          )}

          {currentStep.key === "segment" && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Segmento principal *</Label>
                <SegmentAutocomplete
                  value={form.taxonomy_segment_id || null}
                  segmentName={form.segment}
                  onSelect={(segId, segName) => setForm(p => ({ ...p, taxonomy_segment_id: segId || "", segment: segName, tags: [] }))}
                  storeId={store.id}
                  placeholder="Digite para buscar... Ex: Hamburgueria"
                />
              </div>
              {form.taxonomy_segment_id && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Quais tipos de produto você vende?</Label>
                  {loadingTags ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" /> Carregando...
                    </div>
                  ) : availableTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map(tag => {
                        const selected = form.tags.includes(tag.name);
                        return (
                          <Badge
                            key={tag.id}
                            variant={selected ? "default" : "outline"}
                            className={`cursor-pointer transition-all text-xs ${selected ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent"}`}
                            onClick={() => toggleTag(tag.name)}
                          >
                            {tag.name}
                          </Badge>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Nenhuma tag disponível</p>
                  )}
                </div>
              )}
            </div>
          )}

          {currentStep.key === "contact" && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><MapPin className="h-3 w-3" /> Endereço *</Label>
                <Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Rua, número, bairro, cidade" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><MessageCircle className="h-3 w-3" /> WhatsApp</Label>
                <Input value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} placeholder="5511999999999" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><Instagram className="h-3 w-3" /> Instagram</Label>
                <Input value={form.instagram} onChange={e => setForm(p => ({ ...p, instagram: e.target.value }))} placeholder="@meuinsta" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><Globe className="h-3 w-3" /> Site</Label>
                <Input value={form.site_url} onChange={e => setForm(p => ({ ...p, site_url: e.target.value }))} placeholder="https://meusite.com" />
              </div>
            </div>
          )}

          {currentStep.key === "gallery" && (
            <div>
              {form.gallery_urls.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {form.gallery_urls.map((url, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border aspect-square">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setForm(p => ({ ...p, gallery_urls: p.gallery_urls.filter((_, idx) => idx !== i) }))}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {form.gallery_urls.length < 10 && (
                <GalleryUploadInline storeId={store.id} onUploaded={url => setForm(p => ({ ...p, gallery_urls: [...p.gallery_urls, url] }))} />
              )}
              <p className="text-xs text-muted-foreground text-center mt-3">{form.gallery_urls.length}/10 fotos</p>
            </div>
          )}

          {currentStep.key === "hours" && (
            <OperatingHoursEditor
              value={form.operating_hours_json}
              onChange={hours => setForm(p => ({ ...p, operating_hours_json: hours }))}
            />
          )}

          {currentStep.key === "review" && (
            <div className="space-y-4">
              {/* Mini store card preview */}
              <div className="rounded-2xl border overflow-hidden shadow-sm">
                {form.banner_url ? (
                  <img src={form.banner_url} alt="" className="w-full aspect-[16/9] object-cover" />
                ) : (
                  <div className="w-full aspect-[16/9] bg-muted flex items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground/40" /></div>
                )}
                <div className="p-4 flex items-start gap-3">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="" className="h-12 w-12 rounded-full object-cover border-2 border-background shadow -mt-8" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-muted border-2 border-background shadow -mt-8 flex items-center justify-center"><Store className="h-5 w-5 text-muted-foreground/40" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{form.name || "Nome da loja"}</p>
                    <p className="text-xs text-muted-foreground truncate">{form.segment || "Segmento"}</p>
                    {form.address && <p className="text-xs text-muted-foreground mt-1 truncate">{form.address}</p>}
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-2">
                {STEPS.slice(0, -1).map(s => {
                  const filled = isStepValid(s.key);
                  const Icon = s.icon;
                  return (
                    <div key={s.key} className={`flex items-center gap-3 p-3 rounded-xl border ${filled ? "border-primary/20 bg-primary/5" : "border-muted"}`}>
                      <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${filled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {filled ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <span className={`text-sm ${filled ? "font-medium" : "text-muted-foreground"}`}>{s.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="sticky bottom-0 bg-background pt-4 pb-2 mt-6 flex gap-3">
        {step > 0 && (
          <Button variant="outline" onClick={handleBack} className="gap-1.5">
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Button>
        )}
        <div className="flex-1" />
        {!currentStep.required && step < STEPS.length - 1 && (
          <Button variant="ghost" onClick={handleSkip} className="gap-1.5 text-muted-foreground">
            Pular <SkipForward className="h-4 w-4" />
          </Button>
        )}
        <Button
          onClick={handleNext}
          disabled={saving || (currentStep.required && !isStepValid(currentStep.key))}
          className="gap-1.5"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {step === STEPS.length - 1 ? "Concluir 🎉" : (
            <>Próximo <ChevronRight className="h-4 w-4" /></>
          )}
        </Button>
      </div>
    </div>
  );
}

function GalleryUploadInline({ storeId, onUploaded }: { storeId: string; onUploaded: (url: string) => void }) {
  const [tempUrl, setTempUrl] = useState("");
  const handleChange = (url: string) => {
    if (url) { onUploaded(url); setTempUrl(""); }
  };
  return <ImageUploadField value={tempUrl} onChange={handleChange} folder={`stores/${storeId}/gallery`} label="Adicionar foto" aspectRatio={1} previewClassName="hidden" />;
}

