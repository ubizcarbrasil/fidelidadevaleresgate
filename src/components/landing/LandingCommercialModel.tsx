import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Check, Star } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const models = [
  {
    title: "Starter",
    subtitle: "Para começar rápido",
    desc: "Ideal para empreendedores que querem lançar um programa de fidelidade simples e eficiente.",
    features: ["App white-label com sua marca", "Até 3 lojas parceiras", "Pontuação manual ou automática", "Relatórios básicos"],
    highlighted: false,
  },
  {
    title: "Profissional",
    subtitle: "Para escalar sua rede",
    desc: "Tudo do Starter + CRM inteligente, campanhas e rede ilimitada de parceiros.",
    features: ["Parceiros ilimitados", "CRM com diagnóstico automático", "Campanhas de reativação", "Domínio personalizado"],
    highlighted: true,
  },
  {
    title: "Enterprise",
    subtitle: "Para grandes operações",
    desc: "Solução completa com API, multi-marca, suporte dedicado e integrações avançadas.",
    features: ["Multi-marca e multi-tenant", "API completa para integrações", "Suporte prioritário dedicado", "SLA e customizações"],
    highlighted: false,
  },
];

export default function LandingCommercialModel() {
  return (
    <section id="modelo-comercial" className="py-20 md:py-28 bg-[hsl(220,30%,7%)] relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />

      <div className="max-w-6xl mx-auto px-5 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="text-center mb-14">
          <motion.span variants={fadeUp} custom={0} className="inline-flex px-4 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold mb-4 border border-cyan-500/20">
            Planos flexíveis
          </motion.span>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-black text-white mb-4">
            Escolha o plano ideal para seu negócio
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-white/50 text-lg max-w-xl mx-auto">
            Comece grátis por 30 dias. Escale conforme sua rede cresce.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} className="grid md:grid-cols-3 gap-6">
          {models.map((m, i) => (
            <motion.div
              key={m.title}
              variants={fadeUp}
              custom={i + 3}
              className={`relative rounded-2xl p-6 md:p-8 border transition-all ${
                m.highlighted
                  ? "bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_40px_-10px_rgba(6,182,212,0.15)]"
                  : "bg-white/[0.03] border-white/[0.06] hover:border-white/10"
              }`}
            >
              {m.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-500 text-white text-xs font-bold shadow-lg">
                    <Star className="h-3 w-3" /> MAIS POPULAR
                  </span>
                </div>
              )}

              <h3 className="font-bold text-xl text-white mb-1">{m.title}</h3>
              <p className="text-cyan-400 text-sm font-medium mb-3">{m.subtitle}</p>
              <p className="text-white/50 text-sm mb-6 leading-relaxed">{m.desc}</p>

              <ul className="space-y-3 mb-8">
                {m.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                    <Check className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={`w-full rounded-xl font-bold border-0 ${
                  m.highlighted
                    ? "bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg"
                    : "bg-white/10 hover:bg-white/15 text-white"
                }`}
              >
                <Link to="/trial">
                  Começar grátis <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
