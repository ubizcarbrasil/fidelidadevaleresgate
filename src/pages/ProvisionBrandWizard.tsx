import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, MapPin, Palette, Rocket, CheckCircle2, Loader2, Copy, ExternalLink, LayoutGrid } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ImageUploadField from "@/components/ImageUploadField";

type Step = "company" | "city" | "branding" | "sections" | "review" | "done";
const STEPS: Step[] = ["company", "city", "branding", "sections", "review", "done"];

const DEFAULT_SECTIONS = [
  { index: 0, title: "Melhores Ofertas", description: "Carrossel dos melhores cupons (logo da loja), 2 linhas" },
  { index: 1, title: "Deu fome? Pague com pontos", description: "Estabelecimentos de comida (logo da loja), 2 linhas" },
  { index: 2, title: "Food Pontos", description: "Produtos de comida (imagem do produto), 2 linhas" },
  { index: 3, title: "Beleza e Saúde", description: "Parceiros de beleza e saúde (logo), 1 linha" },
  { index: 4, title: "Serviços na Cidade", description: "Serviços profissionais (imagem produto), 1 linha" },
  { index: 5, title: "Achadinhos", description: "Categorias e produtos de achadinhos, 3 linhas" },
  { index: 6, title: "Lojas da Cidade", description: "Variedade de lojas (logo), 3 linhas" },
  { index: 7, title: "Resgate na Cidade", description: "Todos os estabelecimentos (logo), 3 linhas" },
];

interface FormData {
  company_name: string;
  brand_slug: string;
  city_name: string;
  city_slug: string;
  state: string;
  subdomain: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  test_points: number;
  admin_email: string;
  admin_password: string;
  enable_demo_stores: boolean;
  enable_test_credits: boolean;
  selected_sections: number[];
  subscription_plan: "free" | "starter" | "profissional" | "enterprise";
}

interface ProvisionResult {
  brand_id: string;
  tenant_id: string;
  branch_id: string;
  domain: string;
  test_accounts: { email: string; role: string; is_active: boolean }[];
}

export default function ProvisionBrandWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>("company");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProvisionResult | null>(null);

  const tenantName = searchParams.get("tenant_name") || "";
  const tenantSlug = searchParams.get("tenant_slug") || "";

  const [form, setForm] = useState<FormData>({
    company_name: tenantName,
    brand_slug: tenantSlug,
    city_name: "",
    city_slug: "",
    state: "",
    subdomain: tenantSlug,
    logo_url: "",
    primary_color: "#6366f1",
    secondary_color: "#f59e0b",
    test_points: 1000,
    admin_email: "",
    admin_password: "",
    enable_demo_stores: true,
    enable_test_credits: true,
    selected_sections: [0, 1, 2, 3, 4, 5, 6, 7],
    subscription_plan: "starter",
  });

  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const update = (key: keyof FormData, value: string | number | boolean | number[]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const autoSlug = (name: string) =>
    name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const toggleSection = (index: number) => {
    setForm((prev) => {
      const selected = prev.selected_sections.includes(index)
        ? prev.selected_sections.filter((i) => i !== index)
        : [...prev.selected_sections, index];
      return { ...prev, selected_sections: selected };
    });
  };

  const handleProvision = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Não autenticado");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/provision-brand`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            company_name: form.company_name,
            brand_slug: form.brand_slug,
            city_name: form.city_name,
            city_slug: form.city_slug,
            state: form.state,
            subdomain: form.subdomain,
            logo_url: form.logo_url,
            primary_color: form.primary_color,
            secondary_color: form.secondary_color,
            test_points: form.test_points,
            admin_email: form.admin_email || undefined,
            admin_password: form.admin_password || undefined,
            enable_demo_stores: form.enable_demo_stores,
            enable_test_credits: form.enable_test_credits,
            selected_sections: form.selected_sections,
            subscription_plan: form.subscription_plan,
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao provisionar");

      setResult(json);
      setStep("done");
      toast.success("Empresa criada com sucesso!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.info("Copiado!");
  };

  const roleLabel: Record<string, string> = {
    brand_admin: "Administrador",
    customer: "Cliente Teste",
    store_admin: "Parceiro Teste",
  };

  const emailPrefix = form.brand_slug.replace(/[^a-z0-9]/g, "");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Nova Empresa</h2>
        <p className="text-muted-foreground">Provisione uma nova empresa com tudo configurado.</p>
      </div>

      <Progress value={progress} className="h-2" />

      {/* STEP: Company info */}
      {step === "company" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Dados da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Empresa *</Label>
              <Input
                value={form.company_name}
                onChange={(e) => {
                  update("company_name", e.target.value);
                  update("brand_slug", autoSlug(e.target.value));
                  update("subdomain", autoSlug(e.target.value));
                }}
                placeholder="Vale Resgate Exemplo"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug da Marca</Label>
              <Input value={form.brand_slug} onChange={(e) => update("brand_slug", e.target.value)} placeholder="vale-resgate-exemplo" />
              <p className="text-xs text-muted-foreground">URL: {form.brand_slug || "slug"}.valeresgate.com</p>
            </div>

            <div className="border-t pt-4 space-y-4">
              <p className="text-sm font-medium text-foreground">Acesso do Empreendedor</p>
              <div className="space-y-2">
                <Label>E-mail do Administrador</Label>
                <Input
                  type="email"
                  value={form.admin_email}
                  onChange={(e) => update("admin_email", e.target.value)}
                  placeholder={`teste-${emailPrefix || "slug"}@teste.com (padrão)`}
                />
                <p className="text-xs text-muted-foreground">Deixe vazio para gerar automaticamente</p>
              </div>
              <div className="space-y-2">
                <Label>Senha do Administrador</Label>
                <Input
                  type="password"
                  value={form.admin_password}
                  onChange={(e) => update("admin_password", e.target.value)}
                  placeholder="123456 (padrão)"
                />
              </div>
            </div>

            <Button className="w-full" disabled={!form.company_name || !form.brand_slug} onClick={() => setStep("city")}>
              Próximo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP: City */}
      {step === "city" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Cidade Inicial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Cidade *</Label>
              <Input
                value={form.city_name}
                onChange={(e) => { update("city_name", e.target.value); update("city_slug", autoSlug(e.target.value)); }}
                placeholder="São Paulo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={form.city_slug} onChange={(e) => update("city_slug", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input value={form.state} onChange={(e) => update("state", e.target.value)} placeholder="SP" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("company")} className="flex-1">Voltar</Button>
              <Button className="flex-1" disabled={!form.city_name || !form.city_slug} onClick={() => setStep("branding")}>Próximo</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP: Branding */}
      {step === "branding" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Identidade Visual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Logo (opcional)</Label>
              <ImageUploadField value={form.logo_url} onChange={(url) => update("logo_url", url)} folder="brand-logos" label="Logo" previewClassName="h-10 object-contain" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cor Primária</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.primary_color} onChange={(e) => update("primary_color", e.target.value)} className="h-10 w-10 rounded border cursor-pointer" />
                  <Input value={form.primary_color} onChange={(e) => update("primary_color", e.target.value)} className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cor Secundária</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.secondary_color} onChange={(e) => update("secondary_color", e.target.value)} className="h-10 w-10 rounded border cursor-pointer" />
                  <Input value={form.secondary_color} onChange={(e) => update("secondary_color", e.target.value)} className="flex-1" />
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Lojas de Demonstração</p>
                  <p className="text-xs text-muted-foreground">Criar ~40 lojas com ofertas de exemplo</p>
                </div>
                <Switch checked={form.enable_demo_stores} onCheckedChange={(v) => update("enable_demo_stores", v)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Crédito no Cliente Teste</p>
                  <p className="text-xs text-muted-foreground">Dar {form.test_points} pontos ao cliente teste</p>
                </div>
                <Switch checked={form.enable_test_credits} onCheckedChange={(v) => update("enable_test_credits", v)} />
              </div>
              {form.enable_test_credits && (
                <div className="space-y-2 pl-4">
                  <Label>Pontos iniciais</Label>
                  <Input type="number" value={form.test_points} onChange={(e) => update("test_points", parseInt(e.target.value) || 0)} />
                </div>
              )}
            </div>

            {/* Mini preview */}
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Preview</p>
              <div className="flex items-center gap-3">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo" className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: form.primary_color }}>
                    {form.company_name.charAt(0) || "?"}
                  </div>
                )}
                <div>
                  <p className="font-semibold" style={{ color: form.primary_color }}>{form.company_name || "Nome da Empresa"}</p>
                  <p className="text-xs text-muted-foreground">{form.subdomain || form.brand_slug}.valeresgate.com</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("city")} className="flex-1">Voltar</Button>
              <Button className="flex-1" onClick={() => setStep("sections")}>Próximo</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP: Sections */}
      {step === "sections" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-primary" />
              Seções da Home
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione as seções que serão ativadas na tela inicial. No plano básico, o empreendedor poderá reordenar e ativar/desativar, mas não criar novas.
            </p>
            <div className="space-y-2">
              {DEFAULT_SECTIONS.map((section) => (
                <label
                  key={section.index}
                  className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <Checkbox
                    checked={form.selected_sections.includes(section.index)}
                    onCheckedChange={() => toggleSection(section.index)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{section.index + 1}. {section.title}</p>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{form.selected_sections.length}/8 seções</Badge>
              <span>selecionadas</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("branding")} className="flex-1">Voltar</Button>
              <Button className="flex-1" onClick={() => setStep("review")}>Revisar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP: Review */}
      {step === "review" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              Revisão Final
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border divide-y text-sm">
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Empresa</span>
                <span className="font-medium">{form.company_name}</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Slug</span>
                <span className="font-mono text-xs">{form.brand_slug}</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Cidade</span>
                <span className="font-medium">{form.city_name} {form.state && `- ${form.state}`}</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Domínio</span>
                <span className="font-mono text-xs">{form.subdomain || form.brand_slug}.valeresgate.com</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Seções ativas</span>
                <span className="font-medium">{form.selected_sections.length}/8</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Lojas demo</span>
                <Badge variant={form.enable_demo_stores ? "default" : "secondary"}>{form.enable_demo_stores ? "Sim" : "Não"}</Badge>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Crédito teste</span>
                <Badge variant={form.enable_test_credits ? "default" : "secondary"}>
                  {form.enable_test_credits ? `${form.test_points} pts` : "Não"}
                </Badge>
              </div>
            </div>

            <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
              <p className="text-xs font-medium">Contas teste que serão criadas:</p>
              <div className="text-xs space-y-1">
                <p>🔑 Admin: <code>{form.admin_email || `teste-${emailPrefix}@teste.com`}</code> / {form.admin_password || "123456"}</p>
                <p>👤 Cliente: <code>cliente-{emailPrefix}@teste.com</code> / 123456</p>
                <p>🏪 Parceiro: <code>loja-{emailPrefix}@teste.com</code> / 123456</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("sections")} className="flex-1">Voltar</Button>
              <Button className="flex-1" onClick={handleProvision} disabled={loading}>
                {loading ? (<><Loader2 className="h-4 w-4 animate-spin" />Provisionando...</>) : "Criar Empresa"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP: Done */}
      {step === "done" && result && (
        <Card className="border-green-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Empresa Criada com Sucesso!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border divide-y text-sm">
              <div className="flex items-center justify-between p-3">
                <span className="text-muted-foreground">Domínio</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs">{result.domain}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(`https://${result.domain}`)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Contas de Teste</p>
              {result.test_accounts.map((acc) => (
                <div key={acc.email} className="rounded-lg border p-3 flex items-center justify-between">
                  <div>
                    <Badge variant="outline" className="mb-1">{roleLabel[acc.role] || acc.role}</Badge>
                    <p className="text-xs font-mono">{acc.email}</p>
                    <p className="text-xs text-muted-foreground">Senha: {form.admin_password && acc.role === "brand_admin" ? form.admin_password : "123456"}</p>
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs mt-1" onClick={() => window.open(`https://${result.domain}/auth`, "_blank")}>
                      <ExternalLink className="h-3 w-3" />Abrir Painel
                    </Button>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(acc.email)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/")}>Voltar ao Painel</Button>
              <Button className="flex-1" onClick={() => {
                setStep("company");
                setResult(null);
                setForm({
                  company_name: "", brand_slug: "", city_name: "", city_slug: "", state: "", subdomain: "",
                  logo_url: "", primary_color: "#6366f1", secondary_color: "#f59e0b", test_points: 1000,
                  admin_email: "", admin_password: "", enable_demo_stores: true, enable_test_credits: true,
                  selected_sections: [0, 1, 2, 3, 4, 5, 6, 7],
                });
              }}>Criar Outra</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
