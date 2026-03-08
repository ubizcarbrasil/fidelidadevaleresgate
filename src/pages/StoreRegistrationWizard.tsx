import { useState, useEffect } from "react";
import SegmentAutocomplete from "@/components/SegmentAutocomplete";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/contexts/BrandContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, ChevronRight, ChevronLeft, Check, Store, MapPin,
  FileText, Lock, Upload, Phone, Mail, Building2, Tag,
  Globe, Instagram, MessageCircle, ShieldCheck, Eye, EyeOff,
  Sparkles, CheckCircle2, AlertCircle, ImageIcon
} from "lucide-react";

const STEPS = [
  { label: "Dados básicos", desc: "Informações do estabelecimento", icon: Store },
  { label: "Endereço e canais", desc: "Localização e contato", icon: MapPin },
  { label: "Documentos e mídia", desc: "Comprovantes e imagens", icon: FileText },
  { label: "Criar acesso", desc: "Senha do portal", icon: Lock },
];

const CATEGORIES = [
  "Alimentação", "Moda", "Beleza", "Saúde", "Educação",
  "Tecnologia", "Casa e Decoração", "Entretenimento", "Serviços", "Outro"
];

interface WizardData {
  name: string;
  phone: string;
  email: string;
  cnpj: string;
  category: string;
  segment: string;
  taxonomy_segment_id: string;
  tags: string;
  store_type: string;
  address: string;
  site_url: string;
  instagram: string;
  whatsapp: string;
  cnpj_doc_url: string;
  contrato_url: string;
  logo_url: string;
  banner_url: string;
  password: string;
  confirm_password: string;
}

const defaultData: WizardData = {
  name: "", phone: "", email: "", cnpj: "", category: "", segment: "", taxonomy_segment_id: "", tags: "", store_type: "RECEPTORA",
  address: "", site_url: "", instagram: "", whatsapp: "",
  cnpj_doc_url: "", contrato_url: "", logo_url: "", banner_url: "",
  password: "", confirm_password: "",
};

function StepIndicator({ currentStep }: { currentStep: number }) {
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Etapa {currentStep + 1} de {STEPS.length}
          </h3>
          <p className="text-xs text-muted-foreground">{STEPS[currentStep].desc}</p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {Math.round(progress)}%
        </Badge>
      </div>
      <Progress value={progress} className="h-1.5" />
      <div className="flex gap-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === currentStep;
          const isDone = i < currentStep;
          return (
            <button
              key={i}
              onClick={() => { if (isDone) {} }}
              className={`flex-1 flex flex-col items-center gap-1.5 py-2 px-1 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-primary/10"
                  : isDone
                  ? "opacity-80"
                  : "opacity-40"
              }`}
            >
              <div
                className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : isDone
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={`text-[10px] font-medium leading-tight text-center ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}>
                {s.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FieldGroup({ icon: Icon, label, required, children, hint }: {
  icon: React.ElementType;
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground pl-5">{hint}</p>}
    </div>
  );
}

function FileUploadCard({ label, field, accept, value, uploading, onUpload, onClear }: {
  label: string;
  field: string;
  accept: string;
  value: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onClear: () => void;
}) {
  const isImage = accept.includes("jpg") || accept.includes("png") || accept.includes("webp") || accept.includes("svg");

  if (value) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-primary">Arquivo enviado com sucesso</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-xs text-muted-foreground shrink-0">
          Trocar
        </Button>
      </div>
    );
  }

  return (
    <label className="group flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-muted-foreground/15 hover:border-primary/30 hover:bg-primary/[0.02] cursor-pointer transition-all duration-200">
      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : isImage ? (
          <ImageIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        ) : (
          <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">
          {uploading ? "Enviando arquivo..." : `Formatos: ${accept.replace(/\./g, "").toUpperCase()}`}
        </p>
      </div>
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />
    </label>
  );
}

export default function StoreRegistrationWizard() {
  const { user } = useAuth();
  const { brand, selectedBranch } = useBrand();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(defaultData);
  const [saving, setSaving] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Load draft if exists
  useEffect(() => {
    if (!user || !brand) return;
    const loadDraft = async () => {
      const { data: existing } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_user_id", user.id)
        .eq("brand_id", brand.id)
        .eq("approval_status", "DRAFT")
        .maybeSingle();

      if (existing) {
        setStoreId(existing.id);
        setStep((existing as any).wizard_step || 0);
        const saved = (existing as any).wizard_data_json as Record<string, any> || {};
        setData(prev => ({
          ...prev,
          name: existing.name || "",
          phone: (existing as any).phone || "",
          email: (existing as any).email || "",
          cnpj: (existing as any).cnpj || "",
          category: existing.category || "",
          segment: (existing as any).segment || "",
          tags: ((existing as any).tags || []).join(", "),
          store_type: (existing as any).store_type || "RECEPTORA",
          address: existing.address || "",
          site_url: (existing as any).site_url || "",
          instagram: (existing as any).instagram || "",
          whatsapp: existing.whatsapp || "",
          logo_url: existing.logo_url || "",
          banner_url: (existing as any).banner_url || "",
          ...saved,
        }));
      }
    };
    loadDraft();
  }, [user, brand]);

  const update = (field: keyof WizardData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (field: string, file: File) => {
    if (!brand || !user) {
      toast({ title: "Aguarde", description: "Carregando dados da marca...", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "O tamanho máximo é 5MB.", variant: "destructive" });
      return;
    }
    setUploading(prev => ({ ...prev, [field]: true }));
    try {
      const ext = file.name.split(".").pop();
      const path = `${brand.id}/stores/${user.id}/${field}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("brand-assets").upload(path, file, { upsert: true });
      if (error) {
        toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      } else {
        const { data: urlData } = supabase.storage.from("brand-assets").getPublicUrl(path);
        update(field as keyof WizardData, urlData.publicUrl);
        toast({ title: `${field === "logo_url" ? "Logo" : "Arquivo"} enviado com sucesso!` });
      }
    } catch (err: any) {
      toast({ title: "Erro inesperado", description: err.message, variant: "destructive" });
    } finally {
      setUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  const saveDraft = async (nextStep: number) => {
    if (!user || !brand || !selectedBranch) return;
    setSaving(true);

    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `store-${Date.now()}`;
    const storeData: any = {
      name: data.name || "Rascunho",
      slug,
      brand_id: brand.id,
      branch_id: selectedBranch.id,
      owner_user_id: user.id,
      store_type: data.store_type,
      phone: data.phone,
      email: data.email,
      cnpj: data.cnpj,
      category: data.category,
      segment: data.segment,
      taxonomy_segment_id: data.taxonomy_segment_id || null,
      tags: data.tags ? data.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      address: data.address,
      site_url: data.site_url,
      instagram: data.instagram,
      whatsapp: data.whatsapp,
      logo_url: data.logo_url,
      banner_url: data.banner_url,
      wizard_step: nextStep,
      wizard_data_json: { cnpj_doc_url: data.cnpj_doc_url, contrato_url: data.contrato_url },
      approval_status: "DRAFT",
    };

    try {
      if (storeId) {
        const { error } = await supabase.from("stores").update(storeData).eq("id", storeId);
        if (error) throw error;
      } else {
        const { data: created, error } = await supabase.from("stores").insert(storeData).select().single();
        if (error) throw error;
        setStoreId(created.id);
      }
      setStep(nextStep);
      toast({ title: "Progresso salvo!" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!storeId) return;
    if (data.password.length < 6) {
      toast({ title: "Senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (data.password !== data.confirm_password) {
      toast({ title: "Senhas não conferem", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("stores")
        .update({
          approval_status: "PENDING_APPROVAL",
          submitted_at: new Date().toISOString(),
          wizard_step: 4,
        })
        .eq("id", storeId);
      if (error) throw error;

      const docs = [
        { type: "cnpj", url: data.cnpj_doc_url },
        { type: "contrato_social", url: data.contrato_url },
        { type: "logo", url: data.logo_url },
        { type: "banner", url: data.banner_url },
      ].filter(d => d.url);

      if (docs.length > 0) {
        await supabase.from("store_documents").upsert(
          docs.map(d => ({
            store_id: storeId,
            document_type: d.type,
            file_url: d.url,
          })),
          { onConflict: "store_id,document_type" as any }
        );
      }

      // Auto-seed demo stores for this brand/branch
      if (brand && selectedBranch) {
        try {
          await supabase.functions.invoke("seed-demo-stores", {
            body: { brand_id: brand.id, branch_id: selectedBranch.id },
          });
        } catch (seedErr) {
          console.warn("Demo seed skipped:", seedErr);
        }
      }

      setSubmitted(true);
      toast({ title: "Cadastro enviado para análise!" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const canAdvance = () => {
    switch (step) {
      case 0: return data.name && data.phone && data.email && data.cnpj && data.category;
      case 1: return data.address;
      case 2: return data.cnpj_doc_url && data.contrato_url && data.logo_url && data.banner_url;
      case 3: return data.password && data.password === data.confirm_password && data.password.length >= 6;
      default: return false;
    }
  };

  const passwordStrength = () => {
    const p = data.password;
    if (!p) return { label: "", color: "", value: 0 };
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 2) return { label: "Fraca", color: "text-destructive", value: 33 };
    if (score <= 3) return { label: "Média", color: "text-accent-foreground", value: 66 };
    return { label: "Forte", color: "text-primary", value: 100 };
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
          >
            <div className="h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
          </motion.div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Cadastro Enviado!</h2>
            <p className="text-muted-foreground">
              Seu estabelecimento foi enviado para análise da equipe.
            </p>
          </div>
          <Card className="rounded-2xl text-left">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Análise em andamento</p>
                  <p className="text-xs text-muted-foreground">
                    Nossa equipe verificará os documentos e dados enviados. Esse processo pode levar até 48h úteis.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Você será notificado</p>
                  <p className="text-xs text-muted-foreground">
                    Enviaremos um e-mail para <strong>{data.email}</strong> assim que a análise for concluída.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-lg mx-auto px-5 py-4">
          <StepIndicator currentStep={step} />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-5 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Step Title */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground">{STEPS[step].label}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{STEPS[step].desc}</p>
            </div>

            {/* Step 0: Dados básicos */}
            {step === 0 && (
              <div className="space-y-5">
                <FieldGroup icon={Store} label="Nome do estabelecimento" required>
                  <Input
                    value={data.name}
                    onChange={e => update("name", e.target.value)}
                    placeholder="Ex: Pizzaria do Zé"
                    className="h-11"
                  />
                </FieldGroup>

                <FieldGroup icon={Building2} label="Tipo de parceria" required hint="Define como seu estabelecimento interage com a plataforma">
                  <Select value={data.store_type} onValueChange={v => update("store_type", v)}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RECEPTORA">
                        <span className="flex items-center gap-2">Receptora <span className="text-muted-foreground text-xs">— recebe resgates</span></span>
                      </SelectItem>
                      <SelectItem value="EMISSORA">
                        <span className="flex items-center gap-2">Emissora <span className="text-muted-foreground text-xs">— distribui pontos</span></span>
                      </SelectItem>
                      <SelectItem value="MISTA">
                        <span className="flex items-center gap-2">Mista <span className="text-muted-foreground text-xs">— emite e recebe</span></span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FieldGroup>

                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup icon={Phone} label="Telefone" required>
                    <Input
                      value={data.phone}
                      onChange={e => update("phone", e.target.value)}
                      placeholder="(11) 99999-0000"
                      className="h-11"
                    />
                  </FieldGroup>
                  <FieldGroup icon={Mail} label="Email" required>
                    <Input
                      value={data.email}
                      onChange={e => update("email", e.target.value)}
                      type="email"
                      placeholder="contato@email.com"
                      className="h-11"
                    />
                  </FieldGroup>
                </div>

                <FieldGroup icon={FileText} label="CNPJ" required hint="Apenas números ou no formato 00.000.000/0000-00">
                  <Input
                    value={data.cnpj}
                    onChange={e => update("cnpj", e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className="h-11"
                  />
                </FieldGroup>

                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup icon={Tag} label="Categoria" required>
                    <Select value={data.category} onValueChange={v => update("category", v)}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FieldGroup>
                  <FieldGroup icon={Tag} label="Segmento">
                    <SegmentAutocomplete
                      value={data.taxonomy_segment_id || null}
                      segmentName={data.segment}
                      onSelect={(segId, segName) => {
                        setData(prev => ({ ...prev, taxonomy_segment_id: segId || "", segment: segName }));
                      }}
                      placeholder="Ex: Pizzaria"
                    />
                  </FieldGroup>
                </div>

                <FieldGroup icon={Tag} label="Tags" hint="Separe por vírgula para facilitar a busca">
                  <Input
                    value={data.tags}
                    onChange={e => update("tags", e.target.value)}
                    placeholder="pizza, delivery, italiana"
                    className="h-11"
                  />
                </FieldGroup>
              </div>
            )}

            {/* Step 1: Endereço e canais */}
            {step === 1 && (
              <div className="space-y-5">
                <FieldGroup icon={MapPin} label="Endereço completo" required hint="Rua, número, bairro, cidade, estado e CEP">
                  <Textarea
                    value={data.address}
                    onChange={e => update("address", e.target.value)}
                    placeholder="Rua das Flores, 123 - Centro, São Paulo - SP, 01001-000"
                    rows={3}
                    className="resize-none"
                  />
                </FieldGroup>

                <div className="pt-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Canais de contato (opcionais)</p>
                  <div className="space-y-4">
                    <FieldGroup icon={Globe} label="Site">
                      <Input
                        value={data.site_url}
                        onChange={e => update("site_url", e.target.value)}
                        placeholder="https://meusite.com.br"
                        className="h-11"
                      />
                    </FieldGroup>
                    <FieldGroup icon={Instagram} label="Instagram">
                      <Input
                        value={data.instagram}
                        onChange={e => update("instagram", e.target.value)}
                        placeholder="@meuestabelecimento"
                        className="h-11"
                      />
                    </FieldGroup>
                    <FieldGroup icon={MessageCircle} label="WhatsApp de vendas">
                      <Input
                        value={data.whatsapp}
                        onChange={e => update("whatsapp", e.target.value)}
                        placeholder="(11) 99999-0000"
                        className="h-11"
                      />
                    </FieldGroup>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Documentos e mídia */}
            {step === 2 && (
              <div className="space-y-4">
                <Card className="rounded-xl border-dashed border-primary/10 bg-primary/[0.02]">
                  <CardContent className="p-3 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Envie documentos legíveis e em boa qualidade. Aceitamos PDF, JPG e PNG (máx. 5MB cada).
                    </p>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <FileUploadCard
                    label="Documento CNPJ"
                    field="cnpj_doc_url"
                    accept=".pdf,.jpg,.png"
                    value={data.cnpj_doc_url}
                    uploading={uploading.cnpj_doc_url || false}
                    onUpload={f => handleFileUpload("cnpj_doc_url", f)}
                    onClear={() => update("cnpj_doc_url", "")}
                  />
                  <FileUploadCard
                    label="Contrato Social"
                    field="contrato_url"
                    accept=".pdf,.jpg,.png"
                    value={data.contrato_url}
                    uploading={uploading.contrato_url || false}
                    onUpload={f => handleFileUpload("contrato_url", f)}
                    onClear={() => update("contrato_url", "")}
                  />
                  <FileUploadCard
                    label="Logomarca"
                    field="logo_url"
                    accept=".jpg,.png,.webp,.svg"
                    value={data.logo_url}
                    uploading={uploading.logo_url || false}
                    onUpload={f => handleFileUpload("logo_url", f)}
                    onClear={() => update("logo_url", "")}
                  />
                  <FileUploadCard
                    label="Banner do perfil"
                    field="banner_url"
                    accept=".jpg,.png,.webp"
                    value={data.banner_url}
                    uploading={uploading.banner_url || false}
                    onUpload={f => handleFileUpload("banner_url", f)}
                    onClear={() => update("banner_url", "")}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Acesso */}
            {step === 3 && (
              <div className="space-y-5">
                <Card className="rounded-xl bg-muted/30">
                  <CardContent className="p-4 flex items-start gap-3">
                    <Lock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Crie sua senha de acesso</p>
                       <p className="text-xs text-muted-foreground mt-0.5">
                         Essa senha será utilizada para acessar o portal do parceiro após a aprovação do cadastro.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <FieldGroup icon={Lock} label="Senha" required hint="Mínimo de 6 caracteres">
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={data.password}
                      onChange={e => update("password", e.target.value)}
                      placeholder="••••••••"
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {data.password && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <Progress value={passwordStrength().value} className="h-1 flex-1" />
                      <span className={`text-[11px] font-medium ${passwordStrength().color}`}>
                        {passwordStrength().label}
                      </span>
                    </div>
                  )}
                </FieldGroup>

                <FieldGroup icon={ShieldCheck} label="Confirmar senha" required>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={data.confirm_password}
                      onChange={e => update("confirm_password", e.target.value)}
                      placeholder="••••••••"
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {data.password && data.confirm_password && data.password !== data.confirm_password && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" /> As senhas não conferem
                    </p>
                  )}
                  {data.password && data.confirm_password && data.password === data.confirm_password && (
                    <p className="text-xs text-primary flex items-center gap-1 mt-1">
                      <CheckCircle2 className="h-3 w-3" /> Senhas conferem
                    </p>
                  )}
                </FieldGroup>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-8 pb-8">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1 h-12 rounded-2xl font-medium"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
          )}
          {step < 3 ? (
            <Button
              onClick={() => saveDraft(step + 1)}
              disabled={!canAdvance() || saving}
              className="flex-1 h-12 rounded-2xl font-medium"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Continuar <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canAdvance() || saving}
              className="flex-1 h-12 rounded-2xl font-medium"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Enviar para Análise
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
