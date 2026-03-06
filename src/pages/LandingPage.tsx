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
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
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
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/20 pointer-events-none" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto text-center"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              ✨ 30 dias grátis — sem cartão de crédito
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight mb-6">
              Seu programa de fidelidade{" "}
              <span className="text-primary">pronto em 2 minutos</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Crie um app white-label de fidelidade com sua marca, gerencie parceiros, ofertas e resgates — tudo em uma plataforma completa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-base px-8 py-6 rounded-xl shadow-lg">
                <Link to="/trial">
                  Começar grátis <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8 py-6 rounded-xl">
                <a href="#como-funciona">Ver como funciona</a>
              </Button>
            </div>
          </motion.div>

          {/* Floating visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-accent/10 border border-border/50 p-8 md:p-12 shadow-xl backdrop-blur-sm">
              <div className="grid grid-cols-3 gap-4 md:gap-6">
                {[
                  { label: "Clientes ativos", value: "2.847", color: "text-primary" },
                  { label: "Resgates / mês", value: "1.230", color: "text-success" },
                  { label: "Parceiros", value: "48", color: "text-warning" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className={`text-2xl md:text-4xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 md:py-28 bg-card/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="text-center mb-14"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa em um só lugar
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-lg max-w-xl mx-auto">
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
              <motion.div key={b.title} variants={fadeUp} custom={i + 2}>
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
      <section id="como-funciona" className="py-20 md:py-28">
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
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28 bg-card/50">
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
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="max-w-2xl mx-auto text-center"
          >
            <motion.div variants={fadeUp} custom={0}>
              <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-6" />
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold mb-4">
              Comece hoje, sem compromisso
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-lg mb-8">
              30 dias de acesso completo, grátis. Sem cartão de crédito, sem pegadinhas.
            </motion.p>
            <motion.div variants={fadeUp} custom={3}>
              <Button asChild size="lg" className="text-base px-10 py-6 rounded-xl shadow-lg">
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
          <p>© {new Date().getFullYear()} Vale Resgate. Todos os direitos reservados.</p>
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
