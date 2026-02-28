import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/contexts/BrandContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ChevronRight, ChevronLeft, Check, Store, MapPin, FileText, Lock, Upload } from "lucide-react";

const STEPS = [
  { label: "Dados básicos", icon: Store },
  { label: "Endereço e canais", icon: MapPin },
  { label: "Documentos e mídia", icon: FileText },
  { label: "Acesso", icon: Lock },
];

const CATEGORIES = [
  "Alimentação", "Moda", "Beleza", "Saúde", "Educação",
  "Tecnologia", "Casa e Decoração", "Entretenimento", "Serviços", "Outro"
];

interface WizardData {
  // Step 1
  name: string;
  phone: string;
  email: string;
  cnpj: string;
  category: string;
  segment: string;
  tags: string;
  store_type: string;
  // Step 2
  address: string;
  site_url: string;
  instagram: string;
  whatsapp: string;
  // Step 3 (file URLs after upload)
  cnpj_doc_url: string;
  contrato_url: string;
  logo_url: string;
  banner_url: string;
  // Step 4
  password: string;
  confirm_password: string;
}

const defaultData: WizardData = {
  name: "", phone: "", email: "", cnpj: "", category: "", segment: "", tags: "", store_type: "RECEPTORA",
  address: "", site_url: "", instagram: "", whatsapp: "",
  cnpj_doc_url: "", contrato_url: "", logo_url: "", banner_url: "",
  password: "", confirm_password: "",
};

export default function StoreRegistrationWizard() {
  const { user } = useAuth();
  const { brand, selectedBranch } = useBrand();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(defaultData);
  const [saving, setSaving] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

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
    if (!brand || !user) return;
    setUploading(prev => ({ ...prev, [field]: true }));
    const ext = file.name.split(".").pop();
    const path = `${brand.id}/stores/${user.id}/${field}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("brand-assets").upload(path, file);
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
    } else {
      const { data: urlData } = supabase.storage.from("brand-assets").getPublicUrl(path);
      update(field as keyof WizardData, urlData.publicUrl);
    }
    setUploading(prev => ({ ...prev, [field]: false }));
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
      toast({ title: "Rascunho salvo!" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!storeId) return;

    // Validate step 4
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
      // If user isn't signed up yet with email/pass, sign them up
      // Otherwise just update the store status
      const { error } = await supabase
        .from("stores")
        .update({
          approval_status: "PENDING_APPROVAL",
          submitted_at: new Date().toISOString(),
          wizard_step: 4,
        })
        .eq("id", storeId);

      if (error) throw error;

      // Upload documents as store_documents records
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

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-5 py-16 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-green-600" />
          </div>
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">Cadastro Enviado!</h2>
        <p className="text-muted-foreground mb-1">Seu estabelecimento foi enviado para análise.</p>
        <p className="text-sm text-muted-foreground">Você será notificado quando for aprovado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-8">
      <h2 className="text-2xl font-bold mb-2">Cadastrar minha loja</h2>
      <p className="text-sm text-muted-foreground mb-8">Preencha as informações para registrar seu estabelecimento</p>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                  isActive ? "bg-primary text-primary-foreground shadow-lg" :
                  isDone ? "bg-primary/20 text-primary" :
                  "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {step === 0 && (
            <>
              <div>
                <Label>Nome do estabelecimento *</Label>
                <Input value={data.name} onChange={e => update("name", e.target.value)} placeholder="Ex: Pizzaria do Zé" />
              </div>
              <div>
                <Label>Tipo de loja *</Label>
                <Select value={data.store_type} onValueChange={v => update("store_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECEPTORA">Receptora (recebe resgates)</SelectItem>
                    <SelectItem value="EMISSORA">Emissora (distribui pontos)</SelectItem>
                    <SelectItem value="MISTA">Mista (emite e recebe)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Telefone *</Label>
                  <Input value={data.phone} onChange={e => update("phone", e.target.value)} placeholder="(11) 99999-0000" />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input value={data.email} onChange={e => update("email", e.target.value)} type="email" placeholder="loja@email.com" />
                </div>
              </div>
              <div>
                <Label>CNPJ *</Label>
                <Input value={data.cnpj} onChange={e => update("cnpj", e.target.value)} placeholder="00.000.000/0000-00" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Categoria *</Label>
                  <Select value={data.category} onValueChange={v => update("category", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Segmento</Label>
                  <Input value={data.segment} onChange={e => update("segment", e.target.value)} placeholder="Ex: Pizzaria" />
                </div>
              </div>
              <div>
                <Label>Tags (separadas por vírgula)</Label>
                <Input value={data.tags} onChange={e => update("tags", e.target.value)} placeholder="pizza, delivery, italiana" />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <Label>Endereço completo *</Label>
                <Textarea value={data.address} onChange={e => update("address", e.target.value)} placeholder="Rua, número, bairro, cidade, estado, CEP" rows={3} />
              </div>
              <div>
                <Label>Site (opcional)</Label>
                <Input value={data.site_url} onChange={e => update("site_url", e.target.value)} placeholder="https://meusite.com" />
              </div>
              <div>
                <Label>Instagram (opcional)</Label>
                <Input value={data.instagram} onChange={e => update("instagram", e.target.value)} placeholder="@minhalojaoficial" />
              </div>
              <div>
                <Label>WhatsApp de vendas (opcional)</Label>
                <Input value={data.whatsapp} onChange={e => update("whatsapp", e.target.value)} placeholder="(11) 99999-0000" />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {[
                { field: "cnpj_doc_url", label: "Documento CNPJ *", accept: ".pdf,.jpg,.png" },
                { field: "contrato_url", label: "Contrato Social *", accept: ".pdf,.jpg,.png" },
                { field: "logo_url", label: "Logomarca *", accept: ".jpg,.png,.webp,.svg" },
                { field: "banner_url", label: "Banner de perfil *", accept: ".jpg,.png,.webp" },
              ].map(({ field, label, accept }) => (
                <div key={field}>
                  <Label>{label}</Label>
                  <div className="mt-1.5">
                    {data[field as keyof WizardData] ? (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700 flex-1 truncate">Arquivo enviado</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => update(field as keyof WizardData, "")}
                          className="text-xs"
                        >
                          Trocar
                        </Button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 p-4 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 cursor-pointer transition-colors">
                        {uploading[field] ? (
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {uploading[field] ? "Enviando..." : "Clique para enviar"}
                        </span>
                        <input
                          type="file"
                          accept={accept}
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(field, file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-sm text-muted-foreground">
                Crie uma senha para acessar o painel da sua loja após aprovação.
              </p>
              <div>
                <Label>Senha *</Label>
                <Input type="password" value={data.password} onChange={e => update("password", e.target.value)} placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <Label>Confirmar senha *</Label>
                <Input type="password" value={data.confirm_password} onChange={e => update("confirm_password", e.target.value)} placeholder="Repita a senha" />
              </div>
              {data.password && data.confirm_password && data.password !== data.confirm_password && (
                <p className="text-xs text-destructive">As senhas não conferem</p>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1 h-12 rounded-2xl">
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        )}
        {step < 3 ? (
          <Button
            onClick={() => saveDraft(step + 1)}
            disabled={!canAdvance() || saving}
            className="flex-1 h-12 rounded-2xl"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Salvar e Avançar <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canAdvance() || saving}
            className="flex-1 h-12 rounded-2xl"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
            Enviar para Análise
          </Button>
        )}
      </div>
    </div>
  );
}
