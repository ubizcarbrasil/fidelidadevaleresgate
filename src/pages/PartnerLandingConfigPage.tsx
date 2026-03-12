import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Save, ExternalLink, Loader2, icons } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ImageUploadField from "@/components/ImageUploadField";

interface NumberItem { value: string; label: string; }
interface BenefitItem { title: string; description: string; icon: string; }
interface HowItWorksItem { step: string; title: string; description: string; }
interface FaqItem { question: string; answer: string; }
interface TestimonialItem { name: string; role: string; text: string; initials: string; logo_url?: string; }

const ICON_OPTIONS = [
  "Eye", "Heart", "Zap", "BarChart3", "Star", "Users", "Store", "Gift",
  "Shield", "TrendingUp", "Sparkles", "CheckCircle2", "Rocket", "Target",
  "Award", "Smartphone", "PieChart", "MessageSquare", "Clock", "DollarSign",
  "ShoppingCart", "Repeat", "QrCode", "BarChart", "Settings", "BadgeCheck", "Crown",
];

function IconPreview({ name }: { name: string }) {
  const LucideIcon = (icons as any)[name];
  if (!LucideIcon) return <span className="text-xs text-muted-foreground">{name}</span>;
  return <LucideIcon className="h-4 w-4" />;
}

export default function PartnerLandingConfigPage() {
  const { currentBrandId } = useBrandGuard();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);

  const [heroTitle, setHeroTitle] = useState("Seja um Parceiro");
  const [heroSubtitle, setHeroSubtitle] = useState("Faça parte da maior rede de benefícios da sua região e atraia mais clientes para o seu negócio.");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [numbers, setNumbers] = useState<NumberItem[]>([
    { value: "10.000+", label: "Usuários ativos" },
    { value: "500+", label: "Parceiros" },
    { value: "50.000+", label: "Resgates realizados" },
  ]);
  const [benefits, setBenefits] = useState<BenefitItem[]>([
    { title: "Visibilidade", description: "Apareça para milhares de clientes.", icon: "Eye" },
    { title: "Fidelização", description: "Fidelize clientes com pontos e cashback.", icon: "Heart" },
    { title: "Sem custo inicial", description: "Comece gratuitamente.", icon: "Zap" },
    { title: "Gestão completa", description: "Painel para gerenciar ofertas e métricas.", icon: "BarChart3" },
  ]);
  const [howItWorks, setHowItWorks] = useState<HowItWorksItem[]>([
    { step: "1", title: "Cadastre-se", description: "Preencha o formulário." },
    { step: "2", title: "Configure", description: "Crie suas ofertas." },
    { step: "3", title: "Atraia clientes", description: "Seus cupons ficam visíveis no app." },
  ]);
  const [faq, setFaq] = useState<FaqItem[]>([
    { question: "Quanto custa para participar?", answer: "O cadastro é gratuito." },
    { question: "Preciso ter um site?", answer: "Não! Seu estabelecimento aparece no app." },
  ]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialWhatsapp, setSocialWhatsapp] = useState("");
  const [socialEmail, setSocialEmail] = useState("");
  const [ctaTitle, setCtaTitle] = useState("Pronto para crescer?");
  const [ctaSubtitle, setCtaSubtitle] = useState("Cadastre-se agora e comece a receber clientes.");
  const [ctaButtonText, setCtaButtonText] = useState("Quero ser Parceiro");
  const [ctaLinkUrl, setCtaLinkUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!currentBrandId) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("partner_landing_config")
        .select("*")
        .eq("brand_id", currentBrandId)
        .maybeSingle();

      if (data) {
        setConfigId(data.id);
        setHeroTitle(data.hero_title);
        setHeroSubtitle(data.hero_subtitle);
        setHeroImageUrl(data.hero_image_url || "");
        setLogoUrl((data as any).logo_url || "");
        setNumbers(data.numbers_json as any);
        setBenefits(data.benefits_json as any);
        setHowItWorks(data.how_it_works_json as any);
        setFaq(data.faq_json as any);
        setTestimonials(((data as any).testimonials_json as any) || []);
        setSocialInstagram((data as any).social_instagram || "");
        setSocialWhatsapp((data as any).social_whatsapp || "");
        setSocialEmail((data as any).social_email || "");
        setCtaTitle(data.cta_title);
        setCtaSubtitle(data.cta_subtitle);
        setCtaButtonText(data.cta_button_text);
        setCtaLinkUrl((data as any).cta_link_url || "");
        setIsActive(data.is_active);
      }
      setLoading(false);
    };
    load();
  }, [currentBrandId]);

  const handleSave = async () => {
    if (!currentBrandId) return;
    setSaving(true);

    const payload: Record<string, any> = {
      brand_id: currentBrandId,
      hero_title: heroTitle,
      hero_subtitle: heroSubtitle,
      hero_image_url: heroImageUrl || null,
      logo_url: logoUrl || null,
      numbers_json: numbers,
      benefits_json: benefits,
      how_it_works_json: howItWorks,
      faq_json: faq,
      testimonials_json: testimonials,
      social_instagram: socialInstagram || null,
      social_whatsapp: socialWhatsapp || null,
      social_email: socialEmail || null,
      cta_title: ctaTitle,
      cta_subtitle: ctaSubtitle,
      cta_button_text: ctaButtonText,
      cta_link_url: ctaLinkUrl || null,
      is_active: isActive,
    };

    let error;
    if (configId) {
      ({ error } = await supabase.from("partner_landing_config").update(payload as any).eq("id", configId));
    } else {
      const res = await supabase.from("partner_landing_config").insert(payload as any).select("id").single();
      error = res.error;
      if (res.data) setConfigId(res.data.id);
    }

    if (error) toast.error(error.message);
    else toast.success("Configuração salva com sucesso!");
    setSaving(false);
  };

  const [brandSlug, setBrandSlug] = useState("");
  useEffect(() => {
    if (!currentBrandId) return;
    supabase.from("brands").select("slug").eq("id", currentBrandId).single().then(({ data }) => {
      if (data) setBrandSlug(data.slug);
    });
  }, [currentBrandId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Landing Page de Parceiros"
        description="Configure a página de captação de novos parceiros para sua marca."
      />

      {brandSlug && (
        <a href={`/${brandSlug}/parceiro`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Visualizar página
          </Button>
        </a>
      )}

      {/* Active toggle */}
      <Card>
        <CardContent className="flex items-center justify-between pt-6">
          <div>
            <p className="font-medium">Página ativa</p>
            <p className="text-xs text-muted-foreground">Tornar a landing page visível publicamente</p>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </CardContent>
      </Card>

      {/* Hero */}
      <Card>
        <CardHeader><CardTitle className="text-base">🎯 Hero</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Logomarca da Marca</Label>
            <ImageUploadField
              value={logoUrl}
              onChange={setLogoUrl}
              folder={`partner-landing/${currentBrandId}`}
              label="Logomarca"
              previewClassName="h-16 object-contain"
            />
          </div>
          <div className="space-y-2">
            <Label>Título Principal</Label>
            <Input value={heroTitle} onChange={e => setHeroTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Subtítulo</Label>
            <Textarea value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Imagem do Hero (opcional)</Label>
            <ImageUploadField
              value={heroImageUrl}
              onChange={setHeroImageUrl}
              folder={`partner-landing/${currentBrandId}`}
              label="Imagem do Hero"
              previewClassName="h-32 w-full object-cover rounded-lg"
              aspectRatio={16 / 9}
            />
          </div>
        </CardContent>
      </Card>

      {/* Numbers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">📊 Números</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setNumbers([...numbers, { value: "0", label: "Novo" }])}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {numbers.map((n, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Valor</Label>
                <Input value={n.value} onChange={e => { const u = [...numbers]; u[i].value = e.target.value; setNumbers(u); }} />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Rótulo</Label>
                <Input value={n.label} onChange={e => { const u = [...numbers]; u[i].label = e.target.value; setNumbers(u); }} />
              </div>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setNumbers(numbers.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">✨ Benefícios</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setBenefits([...benefits, { title: "", description: "", icon: "Star" }])}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {benefits.map((b, i) => (
            <div key={i} className="p-4 rounded-lg border space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Título</Label>
                  <Input value={b.title} onChange={e => { const u = [...benefits]; u[i].title = e.target.value; setBenefits(u); }} />
                </div>
                <div className="w-44 space-y-1">
                  <Label className="text-xs">Ícone</Label>
                  <div className="relative">
                    <select
                      value={b.icon}
                      onChange={e => { const u = [...benefits]; u[i].icon = e.target.value; setBenefits(u); }}
                      className="w-full h-10 rounded-md border border-input bg-background pl-9 pr-3 text-sm"
                    >
                      {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                    </select>
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <IconPreview name={b.icon} />
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive self-end" onClick={() => setBenefits(benefits.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Descrição</Label>
                <Textarea value={b.description} onChange={e => { const u = [...benefits]; u[i].description = e.target.value; setBenefits(u); }} rows={2} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">🔄 Como Funciona</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setHowItWorks([...howItWorks, { step: String(howItWorks.length + 1), title: "", description: "" }])}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {howItWorks.map((s, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="w-16 space-y-1">
                <Label className="text-xs">Passo</Label>
                <Input value={s.step} onChange={e => { const u = [...howItWorks]; u[i].step = e.target.value; setHowItWorks(u); }} />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Título</Label>
                <Input value={s.title} onChange={e => { const u = [...howItWorks]; u[i].title = e.target.value; setHowItWorks(u); }} />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Descrição</Label>
                <Input value={s.description} onChange={e => { const u = [...howItWorks]; u[i].description = e.target.value; setHowItWorks(u); }} />
              </div>
              <Button variant="ghost" size="icon" className="text-destructive mt-5" onClick={() => setHowItWorks(howItWorks.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Testimonials */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">💬 Depoimentos</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setTestimonials([...testimonials, { name: "", role: "", text: "", initials: "" }])}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {testimonials.length === 0 && (
            <p className="text-xs text-muted-foreground">Nenhum depoimento adicionado. Clique em + para adicionar.</p>
          )}
          {testimonials.map((t, i) => (
            <div key={i} className="p-4 rounded-lg border space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Nome</Label>
                  <Input value={t.name} onChange={e => {
                    const u = [...testimonials];
                    u[i].name = e.target.value;
                    // Auto-generate initials
                    const words = e.target.value.trim().split(/\s+/);
                    u[i].initials = words.map(w => w[0]?.toUpperCase() || "").slice(0, 2).join("");
                    setTestimonials(u);
                  }} />
                </div>
                <div className="w-20 space-y-1">
                  <Label className="text-xs">Iniciais</Label>
                  <Input value={t.initials} onChange={e => { const u = [...testimonials]; u[i].initials = e.target.value; setTestimonials(u); }} maxLength={3} />
                </div>
                <Button variant="ghost" size="icon" className="text-destructive self-end" onClick={() => setTestimonials(testimonials.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cargo / Descrição</Label>
                <Input value={t.role} onChange={e => { const u = [...testimonials]; u[i].role = e.target.value; setTestimonials(u); }} placeholder="Ex: Dono de restaurante" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Depoimento</Label>
                <Textarea value={t.text} onChange={e => { const u = [...testimonials]; u[i].text = e.target.value; setTestimonials(u); }} rows={2} placeholder="O que este parceiro disse..." />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">❓ FAQ</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setFaq([...faq, { question: "", answer: "" }])}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {faq.map((f, i) => (
            <div key={i} className="p-4 rounded-lg border space-y-2">
              <div className="flex gap-2 items-start">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Pergunta</Label>
                  <Input value={f.question} onChange={e => { const u = [...faq]; u[i].question = e.target.value; setFaq(u); }} />
                </div>
                <Button variant="ghost" size="icon" className="text-destructive mt-5" onClick={() => setFaq(faq.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Resposta</Label>
                <Textarea value={f.answer} onChange={e => { const u = [...faq]; u[i].answer = e.target.value; setFaq(u); }} rows={2} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Social & CTA */}
      <Card>
        <CardHeader><CardTitle className="text-base">🚀 Chamada Final (CTA) & Redes Sociais</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={ctaTitle} onChange={e => setCtaTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Subtítulo</Label>
            <Textarea value={ctaSubtitle} onChange={e => setCtaSubtitle(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Texto do Botão</Label>
            <Input value={ctaButtonText} onChange={e => setCtaButtonText(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Link de destino do CTA (URL)</Label>
            <Input value={ctaLinkUrl} onChange={e => setCtaLinkUrl(e.target.value)} placeholder="https://... ou /register-store" />
            <p className="text-xs text-muted-foreground">Se vazio, direciona para o cadastro de parceiro padrão.</p>
          </div>

          <div className="border-t pt-4 mt-4 space-y-3">
            <p className="text-sm font-medium">Redes Sociais</p>
            <div className="space-y-2">
              <Label className="text-xs">Instagram (URL ou @usuario)</Label>
              <Input value={socialInstagram} onChange={e => setSocialInstagram(e.target.value)} placeholder="https://instagram.com/seuperfil" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">WhatsApp (número com DDD)</Label>
              <Input value={socialWhatsapp} onChange={e => setSocialWhatsapp(e.target.value)} placeholder="5511999999999" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">E-mail de contato</Label>
              <Input value={socialEmail} onChange={e => setSocialEmail(e.target.value)} placeholder="contato@suamarca.com" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex gap-3 pb-10">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Configuração
        </Button>
      </div>
    </div>
  );
}
