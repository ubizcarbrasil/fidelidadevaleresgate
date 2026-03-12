import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, useInView } from "framer-motion";
import {
  Eye, Heart, Zap, BarChart3, Star, ChevronDown,
  ArrowRight, Users, Store, Gift, Shield, TrendingUp, Sparkles,
  CheckCircle2, Loader2, Menu, X, Rocket, Target, Award,
  Smartphone, PieChart, MessageSquare, Clock, DollarSign,
  Check, Play, ShoppingCart, Repeat, QrCode, BarChart, Settings,
  BadgeCheck, Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ICON_MAP: Record<string, any> = {
  Eye, Heart, Zap, BarChart3, Star, Users, Store, Gift, Shield,
  TrendingUp, Sparkles, CheckCircle2, Rocket, Target, Award,
  Smartphone, PieChart, MessageSquare, Clock, DollarSign,
  ShoppingCart, Repeat, QrCode, BarChart, Settings, BadgeCheck, Crown,
};

interface LandingConfig {
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string | null;
  logo_url: string | null;
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

interface ModelCard {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  recommended?: boolean;
  icon: string;
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
  if (!hslVal) return "hsl(220, 20%, 6%)";
  const parts = hslVal.replace(/,/g, " ").split(/\s+/).map(p => parseFloat(p));
  if (parts.length >= 3) {
    return `hsl(${parts[0]}, ${parts[1]}%, ${Math.max(0, parts[2] - amount)}%)`;
  }
  return "hsl(220, 20%, 6%)";
}

function lighten(hslVal: string | undefined, amount: number): string {
  if (!hslVal) return "hsl(220, 20%, 50%)";
  const parts = hslVal.replace(/,/g, " ").split(/\s+/).map(p => parseFloat(p));
  if (parts.length >= 3) {
    return `hsl(${parts[0]}, ${parts[1]}%, ${Math.min(100, parts[2] + amount)}%)`;
  }
  return "hsl(220, 20%, 50%)";
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
    const duration = 1800;
    const steps = 50;
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
  question, answer, isOpen, onToggle, primary, primaryAlpha,
}: {
  question: string; answer: string; isOpen: boolean;
  onToggle: () => void; primary: string;
  primaryAlpha: (a: number) => string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl border overflow-hidden backdrop-blur-sm transition-all"
      style={{
        borderColor: isOpen ? primaryAlpha(0.3) : "rgba(255,255,255,0.06)",
        backgroundColor: isOpen ? primaryAlpha(0.06) : "rgba(255,255,255,0.02)",
      }}
    >
      <button
        className="w-full flex items-center justify-between p-5 md:p-6 text-left gap-4"
        onClick={onToggle}
      >
        <span className="font-semibold text-sm md:text-base text-white">{question}</span>
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
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="px-5 md:px-6 pb-5 md:pb-6">
          <p className="text-sm leading-relaxed text-white/60">{answer}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── YouTube helper ── */
function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

/* ── Model Card Component ── */
function ModelCardComponent({
  model, primary, primaryAlpha, registerUrl,
}: {
  model: ModelCard; primary: string; primaryAlpha: (a: number) => string; registerUrl: string;
}) {
  const Icon = ICON_MAP[model.icon] || Store;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative rounded-3xl border p-7 md:p-8 flex flex-col h-full transition-all duration-300"
      style={{
        borderColor: model.recommended ? primaryAlpha(0.4) : "rgba(255,255,255,0.08)",
        backgroundColor: model.recommended ? primaryAlpha(0.08) : "rgba(255,255,255,0.02)",
        boxShadow: model.recommended ? `0 0 60px -20px ${primaryAlpha(0.3)}` : "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-6px)";
        e.currentTarget.style.borderColor = primaryAlpha(0.35);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = model.recommended ? primaryAlpha(0.4) : "rgba(255,255,255,0.08)";
      }}
    >
      {model.recommended && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
          style={{ backgroundColor: primary, color: "#fff" }}
        >
          Recomendado
        </div>
      )}

      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ backgroundColor: primaryAlpha(0.12) }}
      >
        <Icon className="h-7 w-7" style={{ color: primary }} />
      </div>

      <h3 className="font-bold text-xl text-white mb-1">{model.title}</h3>
      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: primary }}>
        {model.subtitle}
      </p>
      <p className="text-sm text-white/55 leading-relaxed mb-6">{model.description}</p>

      <ul className="space-y-3 mb-8 flex-1">
        {model.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-white/70">
            <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: primary }} />
            {f}
          </li>
        ))}
      </ul>

      <a href={registerUrl}>
        <Button
          className="w-full rounded-xl py-6 font-bold text-sm transition-all hover:scale-[1.02]"
          style={{
            backgroundColor: model.recommended ? primary : "transparent",
            color: model.recommended ? "#fff" : primary,
            border: model.recommended ? "none" : `1.5px solid ${primaryAlpha(0.3)}`,
          }}
        >
          Quero esse modelo
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </a>
    </motion.div>
  );
}

/* ── Default models ── */
const DEFAULT_MODELS: ModelCard[] = [
  {
    title: "Parceiro de Resgate",
    subtitle: "Aceita saldo/vale-resgate",
    description: "Você permite que clientes usem o saldo na sua loja, com regras definidas por você.",
    features: [
      "Receba clientes com saldo para gastar",
      "Defina suas próprias regras",
      "Controle dias e horários",
      "Ideal para começar",
    ],
    icon: "Gift",
  },
  {
    title: "Emissor de Pontos",
    subtitle: "Gera pontos para clientes",
    description: "Você concede pontos aos clientes por compras na sua loja, criando um ciclo de fidelização.",
    features: [
      "Fidelize seus clientes",
      "Pontuação por compra",
      "Integração automática ou manual",
      "Aumente a recorrência",
    ],
    icon: "TrendingUp",
  },
  {
    title: "Modelo Completo",
    subtitle: "Emite pontos + aceita resgate",
    description: "O melhor dos dois mundos: gere pontos para fidelizar e aceite saldo para atrair novos clientes.",
    features: [
      "Máximo potencial de vendas",
      "Fidelização + aquisição",
      "Relatórios completos",
      "Suporte prioritário",
    ],
    recommended: true,
    icon: "Crown",
  },
];

/* ── Default extended FAQ ── */
const DEFAULT_EXTENDED_FAQ = [
  { question: "Quanto custa para participar?", answer: "O cadastro é gratuito. Você só paga uma pequena taxa por resgate efetivado, sem mensalidades ou taxas fixas." },
  { question: "Eu vou 'dar desconto'?", answer: "Não exatamente. Você aceita crédito/saldo de um programa de pontos. O cliente gasta mais do que o saldo, então você ganha uma venda incremental com margem garantida." },
  { question: "Preciso ter site ou aplicativo?", answer: "Não! Seu estabelecimento aparece automaticamente no aplicativo para todos os usuários cadastrados da região." },
  { question: "Como funciona o fluxo para o cliente?", answer: "O cliente acumula pontos em compras, os pontos viram saldo, e ele resgata esse saldo na sua loja apresentando um QR Code ou código no caixa." },
  { question: "Como o cliente pontua?", answer: "Através de compras em lojas parceiras, nota fiscal, integração com sistema de PDV ou bonificações especiais de campanhas." },
  { question: "O que eu preciso para começar?", answer: "Apenas preencher o cadastro online. Em poucos minutos sua loja já pode estar visível no aplicativo." },
  { question: "Eu consigo controlar dia e horário da oferta?", answer: "Sim! Você define dias da semana, horários, limites de resgate por dia e o valor máximo que aceita por transação." },
  { question: "Como funciona o resgate no caixa?", answer: "O cliente apresenta QR Code ou código numérico. O operador digita o valor no painel e confirma. Simples e rápido." },
  { question: "Em quais produtos o resgate pode ser usado?", answer: "Você define! Pode ser em qualquer produto, em categorias específicas ou com exceções — tudo configurável no seu painel." },
  { question: "Existe mínimo de compra?", answer: "Você decide se quer exigir um valor mínimo de compra para aceitar resgate. Total flexibilidade." },
  { question: "Minha loja precisa ter integração/PDV?", answer: "Não é obrigatório. O resgate pode ser feito manualmente pelo painel web. Mas se quiser, oferecemos integração via API." },
  { question: "Vocês divulgam minha loja para a base?", answer: "Sim! Sua loja aparece na vitrine do app, em campanhas segmentadas e em notificações push para clientes da região." },
  { question: "Como evitar fraudes?", answer: "Cada resgate gera um código único com validação em tempo real. Relatórios detalhados permitem auditoria completa." },
  { question: "Eu vou ter relatório do que aconteceu?", answer: "Sim. Painel completo com resgates, ticket médio, horários de pico, ROI e histórico detalhado por período." },
  { question: "Posso cancelar a qualquer momento?", answer: "Sim, não há fidelidade nem multa. Você pode pausar ou encerrar sua participação quando quiser." },
];

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
          logo_url: (configData as any).logo_url || null,
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
          hero_title: "Aumente suas vendas com clientes prontos para comprar",
          hero_subtitle: "Conectamos sua loja a milhares de clientes com saldo para gastar. Mais tráfego, mais vendas, menor custo de aquisição.",
          hero_image_url: null,
          numbers_json: [
            { value: "2.000.000+", label: "Clientes na base" },
            { value: "500+", label: "Parceiros ativos" },
            { value: "50.000+", label: "Resgates realizados" },
            { value: "30%", label: "Aumento médio em vendas" },
          ],
          benefits_json: [
            { title: "Mais clientes no caixa", description: "Tráfego qualificado com intenção real de compra. Clientes vêm porque têm saldo para gastar.", icon: "ShoppingCart" },
            { title: "Menor custo de aquisição", description: "CAC muito mais baixo que anúncios tradicionais. Sem desperdício com quem não vai comprar.", icon: "TrendingUp" },
            { title: "Vendas incrementais", description: "Cliente vem porque 'tem pontos' e sempre compra mais do que o saldo disponível.", icon: "DollarSign" },
            { title: "Controle total", description: "Você define dia, horário, limite e oferta. Ative nos horários fracos e transforme em fluxo no caixa.", icon: "Settings" },
            { title: "Fidelização real", description: "Cliente volta para usar o saldo e cria hábito de comprar na sua loja. Recorrência garantida.", icon: "Heart" },
            { title: "Relatórios completos", description: "Acompanhe resgates, ticket médio, horários de pico e ROI da campanha em tempo real.", icon: "BarChart" },
          ],
          how_it_works_json: [
            { step: "01", title: "Cliente vê a oferta", description: "Cliente encontra sua loja na vitrine do app com ofertas atrativas e saldo disponível." },
            { step: "02", title: "Acumula pontos", description: "Através de compras, nota fiscal ou integração automática, os pontos entram na conta do cliente." },
            { step: "03", title: "Pontos viram saldo", description: "Os pontos são convertidos em crédito de resgate que pode ser usado na sua loja." },
            { step: "04", title: "Resgate no caixa", description: "Cliente apresenta QR Code ou código no caixa e usa o saldo conforme as regras da oferta." },
          ],
          faq_json: DEFAULT_EXTENDED_FAQ,
          cta_title: "Pronto para aumentar suas vendas?",
          cta_subtitle: "Junte-se a centenas de lojistas que já estão recebendo clientes com saldo para gastar. Cadastro rápido, sem burocracia.",
          cta_button_text: "Quero ser Parceiro",
        });
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "hsl(220, 20%, 4%)" }}>
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (!brand || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "hsl(220, 20%, 4%)" }}>
        <p className="text-white/50">Página não encontrada.</p>
      </div>
    );
  }

  const primary = hsl(theme?.primary, "hsl(160, 70%, 45%)");
  const primaryAlpha = (a: number) => withAlpha(theme?.primary, a, `hsla(160, 70%, 45%, ${a})`);
  const primaryLight = lighten(theme?.primary, 15);
  const bgDark = darken(theme?.primary, 38);
  const bgDarker = darken(theme?.primary, 42);
  const logoUrl = (brand.brand_settings_json as any)?.theme?.logo_url;
  const registerUrl = "/register-store";

  const fadeUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
  };

  // Detect YouTube URL
  const youtubeId = config.hero_image_url ? getYouTubeId(config.hero_image_url) : null;

  // Use extended FAQ if config has less than 5
  const faqItems = config.faq_json.length >= 5 ? config.faq_json : DEFAULT_EXTENDED_FAQ;

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: bgDark, color: "#fff" }}>
      {/* ═══ Navbar ═══ */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-xl border-b"
        style={{ backgroundColor: `${bgDarker}dd`, borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
             {logoUrl ? (
              <img src={logoUrl} alt={brand.name} className="h-9 w-auto max-w-[140px] rounded-xl object-contain shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling && ((e.target as HTMLImageElement).nextElementSibling as HTMLElement).removeAttribute('hidden'); }} />
            ) : null}
            <span className={logoUrl ? "font-bold text-lg text-white" : "font-bold text-lg text-white"} {...(logoUrl ? { hidden: true } : {})}>{brand.name}</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/50">
            <a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a>
            <a href="#beneficios" className="hover:text-white transition-colors">Benefícios</a>
            <a href="#modelos" className="hover:text-white transition-colors">Modelos</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <a href={registerUrl} className="hidden sm:block">
              <Button
                size="sm"
                className="rounded-full px-6 font-semibold border-0 hover:scale-105 transition-transform"
                style={{ backgroundColor: primary, color: "#fff" }}
              >
                Quero ser parceiro <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </a>
            <button className="md:hidden text-white/60" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t px-5 py-4 space-y-3"
            style={{ backgroundColor: bgDarker, borderColor: "rgba(255,255,255,0.06)" }}
          >
            <a href="#como-funciona" className="block text-sm text-white/60 hover:text-white" onClick={() => setMenuOpen(false)}>Como Funciona</a>
            <a href="#beneficios" className="block text-sm text-white/60 hover:text-white" onClick={() => setMenuOpen(false)}>Benefícios</a>
            <a href="#modelos" className="block text-sm text-white/60 hover:text-white" onClick={() => setMenuOpen(false)}>Modelos</a>
            <a href="#faq" className="block text-sm text-white/60 hover:text-white" onClick={() => setMenuOpen(false)}>FAQ</a>
            <a href={registerUrl} className="block text-sm font-semibold pt-2" style={{ color: primary }}>Quero ser parceiro →</a>
          </motion.div>
        )}
      </nav>

      {/* ═══ Hero ═══ */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div
          className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] rounded-full blur-[150px] opacity-15"
          style={{ background: `radial-gradient(circle, ${primary}, transparent)` }}
        />
        <div className="absolute inset-0" style={{
          background: `radial-gradient(ellipse at 20% 30%, ${primaryAlpha(0.08)} 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, ${primaryAlpha(0.05)} 0%, transparent 50%)`,
        }} />

        <div className="max-w-6xl mx-auto px-5 pt-20 pb-8 md:pt-32 md:pb-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider mb-10 border"
              style={{ backgroundColor: primaryAlpha(0.08), borderColor: primaryAlpha(0.2), color: primary }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Ecossistema de Pontos + Resgate
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.08] mb-7 tracking-tight"
            >
              {config.hero_title.split(/( )/).map((word, i) => {
                // Highlight last 2-3 words with brand color
                const words = config.hero_title.split(" ");
                const wordIndex = config.hero_title.substring(0, config.hero_title.indexOf(word)).split(" ").length - 1;
                const isHighlight = wordIndex >= words.length - 3;
                return isHighlight && word.trim() ? (
                  <span key={i} style={{ color: primary }}>{word}</span>
                ) : (
                  <span key={i}>{word}</span>
                );
              })}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-base md:text-xl text-white/55 max-w-2xl mx-auto mb-10 leading-relaxed"
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
            </motion.div>
          </div>

          {/* Hero media - YouTube or Image */}
          {config.hero_image_url && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-16 max-w-3xl mx-auto"
            >
              {youtubeId ? (
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
                    title="Video"
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <img
                  src={config.hero_image_url}
                  alt=""
                  className="w-full rounded-3xl shadow-2xl border border-white/10"
                />
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* ═══ Numbers (Stats bar) ═══ */}
      <section className="relative py-14 border-y" style={{ borderColor: "rgba(255,255,255,0.06)", backgroundColor: primaryAlpha(0.03) }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className={`grid gap-8 ${config.numbers_json.length <= 3 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4"}`}>
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
                <p className="text-xs md:text-sm mt-2 text-white/45 font-medium">{n.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Benefits ═══ */}
      <section id="beneficios" className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-5">
          <motion.div {...fadeUp} className="text-center mb-16">
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-4 py-1.5 rounded-full"
              style={{ color: primary, backgroundColor: primaryAlpha(0.1) }}
            >
              Por que participar?
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Benefícios reais para <span style={{ color: primary }}>sua loja</span>
            </h2>
            <p className="text-white/45 max-w-2xl mx-auto text-base md:text-lg">
              Não é desconto. É uma estratégia inteligente de aquisição e fidelização de clientes.
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
                  className="group rounded-2xl p-7 border transition-all duration-300 cursor-default"
                  style={{
                    borderColor: "rgba(255,255,255,0.06)",
                    backgroundColor: "rgba(255,255,255,0.02)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = primaryAlpha(0.07);
                    e.currentTarget.style.borderColor = primaryAlpha(0.2);
                    e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.02)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: primaryAlpha(0.1) }}
                  >
                    <Icon className="h-6 w-6" style={{ color: primary }} />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-white">{b.title}</h3>
                  <p className="text-sm leading-relaxed text-white/50">{b.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ How it works ═══ */}
      <section id="como-funciona" className="py-24 md:py-32 relative" style={{ backgroundColor: primaryAlpha(0.03) }}>
        <div className="max-w-5xl mx-auto px-5">
          <motion.div {...fadeUp} className="text-center mb-20">
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-4 py-1.5 rounded-full"
              style={{ color: primary, backgroundColor: primaryAlpha(0.1) }}
            >
              Simples e direto
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Como funciona para o <span style={{ color: primary }}>cliente</span>?
            </h2>
            <p className="text-white/45 max-w-xl mx-auto">
              Um fluxo simples que leva clientes até sua loja prontos para comprar.
            </p>
          </motion.div>

          <div className="relative">
            {/* Vertical connection line */}
            <div
              className="hidden md:block absolute left-[39px] top-0 bottom-0 w-[2px]"
              style={{ background: `linear-gradient(180deg, transparent, ${primaryAlpha(0.2)}, ${primaryAlpha(0.2)}, transparent)` }}
            />

            <div className="space-y-8 md:space-y-12">
              {config.how_it_works_json.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="flex items-start gap-6 md:gap-8"
                >
                  <div
                    className="flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black relative z-10 shadow-xl"
                    style={{
                      background: `linear-gradient(135deg, ${primary}, ${primaryAlpha(0.6)})`,
                      color: "#fff",
                      boxShadow: `0 8px 30px -8px ${primaryAlpha(0.4)}`,
                    }}
                  >
                    {s.step}
                  </div>
                  <div className="pt-2">
                    <h3 className="font-bold text-xl mb-2 text-white">{s.title}</h3>
                    <p className="text-sm md:text-base leading-relaxed text-white/50 max-w-lg">{s.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Participation Models ═══ */}
      <section id="modelos" className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-5">
          <motion.div {...fadeUp} className="text-center mb-16">
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-4 py-1.5 rounded-full"
              style={{ color: primary, backgroundColor: primaryAlpha(0.1) }}
            >
              Modelos flexíveis
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Como sua loja pode <span style={{ color: primary }}>participar</span>?
            </h2>
            <p className="text-white/45 max-w-xl mx-auto">
              Escolha o modelo que faz mais sentido para o seu negócio.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-5 items-stretch">
            {DEFAULT_MODELS.map((model, i) => (
              <ModelCardComponent
                key={i}
                model={model}
                primary={primary}
                primaryAlpha={primaryAlpha}
                registerUrl={registerUrl}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Social Proof / Trust ═══ */}
      <section className="py-20 md:py-24" style={{ backgroundColor: primaryAlpha(0.03) }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "Segurança total",
                desc: "Seus dados e transações são protegidos com criptografia de ponta a ponta. Cada resgate gera um código único verificável.",
              },
              {
                icon: TrendingUp,
                title: "Resultados comprovados",
                desc: "Nossos parceiros reportam um aumento médio de 30% no fluxo de clientes e ticket médio superior ao normal.",
              },
              {
                icon: Users,
                title: "Suporte dedicado",
                desc: "Equipe pronta para ajudar em todas as etapas. Onboarding personalizado para garantir seu sucesso.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="rounded-2xl p-7 border text-center"
                style={{ borderColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.02)" }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ backgroundColor: primaryAlpha(0.1) }}
                >
                  <item.icon className="h-7 w-7" style={{ color: primary }} />
                </div>
                <h3 className="font-bold text-lg mb-2 text-white">{item.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="faq" className="py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-5">
          <motion.div {...fadeUp} className="text-center mb-14">
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-4 py-1.5 rounded-full"
              style={{ color: primary, backgroundColor: primaryAlpha(0.1) }}
            >
              Dúvidas frequentes
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Perguntas & <span style={{ color: primary }}>Respostas</span>
            </h2>
            <p className="text-white/45 max-w-lg mx-auto">
              Tudo que você precisa saber para se tornar um parceiro.
            </p>
          </motion.div>

          <div className="space-y-3">
            {faqItems.map((f, i) => (
              <FaqItem
                key={i}
                question={f.question}
                answer={f.answer}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                primary={primary}
                primaryAlpha={primaryAlpha}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Final CTA ═══ */}
      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-5">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative rounded-[2rem] p-10 md:p-16 text-center overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${primary}, ${primaryAlpha(0.65)})`,
            }}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-white/5 blur-3xl translate-y-1/2 -translate-x-1/4" />

            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <Rocket className="h-14 w-14 mx-auto mb-6 text-white/80" />
                <h2 className="text-3xl md:text-5xl font-black text-white mb-5 tracking-tight">
                  {config.cta_title}
                </h2>
                <p className="text-white/80 mb-10 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
                  {config.cta_subtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a href={registerUrl}>
                    <Button
                      size="lg"
                      className="text-base px-12 py-7 rounded-2xl font-bold shadow-2xl hover:shadow-xl hover:scale-105 transition-all bg-white hover:bg-white/95 w-full sm:w-auto"
                      style={{ color: primary }}
                    >
                      {config.cta_button_text}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </a>
                  <a href="https://wa.me/" target="_blank" rel="noopener noreferrer">
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-base px-8 py-7 rounded-2xl font-semibold w-full sm:w-auto border-white/30 text-white hover:bg-white/10 transition-all"
                    >
                      <MessageSquare className="mr-2 h-5 w-5" />
                      Falar no WhatsApp
                    </Button>
                  </a>
                </div>
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
              {logoUrl ? (
                <img src={logoUrl} alt={brand.name} className="h-8 w-auto max-w-[120px] rounded-xl object-contain shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling && ((e.target as HTMLImageElement).nextElementSibling as HTMLElement).removeAttribute('hidden'); }} />
              ) : null}
              <span className="font-bold text-white" {...(logoUrl ? { hidden: true } : {})}>{brand.name}</span>
            </div>
            <p className="text-xs text-white/25">
              © {new Date().getFullYear()} {brand.name} — Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
