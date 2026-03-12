import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Rocket, Building2, MapPin, User, CheckCircle2, Loader2,
  Copy, ExternalLink, Gift, Star, Shield, Zap, Clock,
  ArrowRight, Store, Users, QrCode, BarChart3, Megaphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ImageUploadField from "@/components/ImageUploadField";
import { motion } from "framer-motion";
import PlatformLogo from "@/components/PlatformLogo";

type Step = "guide" | "info" | "location" | "branding" | "creating" | "done";
const STEPS: Step[] = ["guide", "info", "location", "branding", "creating", "done"];

interface FormData {
  company_name: string;
  owner_name: string;
  owner_email: string;
  owner_password: string;
  city_name: string;
  state: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
}

interface TrialResult {
  brand_id: string;
  branch_id: string;
  domain: string;
  trial_expires_at: string;
}

const BENEFITS = [
  { icon: Zap, title: "Tudo configurado em 2 minutos", desc: "Sua plataforma pronta para usar imediatamente." },
  { icon: Gift, title: "30 dias grátis, sem compromisso", desc: "Teste todas as funcionalidades sem precisar de cartão." },
  { icon: Star, title: "Parceiros, ofertas e resgates", desc: "Gerencie seu programa de fidelidade completo." },
  { icon: Shield, title: "Seu app com a sua marca", desc: "Logo, cores e domínio personalizado." },
];

export default function TrialSignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("guide");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrialResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    company_name: "",
    owner_name: "",
    owner_email: "",
    owner_password: "",
    city_name: "",
    state: "",
    logo_url: "",
    primary_color: "#6366f1",
    secondary_color: "#f59e0b",
  });

  const update = (key: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const stepIndex = STEPS.indexOf(step);
  const progress = step === "done" ? 100 : ((stepIndex + 1) / (STEPS.length - 1)) * 100;

  const passwordStrength = (() => {
    const p = form.owner_password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^a-zA-Z0-9]/.test(p)) s++;
    return Math.min(s, 4);
  })();

  const strengthLabel = ["", "Fraca", "Razoável", "Boa", "Forte"];
  const strengthColor = ["", "bg-destructive", "bg-amber-500", "bg-primary", "bg-emerald-500"];

  const handleProvision = async () => {
    setStep("creating");
    setLoading(true);
    setError(null);

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/provision-trial`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": anonKey,
          },
          body: JSON.stringify(form),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao criar conta");

      // Auto-login the new user
      await supabase.auth.signInWithPassword({
        email: form.owner_email,
        password: form.owner_password,
      });

      setResult(json);
      setStep("done");
      toast.success("Conta criada com sucesso! 🎉");
    } catch (err: any) {
      setError(err.message);
      setStep("branding");
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (t: string) => {
    navigator.clipboard.writeText(t);
    toast.info("Copiado!");
  };

  const openExternal = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const origin = window.location.origin;

  return (
    <div className="min-h-screen bg-background">
      {/* STEP: Guide — Manual passo a passo */}
      {step === "guide" && (
        <>
          <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-12 px-4">
            <div className="max-w-4xl mx-auto text-center space-y-4">
              <img
                src="/logo-vale-resgate.jpeg"
                alt="Vale Resgate"
                className="mx-auto h-16 w-auto rounded-2xl shadow-lg"
              />
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Bem-vindo ao Vale Resgate!
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Antes de começar, entenda como funciona o fluxo da sua plataforma de fidelidade.
              </p>
            </div>
          </section>

          <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold mb-2">Como funciona — Passo a Passo</h2>
              <p className="text-sm text-muted-foreground">Entenda a jornada completa em 6 etapas simples</p>
            </div>

            {[
              {
                num: 1,
                icon: User,
                title: "Crie sua conta",
                desc: "Preencha seus dados, escolha o nome da sua empresa e defina a cidade onde vai operar. Em menos de 2 minutos sua plataforma estará no ar.",
                color: "bg-primary/10 text-primary",
              },
              {
                num: 2,
                icon: Building2,
                title: "Personalize sua marca",
                desc: "Adicione seu logotipo, escolha as cores da sua identidade visual. Seus clientes verão a SUA marca, não a nossa. É 100% white-label.",
                color: "bg-primary/10 text-primary",
              },
              {
                num: 3,
                icon: Store,
                title: "Convide parceiros",
                desc: "Compartilhe o link de cadastro com estabelecimentos da sua cidade (restaurantes, lojas, serviços). Eles se cadastram sozinhos e você aprova com um clique.",
                color: "bg-primary/10 text-primary",
              },
              {
                num: 4,
                icon: Megaphone,
                title: "Parceiros publicam ofertas",
                desc: "Cada parceiro cria suas próprias ofertas de resgate — descontos em produtos, serviços grátis, combos especiais. Tudo gerenciado por eles mesmos.",
                color: "bg-primary/10 text-primary",
              },
              {
                num: 5,
                icon: Users,
                title: "Clientes acumulam e resgatam",
                desc: "Seus clientes fazem compras nos parceiros, acumulam pontos automaticamente e resgatam ofertas exclusivas via QR Code. Tudo pelo app com a sua marca.",
                color: "bg-primary/10 text-primary",
              },
              {
                num: 6,
                icon: BarChart3,
                title: "Acompanhe tudo pelo painel",
                desc: "Monitore métricas em tempo real: resgates, clientes ativos, performance dos parceiros. Tome decisões com base em dados concretos.",
                color: "bg-primary/10 text-primary",
              },
            ].map((item, i) => (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="flex gap-4 items-start"
              >
                <div className="flex-shrink-0">
                  <div className={`h-12 w-12 rounded-xl ${item.color} flex items-center justify-center relative`}>
                    <item.icon className="h-6 w-6" />
                    <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow">
                      {item.num}
                    </span>
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-semibold text-base mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}

            <div className="rounded-xl border bg-primary/5 border-primary/20 p-5 text-center space-y-3">
              <QrCode className="h-8 w-8 text-primary mx-auto" />
              <p className="font-semibold">Resumo do fluxo</p>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                <strong>Você cria</strong> → <strong>Parceiros publicam</strong> → <strong>Clientes resgatam</strong> → <strong>Todos ganham!</strong>
              </p>
            </div>

            <Button
              size="lg"
              className="w-full rounded-xl py-6 text-base"
              onClick={() => setStep("info")}
            >
              Entendi! Vamos começar <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Já tem conta?{" "}
              <button onClick={() => navigate("/auth")} className="text-primary hover:underline">
                Fazer login
              </button>
            </p>
          </div>
        </>
      )}

      {/* Hero Section */}
      {step === "info" && (
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <img
              src="/logo-vale-resgate.jpeg"
              alt="Vale Resgate"
              className="mx-auto h-20 w-auto rounded-2xl shadow-lg"
            />
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Crie sua plataforma de fidelidade
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Monte seu programa de pontos e resgates para os parceiros da sua cidade.
              <span className="text-primary font-semibold"> 30 dias grátis</span>, sem precisar de cartão.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Pronto em menos de 2 minutos</span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
              {BENEFITS.map((b) => (
                <div
                  key={b.title}
                  className="rounded-xl border bg-card p-4 text-left space-y-2 shadow-sm"
                >
                  <b.icon className="h-6 w-6 text-primary" />
                  <p className="font-semibold text-sm">{b.title}</p>
                  <p className="text-xs text-muted-foreground">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Form */}
      <div className="max-w-lg mx-auto px-4 py-10 space-y-6">
        {step !== "guide" && step !== "info" && step !== "done" && step !== "creating" && (
          <Progress value={progress} className="h-2" />
        )}

        {/* STEP: Info */}
        {step === "info" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Seus dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome completo *</Label>
                <Input
                  value={form.owner_name}
                  onChange={(e) => update("owner_name", e.target.value)}
                  placeholder="João da Silva"
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail *</Label>
                <Input
                  type="email"
                  value={form.owner_email}
                  onChange={(e) => update("owner_email", e.target.value)}
                  placeholder="joao@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Senha *</Label>
                <Input
                  type="password"
                  value={form.owner_password}
                  onChange={(e) => update("owner_password", e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
                {form.owner_password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full ${
                            i <= passwordStrength ? strengthColor[passwordStrength] : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Força: {strengthLabel[passwordStrength]}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Nome da sua empresa *</Label>
                <Input
                  value={form.company_name}
                  onChange={(e) => update("company_name", e.target.value)}
                  placeholder="Meu Clube de Ofertas"
                />
              </div>
              <Button
                className="w-full"
                disabled={!form.owner_name || !form.owner_email || !form.owner_password || !form.company_name || form.owner_password.length < 6}
                onClick={() => setStep("location")}
              >
                Próximo
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Já tem conta?{" "}
                <button onClick={() => navigate("/auth")} className="text-primary hover:underline">
                  Fazer login
                </button>
              </p>
            </CardContent>
          </Card>
        )}

        {/* STEP: Location */}
        {step === "location" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Cidade inicial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Escolha a primeira cidade onde sua plataforma vai operar. Você poderá adicionar mais cidades depois.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 space-y-2">
                  <Label>UF *</Label>
                  <Input
                    value={form.state}
                    onChange={(e) => update("state", e.target.value.toUpperCase().slice(0, 2))}
                    placeholder="PR"
                    maxLength={2}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Cidade *</Label>
                  <Input
                    value={form.city_name}
                    onChange={(e) => update("city_name", e.target.value)}
                    placeholder="Curitiba"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("info")} className="flex-1">
                  Voltar
                </Button>
                <Button
                  className="flex-1"
                  disabled={!form.city_name || form.state.length !== 2}
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
                <Building2 className="h-5 w-5 text-primary" />
                Sua marca (opcional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Personalize com sua logo e cores. Você pode fazer isso depois também.
              </p>
              <div className="space-y-2">
                <Label>Logo</Label>
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
                  <Label>Cor primária</Label>
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
                  <Label>Cor secundária</Label>
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

              {/* Preview */}
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Preview</p>
                <div className="flex items-center gap-3">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="Logo" className="h-10 w-10 rounded-lg object-cover" />
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
                    <p className="text-xs text-muted-foreground">Sua plataforma de fidelidade</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("location")} className="flex-1">
                  Voltar
                </Button>
                <Button className="flex-1" onClick={handleProvision} disabled={loading}>
                  <Rocket className="h-4 w-4 mr-1" />
                  Criar minha conta grátis
                </Button>
              </div>
              <p className="text-center text-[10px] text-muted-foreground">
                Ao criar sua conta, você concorda com os termos de uso. Teste grátis por 30 dias, sem compromisso.
              </p>
            </CardContent>
          </Card>
        )}

        {/* STEP: Creating */}
        {step === "creating" && (
          <Card>
            <CardContent className="py-16 text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <h3 className="text-lg font-semibold">Criando sua plataforma...</h3>
              <p className="text-sm text-muted-foreground">
                Estamos configurando tudo para você. Isso leva poucos segundos.
              </p>
            </CardContent>
          </Card>
        )}

        {/* STEP: Done */}
        {step === "done" && result && (
          <Card className="border-green-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                Plataforma criada com sucesso! 🎉
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-4 space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Seu trial gratuito expira em {new Date(result.trial_expires_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Você tem 30 dias para testar todas as funcionalidades. Depois, assine para continuar.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Links importantes:</p>

                {/* Admin Panel */}
                <div className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Painel Administrativo</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Gerencie parceiros, ofertas e configurações</p>
                  <div className="flex gap-1">
                    <Button
                      variant="default"
                      size="sm"
                      className="h-7 text-xs flex-1 gap-1"
                      onClick={() => navigate("/")}
                    >
                      <ExternalLink className="h-3 w-3" /> Acessar agora
                    </Button>
                  </div>
                </div>

                {/* Customer App */}
                <div className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">App do Cliente</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Link que seus clientes vão acessar</p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-1 gap-1"
                      onClick={() => openExternal(`${origin}/customer-preview?brandId=${result.brand_id}`)}
                    >
                      <ExternalLink className="h-3 w-3" /> Abrir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => copyText(`${origin}/customer-preview?brandId=${result.brand_id}`)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Store Registration */}
                <div className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Cadastro de Parceiros</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Compartilhe com estabelecimentos que quiserem participar</p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-1 gap-1"
                      onClick={() => openExternal(`${origin}/register-store`)}
                    >
                      <ExternalLink className="h-3 w-3" /> Abrir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => copyText(`${origin}/register-store`)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <Badge variant="outline" className="text-xs w-full justify-center py-1.5 border-primary/20 text-primary">
                Domínio futuro: {result.domain}
              </Badge>

              <Button className="w-full" onClick={() => navigate("/")}>
                Ir para o Painel Administrativo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
