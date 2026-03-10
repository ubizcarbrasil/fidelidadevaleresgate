import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Eye, Heart, Zap, BarChart3, Star, ChevronDown, ChevronUp,
  ArrowRight, Users, Store, Gift, Shield, TrendingUp, Sparkles,
  CheckCircle2, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ICON_MAP: Record<string, any> = {
  Eye, Heart, Zap, BarChart3, Star, Users, Store, Gift, Shield, TrendingUp, Sparkles, CheckCircle2,
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

export default function PartnerLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [config, setConfig] = useState<LandingConfig | null>(null);
  const [brand, setBrand] = useState<any>(null);
  const [theme, setTheme] = useState<BrandTheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      // Load brand by slug
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

      // Load landing config
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
        // Use defaults
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!brand || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Página não encontrada.</p>
      </div>
    );
  }

  const primary = hsl(theme?.primary, "hsl(var(--primary))");
  const primaryAlpha = (a: number) => withAlpha(theme?.primary, a, `hsl(var(--primary) / ${a})`);
  const fg = hsl(theme?.foreground, "hsl(var(--foreground))");
  const logoUrl = (brand.brand_settings_json as any)?.theme?.logo_url;
  const registerUrl = "/register-store";

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl border-b"
        style={{ backgroundColor: `${primaryAlpha(0.05)}`, borderColor: primaryAlpha(0.1) }}
      >
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl && <img src={logoUrl} alt="" className="h-9 w-9 rounded-xl object-cover" />}
            <span className="font-bold text-lg" style={{ color: fg }}>{brand.name}</span>
          </div>
          <a href={registerUrl}>
            <Button size="sm" style={{ backgroundColor: primary, color: "#fff" }}>
              Cadastre-se
            </Button>
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${primaryAlpha(0.08)} 0%, ${primaryAlpha(0.02)} 50%, transparent 100%)`,
          }}
        />
        <div className="max-w-5xl mx-auto px-5 py-16 md:py-24 relative z-10">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl md:text-5xl font-black leading-tight mb-5" style={{ color: fg }}>
                {config.hero_title}
              </h1>
              <p className="text-base md:text-lg mb-8 leading-relaxed" style={{ color: fg, opacity: 0.7 }}>
                {config.hero_subtitle}
              </p>
              <a href={registerUrl}>
                <Button
                  size="lg"
                  className="text-base px-8 py-6 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all"
                  style={{ backgroundColor: primary, color: "#fff" }}
                >
                  {config.cta_button_text}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            </motion.div>
            {config.hero_image_url && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <img
                  src={config.hero_image_url}
                  alt=""
                  className="w-full max-w-md mx-auto rounded-3xl shadow-2xl"
                />
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="py-12 border-y" style={{ borderColor: primaryAlpha(0.08) }}>
        <div className="max-w-5xl mx-auto px-5">
          <div className="grid grid-cols-3 gap-6">
            {config.numbers_json.map((n, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-2xl md:text-4xl font-black" style={{ color: primary }}>{n.value}</p>
                <p className="text-xs md:text-sm mt-1" style={{ color: fg, opacity: 0.6 }}>{n.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-5">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-black text-center mb-12"
            style={{ color: fg }}
          >
            Por que ser um parceiro?
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-6">
            {config.benefits_json.map((b, i) => {
              const Icon = ICON_MAP[b.icon] || Star;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl p-6 border transition-all hover:shadow-lg"
                  style={{ borderColor: primaryAlpha(0.12), backgroundColor: primaryAlpha(0.03) }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: primaryAlpha(0.12) }}
                  >
                    <Icon className="h-6 w-6" style={{ color: primary }} />
                  </div>
                  <h3 className="font-bold text-lg mb-2" style={{ color: fg }}>{b.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: fg, opacity: 0.65 }}>{b.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16" style={{ backgroundColor: primaryAlpha(0.04) }}>
        <div className="max-w-5xl mx-auto px-5">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-black text-center mb-12"
            style={{ color: fg }}
          >
            Como funciona?
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            {config.how_it_works_json.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl font-black"
                  style={{ backgroundColor: primary, color: "#fff" }}
                >
                  {s.step}
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: fg }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: fg, opacity: 0.65 }}>{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-5">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-black text-center mb-12"
            style={{ color: fg }}
          >
            Perguntas Frequentes
          </motion.h2>
          <div className="space-y-3">
            {config.faq_json.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border overflow-hidden"
                style={{ borderColor: primaryAlpha(0.12) }}
              >
                <button
                  className="w-full flex items-center justify-between p-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-sm md:text-base pr-4" style={{ color: fg }}>{f.question}</span>
                  {openFaq === i ? (
                    <ChevronUp className="h-5 w-5 flex-shrink-0" style={{ color: primary }} />
                  ) : (
                    <ChevronDown className="h-5 w-5 flex-shrink-0" style={{ color: primary }} />
                  )}
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="px-5 pb-5"
                  >
                    <p className="text-sm leading-relaxed" style={{ color: fg, opacity: 0.65 }}>{f.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl p-10 md:p-14 text-center relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${primary}, ${primaryAlpha(0.85)})` }}
          >
            <h2 className="text-2xl md:text-3xl font-black text-white mb-4">{config.cta_title}</h2>
            <p className="text-white/80 mb-8 text-sm md:text-base">{config.cta_subtitle}</p>
            <a href={registerUrl}>
              <Button
                size="lg"
                className="text-base px-10 py-6 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all bg-white hover:bg-white/90"
                style={{ color: primary }}
              >
                {config.cta_button_text}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t" style={{ borderColor: primaryAlpha(0.08) }}>
        <div className="max-w-5xl mx-auto px-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            {logoUrl && <img src={logoUrl} alt="" className="h-6 w-6 rounded-lg object-cover" />}
            <span className="font-bold text-sm" style={{ color: fg }}>{brand.name}</span>
          </div>
          <p className="text-xs" style={{ color: fg, opacity: 0.4 }}>
            © {new Date().getFullYear()} — Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
