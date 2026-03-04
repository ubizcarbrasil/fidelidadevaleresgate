import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Building2, MapPin, Palette, Rocket, CheckCircle2, Loader2, Copy, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ImageUploadField from "@/components/ImageUploadField";

type Step = "company" | "city" | "branding" | "review" | "done";
const STEPS: Step[] = ["company", "city", "branding", "review", "done"];

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
  });

  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const update = (key: keyof FormData, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const autoSlug = (name: string) =>
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

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
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
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

  const rolePanelLink: Record<string, string> = {
    brand_admin: "Abrir Painel Admin",
    customer: "Abrir App Cliente",
    store_admin: "Abrir Portal Parceiro",
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Nova Empresa</h2>
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
              <Input
                value={form.brand_slug}
                onChange={(e) => update("brand_slug", e.target.value)}
                placeholder="vale-resgate-exemplo"
              />
              <p className="text-xs text-muted-foreground">
                Será usado na URL: {form.brand_slug || "slug"}.valeresgate.com
              </p>
            </div>
            <Button
              className="w-full"
              disabled={!form.company_name || !form.brand_slug}
              onClick={() => setStep("city")}
            >
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
                onChange={(e) => {
                  update("city_name", e.target.value);
                  update("city_slug", autoSlug(e.target.value));
                }}
                placeholder="São Paulo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={form.city_slug}
                  onChange={(e) => update("city_slug", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                  placeholder="SP"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("company")} className="flex-1">
                Voltar
              </Button>
              <Button
                className="flex-1"
                disabled={!form.city_name || !form.city_slug}
                onClick={() => setStep("branding")}
              >
                Próximo
              </Button>
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
              <ImageUploadField
                value={form.logo_url}
                onChange={(url) => update("logo_url", url)}
                folder="brand-logos"
                label="Logo"
                previewClassName="h-10 object-contain"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cor Primária</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={(e) => update("primary_color", e.target.value)}
                    className="h-10 w-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={form.primary_color}
                    onChange={(e) => update("primary_color", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cor Secundária</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.secondary_color}
                    onChange={(e) => update("secondary_color", e.target.value)}
                    className="h-10 w-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={form.secondary_color}
                    onChange={(e) => update("secondary_color", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pontos iniciais do cliente teste</Label>
              <Input
                type="number"
                value={form.test_points}
                onChange={(e) => update("test_points", parseInt(e.target.value) || 0)}
              />
            </div>

            {/* Mini preview */}
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Preview</p>
              <div className="flex items-center gap-3">
                {form.logo_url ? (
                  <img
                    src={form.logo_url}
                    alt="Logo"
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: form.primary_color }}
                  >
                    {form.company_name.charAt(0) || "?"}
                  </div>
                )}
                <div>
                  <p className="font-semibold" style={{ color: form.primary_color }}>
                    {form.company_name || "Nome da Empresa"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {form.subdomain || form.brand_slug}.valeresgate.com
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("city")} className="flex-1">
                Voltar
              </Button>
              <Button className="flex-1" onClick={() => setStep("review")}>
                Revisar
              </Button>
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
                <span className="font-medium">
                  {form.city_name} {form.state && `- ${form.state}`}
                </span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Domínio</span>
                <span className="font-mono text-xs">
                  {form.subdomain || form.brand_slug}.valeresgate.com
                </span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Pontos iniciais</span>
                <span className="font-medium">{form.test_points}</span>
              </div>
            </div>

            <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
              <p className="text-xs font-medium">Contas teste que serão criadas:</p>
              <div className="text-xs space-y-1">
                <p>
                  🔑 Admin: <code>teste-{form.brand_slug.replace(/[^a-z0-9]/g, "")}@teste.com</code> / 123456
                </p>
                <p>
                  👤 Cliente: <code>cliente-{form.brand_slug.replace(/[^a-z0-9]/g, "")}@teste.com</code> / 123456
                </p>
                <p>
                  🏪 Parceiro: <code>loja-{form.brand_slug.replace(/[^a-z0-9]/g, "")}@teste.com</code> / 123456
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("branding")} className="flex-1">
                Voltar
              </Button>
              <Button className="flex-1" onClick={handleProvision} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Provisionando...
                  </>
                ) : (
                  "Criar Empresa"
                )}
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(`https://${result.domain}`)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Contas de Teste</p>
              {result.test_accounts.map((acc) => (
                <div
                  key={acc.email}
                  className="rounded-lg border p-3 flex items-center justify-between"
                >
                  <div>
                    <Badge variant="outline" className="mb-1">
                      {roleLabel[acc.role] || acc.role}
                    </Badge>
                    <p className="text-xs font-mono">{acc.email}</p>
                    <p className="text-xs text-muted-foreground">Senha: 123456</p>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs mt-1"
                      onClick={() => window.open(`https://${result.domain}/auth`, "_blank")}
                    >
                      <ExternalLink className="h-3 w-3" />
                      {rolePanelLink[acc.role] || "Abrir Painel"}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(acc.email)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/")}>
                Voltar ao Painel
              </Button>
              <Button className="flex-1" onClick={() => {
                setStep("company");
                setResult(null);
                setForm({
                  company_name: "",
                  brand_slug: "",
                  city_name: "",
                  city_slug: "",
                  state: "",
                  subdomain: "",
                  logo_url: "",
                  primary_color: "#6366f1",
                  secondary_color: "#f59e0b",
                  test_points: 1000,
                });
              }}>
                Criar Outra
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
