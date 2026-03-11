import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, useInView } from "framer-motion";
import {
  Eye, Heart, Zap, BarChart3, Star, ChevronDown,
  ArrowRight, Users, Store, Gift, Shield, TrendingUp, Sparkles,
  CheckCircle2, Loader2, Menu, X, Rocket, Target, Award,
  Smartphone, PieChart, MessageSquare, Clock, DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

const ICON_MAP: Record<string, any> = {
  Eye, Heart, Zap, BarChart3, Star, Users, Store, Gift, Shield,
  TrendingUp, Sparkles, CheckCircle2, Rocket, Target, Award,
  Smartphone, PieChart, MessageSquare, Clock, DollarSign,
};

interface LandingConfig {
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string | null;
  numbers_json: { value: string; label: string }[];
  benefits_json: { title: string; description: string; icon: string }[];
  how_it_works_json: { step: string; title: string; description: string }[];
  faq_json: { question: string; answer: string }[];
  cta_title: string;
  cta_subtitle: string;
  cta_button_text: string;
}

interface BrandTheme {
  primary: string;
  foreground: string;
  background: string;
  accent: string;
}

function hsl(val: string | undefined, fallback: string) {
  return val ? `hsl(${val})` : fallback;
}

function withAlpha(hslVal: string | undefined, alpha: number, fallback: string) {
  if (!hslVal) return fallback;
  const parts = hslVal.replace(/,/g, " ").split(/\s+/);
  if (parts.length >= 3) {
    return `hsla(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
  }
  return fallback;
}

function darken(hslVal: string | undefined, amount: number): string {
  if (!hslVal) return "hsl(220, 20%, 10%)";
  const parts = hslVal.replace(/,/g, " ").split(/\s+/).map(p => parseFloat(p));
  if (parts.length >= 3) {
    return `hsl(${parts[0]}, ${parts[1]}%, ${Math.max(0, parts[2] - amount)}%)`;
  }
  return "hsl(220, 20%, 10%)";
}

/* ── Animated counter ── */
function AnimatedCounter({ value }: { value: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const numericPart = value.replace(/[^0-9.]/g, "");
  const suffix = value.replace(/[0-9.]/g, "");
  const target = parseFloat(numericPart) || 0;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!isInView || target === 0) return;
    const duration = 1500;
    const steps = 40;
    const increment = target / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setCurrent(Math.min(step * increment, target));
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {target > 0 ? `${Math.round(current).toLocaleString("pt-BR")}${suffix}` : value}
    </span>
  );
}

/* ── FAQ Item ── */
function FaqItem({
  question, answer, isOpen, onToggle, primary, fg, primaryAlpha,
}: {
  question: string; answer: string; isOpen: boolean;
  onToggle: () => void; primary: string; fg: string;
  primaryAlpha: (a: number) => string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl border overflow-hidden backdrop-blur-sm transition-all"
      style={{
        borderColor: isOpen ? primaryAlpha(0.3) : primaryAlpha(0.1),
        backgroundColor: isOpen ? primaryAlpha(0.06) : primaryAlpha(0.02),
      }}
    >
      <button
        className="w-full flex items-center justify-between p-5 md:p-6 text-left gap-4"
        onClick={onToggle}
      >
        <span className="font-semibold text-sm md:text-base" style={{ color: fg }}>{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="h-5 w-5" style={{ color: primary }} />
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="px-5 md:px-6 pb-5 md:pb-6">
          <p className="text-sm leading-relaxed" style={{ color: fg, opacity: 0.65 }}>{answer}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function PartnerLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [config, setConfig] = useState<LandingConfig | null>(null);
  const [brand, setBrand] = useState<any>(null);
  const [theme, setTheme] = useState<BrandTheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      const { data: brandData } = await supabase
        .from("brands")
        .select("id, name, slug, brand_settings_json")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (!brandData) { setLoading(false); return; }
      setBrand(brandData);

      const settings = brandData.brand_settings_json as any;
      if (settings?.theme?.colors) {
        setTheme(settings.theme.colors);
      }

      const { data: configData } = await supabase
        .from("partner_landing_config")
        .select("*")
        .eq("brand_id", brandData.id)
        .eq("is_active", true)
        .single();

      if (configData) {
        setConfig({
          hero_title: configData.hero_title,
          hero_subtitle: configData.hero_subtitle,
          hero_image_url: configData.hero_image_url,
          numbers_json: configData.numbers_json as any,
          benefits_json: configData.benefits_json as any,
          how_it_works_json: configData.how_it_works_json as any,
          faq_json: configData.faq_json as any,
          cta_title: configData.cta_title,
          cta_subtitle: configData.cta_subtitle,
          cta_button_text: configData.cta_button_text,
        });
      } else {
        setConfig({
          hero_title: "Seja um Parceiro",
          hero_subtitle: "Faça parte da maior rede de benefícios da sua região e atraia mais clientes para o seu negócio.",
          hero_image_url: null,
          numbers_json: [
            { value: "10.000+", label: "Usuários ativos" },
            { value: "500+", label: "Parceiros" },
            { value: "50.000+", label: "Resgates realizados" },
          ],
          benefits_json: [
            { title: "Visibilidade", description: "Apareça para milhares de clientes que buscam ofertas na sua região.", icon: "Eye" },
            { title: "Fidelização", description: "Fidelize clientes com programa de pontos e cashback automático.", icon: "Heart" },
            { title: "Sem custo inicial", description: "Comece gratuitamente e pague apenas pelo que usar.", icon: "Zap" },
            { title: "Gestão completa", description: "Painel administrativo para gerenciar ofertas, resgates e métricas.", icon: "BarChart3" },
          ],
          how_it_works_json: [
            { step: "1", title: "Cadastre-se", description: "Preencha o formulário com os dados do seu estabelecimento." },
            { step: "2", title: "Configure", description: "Crie suas ofertas e configure as regras de resgate." },
            { step: "3", title: "Atraia clientes", description: "Seus cupons ficam visíveis para todos os usuários do app." },
          ],
          faq_json: [
            { question: "Quanto custa para participar?", answer: "O cadastro é gratuito. Você só paga uma pequena taxa por resgate efetivado." },
            { question: "Preciso ter um site ou app?", answer: "Não! Seu estabelecimento aparece automaticamente no aplicativo para todos os usuários." },
            { question: "Como recebo os pagamentos?", answer: "Os pagamentos dos clientes são feitos diretamente no seu estabelecimento." },
            { question: "Posso cancelar a qualquer momento?", answer: "Sim, não há fidelidade. Você pode pausar ou encerrar sua participação quando quiser." },
          ],
          cta_title: "Pronto para crescer?",
          cta_subtitle: "Cadastre-se agora e comece a receber clientes pelo aplicativo.",
          cta_button_text: "Quero ser Parceiro",
        });
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "hsl(220, 20%, 6%)" }}>
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (!brand || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "hsl(220, 20%, 6%)" }}>
        <p className="text-white/50">Página não encontrada.</p>
      </div>
    );
  }

  const primary = hsl(theme?.primary, "hsl(160, 70%, 45%)");
  const primaryAlpha = (a: number) => withAlpha(theme?.primary, a, `hsla(160, 70%, 45%, ${a})`);
  const bgDark = darken(theme?.primary, 35);
  const bgDarker = darken(theme?.primary, 38);
  const logoUrl = (brand.brand_settings_json as any)?.theme?.logo_url;
  const registerUrl = "/register-store";

  const fadeUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: bgDark, color: "#fff" }}>
      {/* ═══ Navbar ═══ */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-xl border-b"
        style={{ backgroundColor: `${bgDark}ee`, borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {logoUrl && <img src={logoUrl} alt="" className="h-9 w-9 rounded-xl object-cover" />}
            <span className="font-bold text-lg text-white">{brand.name}</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <a href="#beneficios" className="hover:text-white transition-colors">Benefícios</a>
            <a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <a href={registerUrl} className="hidden sm:block">
              <Button
                size="sm"
                className="rounded-full px-6 font-semibold border-0"
                style={{ backgroundColor: primary, color: "#fff" }}
              >
                Cadastre-se <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </a>
            <button className="md:hidden text-white/60" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t px-5 py-4 space-y-3" style={{ backgroundColor: bgDarker, borderColor: "rgba(255,255,255,0.06)" }}>
            <a href="#beneficios" className="block text-sm text-white/60 hover:text-white" onClick={() => setMenuOpen(false)}>Benefícios</a>
            <a href="#como-funciona" className="block text-sm text-white/60 hover:text-white" onClick={() => setMenuOpen(false)}>Como Funciona</a>
            <a href="#faq" className="block text-sm text-white/60 hover:text-white" onClick={() => setMenuOpen(false)}>FAQ</a>
            <a href={registerUrl} className="block text-sm font-semibold" style={{ color: primary }}>Cadastre-se →</a>
          </div>
        )}
      </nav>

      {/* ═══ Hero ═══ */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-[120px] opacity-20"
          style={{ background: primary }}
        />
        <div className="absolute inset-0" style={{
          background: `radial-gradient(ellipse at 30% 20%, ${primaryAlpha(0.1)} 0%, transparent 60%)`,
        }} />

        <div className="max-w-6xl mx-auto px-5 pt-20 pb-16 md:pt-28 md:pb-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8 border"
              style={{ backgroundColor: primaryAlpha(0.1), borderColor: primaryAlpha(0.2), color: primary }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Programa de Parceiros {brand.name}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] mb-6 tracking-tight"
            >
              {config.hero_title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-base md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              {config.hero_subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <a href={registerUrl}>
                <Button
                  size="lg"
                  className="text-base px-10 py-7 rounded-2xl font-bold shadow-2xl hover:scale-105 transition-all w-full sm:w-auto"
                  style={{ backgroundColor: primary, color: "#fff", boxShadow: `0 20px 60px -15px ${primaryAlpha(0.5)}` }}
                >
                  {config.cta_button_text}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
              <a href="#como-funciona">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8 py-7 rounded-2xl font-semibold w-full sm:w-auto border-white/10 text-white/80 hover:bg-white/5 hover:text-white"
                >
                  Saiba mais
                </Button>
              </a>
            </motion.div>

            {config.hero_image_url && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="mt-16"
              >
                <img
                  src={config.hero_image_url}
                  alt=""
                  className="w-full max-w-2xl mx-auto rounded-3xl shadow-2xl border border-white/10"
                />
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* ═══ Numbers (Stats bar) ═══ */}
      <section className="relative py-12 border-y" style={{ borderColor: "rgba(255,255,255,0.06)", backgroundColor: primaryAlpha(0.03) }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className={`grid gap-6 ${config.numbers_json.length <= 3 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4"}`}>
            {config.numbers_json.map((n, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl md:text-5xl font-black tracking-tight" style={{ color: primary }}>
                  <AnimatedCounter value={n.value} />
                </p>
                <p className="text-xs md:text-sm mt-2 text-white/50 font-medium">{n.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Benefits ═══ */}
      <section id="beneficios" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-5">
          <motion.div {...fadeUp} className="text-center mb-16">
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
              style={{ color: primary, backgroundColor: primaryAlpha(0.1) }}
            >
              Vantagens exclusivas
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Por que ser um <span style={{ color: primary }}>parceiro</span>?
            </h2>
            <p className="text-white/50 mt-4 max-w-2xl mx-auto">
              Tudo o que você precisa para atrair, fidelizar e crescer com sua base de clientes.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {config.benefits_json.map((b, i) => {
              const Icon = ICON_MAP[b.icon] || Star;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="group rounded-2xl p-6 md:p-7 border transition-all duration-300 hover:border-opacity-30"
                  style={{
                    borderColor: primaryAlpha(0.1),
                    backgroundColor: primaryAlpha(0.03),
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = primaryAlpha(0.08);
                    e.currentTarget.style.borderColor = primaryAlpha(0.25);
                    e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = primaryAlpha(0.03);
                    e.currentTarget.style.borderColor = primaryAlpha(0.1);
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: primaryAlpha(0.12) }}
                  >
                    <Icon className="h-6 w-6" style={{ color: primary }} />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-white">{b.title}</h3>
                  <p className="text-sm leading-relaxed text-white/55">{b.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ How it works ═══ */}
      <section id="como-funciona" className="py-20 md:py-28 relative" style={{ backgroundColor: primaryAlpha(0.04) }}>
        <div className="max-w-6xl mx-auto px-5">
          <motion.div {...fadeUp} className="text-center mb-16">
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
              style={{ color: primary, backgroundColor: primaryAlpha(0.1) }}
            >
              Passo a passo
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Como <span style={{ color: primary }}>funciona</span>?
            </h2>
          </motion.div>

          <div className="relative">
            {/* Connection line (desktop) */}
            <div
              className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px]"
              style={{ background: `linear-gradient(90deg, transparent, ${primaryAlpha(0.3)}, transparent)` }}
            />

            <div className={`grid gap-8 ${config.how_it_works_json.length <= 3 ? "md:grid-cols-3" : "md:grid-cols-4"}`}>
              {config.how_it_works_json.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="text-center relative"
                >
                  <div
                    className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl font-black relative z-10 shadow-xl"
                    style={{
                      background: `linear-gradient(135deg, ${primary}, ${primaryAlpha(0.7)})`,
                      color: "#fff",
                      boxShadow: `0 10px 40px -10px ${primaryAlpha(0.4)}`,
                    }}
                  >
                    {s.step}
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-white">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-white/55 max-w-xs mx-auto">{s.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            {...fadeUp}
            className="mt-16 text-center"
          >
            <a href={registerUrl}>
              <Button
                size="lg"
                className="text-base px-10 py-7 rounded-2xl font-bold shadow-2xl hover:scale-105 transition-all"
                style={{ backgroundColor: primary, color: "#fff", boxShadow: `0 16px 50px -12px ${primaryAlpha(0.5)}` }}
              >
                Comece agora mesmo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* ═══ Social Proof / Trust ═══ */}
      <section className="py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-5">
          <motion.div {...fadeUp} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Parceiros que <span style={{ color: primary }}>confiam</span> em nós
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "Segurança total",
                desc: "Seus dados e transações são protegidos com criptografia de ponta a ponta.",
              },
              {
                icon: TrendingUp,
                title: "Resultados reais",
                desc: "Nossos parceiros reportam um aumento médio de 30% no fluxo de clientes.",
              },
              {
                icon: Users,
                title: "Suporte dedicado",
                desc: "Equipe pronta para ajudar você em todas as etapas da sua jornada.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-7 border text-center"
                style={{ borderColor: primaryAlpha(0.1), backgroundColor: primaryAlpha(0.03) }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ backgroundColor: primaryAlpha(0.1) }}
                >
                  <item.icon className="h-7 w-7" style={{ color: primary }} />
                </div>
                <h3 className="font-bold text-lg mb-2 text-white">{item.title}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="faq" className="py-20 md:py-28" style={{ backgroundColor: primaryAlpha(0.03) }}>
        <div className="max-w-3xl mx-auto px-5">
          <motion.div {...fadeUp} className="text-center mb-14">
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
              style={{ color: primary, backgroundColor: primaryAlpha(0.1) }}
            >
              Tire suas dúvidas
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Perguntas <span style={{ color: primary }}>Frequentes</span>
            </h2>
          </motion.div>

          <div className="space-y-3">
            {config.faq_json.map((f, i) => (
              <FaqItem
                key={i}
                question={f.question}
                answer={f.answer}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                primary={primary}
                fg="#fff"
                primaryAlpha={primaryAlpha}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Final CTA ═══ */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-5">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative rounded-[2rem] p-10 md:p-16 text-center overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${primary}, ${primaryAlpha(0.75)})`,
            }}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 blur-3xl translate-y-1/2 -translate-x-1/4" />

            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <Rocket className="h-12 w-12 mx-auto mb-6 text-white/90" />
                <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
                  {config.cta_title}
                </h2>
                <p className="text-white/80 mb-10 text-base md:text-lg max-w-xl mx-auto">
                  {config.cta_subtitle}
                </p>
                <a href={registerUrl}>
                  <Button
                    size="lg"
                    className="text-base px-12 py-7 rounded-2xl font-bold shadow-2xl hover:shadow-xl hover:scale-105 transition-all bg-white hover:bg-white/95"
                    style={{ color: primary }}
                  >
                    {config.cta_button_text}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="py-10 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {logoUrl && <img src={logoUrl} alt="" className="h-8 w-8 rounded-xl object-cover" />}
              <span className="font-bold text-white">{brand.name}</span>
            </div>
            <p className="text-xs text-white/30">
              © {new Date().getFullYear()} {brand.name} — Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
