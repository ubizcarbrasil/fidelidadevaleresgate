import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Smartphone,
  Store,
  QrCode,
  BarChart3,
  Bell,
  ShoppingBag,
  ArrowRight,
  UserPlus,
  Settings,
  Rocket,
  Star,
  CheckCircle2,
  Ghost,
  AlertTriangle,
  TrendingDown,
  Megaphone,
  Frown,
  ShieldAlert,
  Zap,
  Users,
  Trophy,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const benefits = [
  {
    icon: Smartphone,
    title: "App com sua marca",
    desc: "Logo, cores e domínio personalizado. Seu cliente vê a sua marca, não a nossa.",
  },
  {
    icon: Store,
    title: "Gestão de parceiros",
    desc: "Cadastre lojas parceiras que publicam ofertas exclusivas para seus clientes.",
  },
  {
    icon: QrCode,
    title: "Resgate por QR Code",
    desc: "Sistema seguro de resgate com validação em tempo real no ponto de venda.",
  },
  {
    icon: BarChart3,
    title: "Relatórios e métricas",
    desc: "Acompanhe resgates, engajamento e performance de cada parceiro.",
  },
  {
    icon: Bell,
    title: "Notificações push",
    desc: "Envie alertas de novas ofertas e promoções diretamente ao celular do cliente.",
  },
  {
    icon: ShoppingBag,
    title: "Catálogo digital",
    desc: "Parceiros exibem seus produtos e cardápios dentro do seu app de fidelidade.",
  },
];

const painPoints = [
  { icon: Ghost, title: "Cliente Fantasma", desc: "Seu cliente usa apenas uma vez e depois nunca mais volta?" },
  { icon: AlertTriangle, title: "Histórico Zero", desc: "Você não tem histórico de uso e nem dados de recorrência?" },
  { icon: TrendingDown, title: "Desconto que não fideliza", desc: "Você dá desconto e seu cliente usa esse desconto no concorrente?" },
  { icon: Megaphone, title: "Promo-Dependente", desc: "Sua plataforma depende de ações promocionais para ter vendas?" },
  { icon: Frown, title: "Última Opção", desc: "Sua marca não é a primeira que o cliente procura?" },
  { icon: ShieldAlert, title: "Concorrente na frente", desc: "Você sente que a concorrência pode estar à sua frente?" },
];

const steps = [
  { icon: UserPlus, title: "Cadastre-se", desc: "Crie sua conta em segundos, sem cartão de crédito." },
  { icon: Settings, title: "Configure", desc: "Personalize marca, cores, ofertas e parceiros." },
  { icon: Rocket, title: "Publique", desc: "Seu programa de fidelidade no ar, pronto para engajar." },
];

const testimonials = [
  {
    name: "Carla Mendes",
    role: "Proprietária",
    company: "Padaria Flor de Trigo",
    text: "Em menos de uma semana já tínhamos 200 clientes usando o programa. As vendas recorrentes cresceram 35%.",
    stars: 5,
  },
  {
    name: "Roberto Silva",
    role: "Gerente de Marketing",
    company: "Rede FitLife Academias",
    text: "A facilidade de configurar e a experiência do cliente no app são incomparáveis. Nossos alunos adoram os resgates.",
    stars: 5,
  },
  {
    name: "Juliana Costa",
    role: "Franqueadora",
    company: "Belezza Cosméticos",
    text: "Conseguimos unificar o programa de fidelidade de 12 franquias em uma única plataforma. Resultado incrível!",
    stars: 5,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src="/logo-vale-resgate.jpeg" alt="Vale Resgate" className="h-9 w-auto rounded-lg" />
            <span className="font-bold text-lg hidden sm:inline">Vale Resgate</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#como-funciona" className="hover:text-primary transition-colors">Como Funciona</a>
            <a href="#para-quem" className="hover:text-primary transition-colors">Para Quem É?</a>
            <a href="#beneficios" className="hover:text-primary transition-colors">Benefícios</a>
            <a href="#depoimentos" className="hover:text-primary transition-colors">Depoimentos</a>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full px-5">
              <Link to="/trial">
                Começar Agora <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero — inspirado no valeresgate.com.br */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/10 pointer-events-none" />
        {/* Floating dots decorativos */}
        <div className="absolute top-20 left-10 w-3 h-3 rounded-full bg-primary/20 animate-pulse" />
        <div className="absolute top-40 right-20 w-2 h-2 rounded-full bg-primary/15 animate-pulse delay-300" />
        <div className="absolute bottom-20 left-1/4 w-2 h-2 rounded-full bg-accent/20 animate-pulse delay-500" />

        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto text-center"
          >
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-8 border border-primary/20">
              <Zap className="h-4 w-4" />
              O mecanismo que faz clientes voltarem
            </span>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight mb-8">
              Imagine dizer ao seu cliente que todo dinheiro que ele gasta com você…{" "}
              <span className="text-primary">ele pode resgatar de volta.</span>
            </h1>

            <div className="flex items-center justify-center gap-4 mb-8 text-muted-foreground">
              <span className="line-through text-sm">Não como desconto</span>
              <span className="line-through text-sm">Não como cupom</span>
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <a href="#como-funciona">Como funciona</a>
              </Button>
            </div>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
              O <span className="text-primary font-semibold">Vale Resgate</span> transforma compras em pontos que viram{" "}
              <strong className="text-foreground">resgate real na cidade</strong> — criando{" "}
              <span className="text-primary font-semibold">recorrência automática</span>.
            </p>
            <p className="text-muted-foreground mb-10">
              Sem desconto. Sem cupom. Sem fricção.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Button asChild size="lg" className="text-base px-10 py-6 rounded-full shadow-lg text-lg">
                <Link to="/trial">
                  Começar Grátis — 30 dias <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Sem custo de desconto
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Pronto em 2 minutos
              </span>
              <span className="flex items-center gap-1.5 hidden sm:flex">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Sem cartão de crédito
              </span>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-accent/10 border border-border/50 p-8 md:p-12 shadow-xl backdrop-blur-sm">
              <div className="grid grid-cols-3 gap-4 md:gap-6">
                {[
                  { label: "Clientes ativos", value: "2.847", icon: Users },
                  { label: "Resgates / mês", value: "1.230", icon: Trophy },
                  { label: "Parceiros", value: "48", icon: Store },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-2xl md:text-4xl font-bold text-primary">{stat.value}</p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pain Points — "A verdade que ninguém fala" */}
      <section id="para-quem" className="py-20 md:py-28 bg-card/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="text-center mb-6"
          >
            <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
              A verdade que ninguém fala
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold mb-4">
              Você não perde cliente por preço.
            </motion.h2>
            <motion.h3 variants={fadeUp} custom={2} className="text-xl md:text-2xl text-muted-foreground font-medium mb-4">
              Você perde cliente por falta de motivo para voltar.
            </motion.h3>
            <motion.p variants={fadeUp} custom={3} className="text-muted-foreground max-w-xl mx-auto">
              Desconto resolve hoje. Destrói margem amanhã.{" "}
              <span className="text-primary font-semibold">O Vale Resgate muda esse jogo.</span>
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="text-center mb-8 mt-10"
          >
            <motion.p variants={fadeUp} custom={4} className="text-lg font-semibold mb-2">
              O Vale Resgate é para mim?
            </motion.p>
            <motion.p variants={fadeUp} custom={5} className="text-sm text-muted-foreground">
              Se você se identifica com alguma dessas situações, a resposta é sim:
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto"
          >
            {painPoints.map((p, i) => (
              <motion.div key={p.title} variants={fadeUp} custom={i + 6}>
                <Card className="h-full hover:shadow-md transition-shadow border-border/50 hover:border-primary/30">
                  <CardContent className="p-5">
                    <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center mb-3">
                      <p.icon className="h-5 w-5 text-destructive" />
                    </div>
                    <h3 className="font-semibold text-base mb-1">{p.title}</h3>
                    <p className="text-muted-foreground text-sm">{p.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <motion.div variants={fadeUp} custom={12}>
              <p className="text-lg font-semibold text-primary mb-4">
                Se você está em alguma situação dessas, o Vale Resgate é pra você!
              </p>
              <Button asChild size="lg" className="rounded-full px-10 py-6 shadow-lg">
                <Link to="/trial">
                  Testar grátis por 30 dias <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section id="beneficios" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="text-center mb-14"
          >
            <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
              Fidelização que gera resultados
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold mb-4">
              Simplifique a rotina, fidelize clientes e cresça
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-lg max-w-xl mx-auto">
              Funcionalidades pensadas para quem quer fidelizar de verdade.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {benefits.map((b, i) => (
              <motion.div key={b.title} variants={fadeUp} custom={i + 3}>
                <Card className="h-full hover:shadow-md transition-shadow border-border/50">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <b.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{b.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{b.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-20 md:py-28 bg-card/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="text-center mb-14"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold mb-4">
              Como funciona
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-lg">
              Três passos simples para começar a fidelizar.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            {steps.map((s, i) => (
              <motion.div key={s.title} variants={fadeUp} custom={i + 2} className="text-center">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 relative">
                  <s.icon className="h-7 w-7 text-primary" />
                  <span className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA mid-page */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <motion.div variants={fadeUp} custom={5}>
              <Button asChild size="lg" className="rounded-full px-10 py-6 shadow-lg">
                <Link to="/trial">
                  Começar Grátis Agora <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="text-center mb-14"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold mb-4">
              Quem usa, recomenda
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {testimonials.map((t, i) => (
              <motion.div key={t.name} variants={fadeUp} custom={i + 1}>
                <Card className="h-full border-border/50">
                  <CardContent className="p-6">
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: t.stars }).map((_, si) => (
                        <Star key={si} className="h-4 w-4 fill-warning text-warning" />
                      ))}
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed mb-5 italic">"{t.text}"</p>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.role} — {t.company}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 to-accent/10">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="max-w-2xl mx-auto text-center"
          >
            <motion.div variants={fadeUp} custom={0}>
              <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-6" />
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold mb-4">
              Comece hoje, sem compromisso
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-lg mb-4">
              30 dias de acesso completo, grátis. Sem cartão de crédito, sem pegadinhas.
            </motion.p>
            <motion.p variants={fadeUp} custom={3} className="text-muted-foreground text-sm mb-8">
              Monte sua plataforma de fidelidade em menos de 2 minutos e comece a fidelizar seus clientes hoje mesmo.
            </motion.p>
            <motion.div variants={fadeUp} custom={4}>
              <Button asChild size="lg" className="text-lg px-12 py-7 rounded-full shadow-xl">
                <Link to="/trial">
                  Criar meu programa grátis <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <img src="/logo-vale-resgate.jpeg" alt="Vale Resgate" className="h-7 w-auto rounded-md" />
            <p>© {new Date().getFullYear()} Vale Resgate. Todos os direitos reservados.</p>
          </div>
          <div className="flex gap-6">
            <Link to="/auth" className="hover:text-foreground transition-colors">
              Entrar
            </Link>
            <Link to="/trial" className="hover:text-foreground transition-colors">
              Criar conta
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
