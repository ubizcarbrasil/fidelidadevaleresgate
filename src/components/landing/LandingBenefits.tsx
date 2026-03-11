import { motion } from "framer-motion";
import { Palette, Users, BarChart3, Zap, Shield, Globe } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const benefits = [
  {
    icon: Palette,
    title: "100% White-Label",
    desc: "Seus clientes veem apenas a sua marca. Logo, cores, domínio e identidade visual totalmente personalizados.",
  },
  {
    icon: Users,
    title: "Rede de parceiros",
    desc: "Convide lojas parceiras para aceitar resgate e construa um ecossistema de fidelidade com várias marcas.",
  },
  {
    icon: BarChart3,
    title: "CRM integrado",
    desc: "Diagnóstico do negócio, clientes perdidos, potenciais e campanhas automáticas — tudo incluso.",
  },
  {
    icon: Zap,
    title: "No-Code completo",
    desc: "Configure pontuação, ofertas, horários e regras sem precisar de desenvolvedor ou conhecimento técnico.",
  },
  {
    icon: Shield,
    title: "Controle total",
    desc: "Você define regras de pontuação, validade, limites por cliente e quem pode participar da rede.",
  },
  {
    icon: Globe,
    title: "Domínio próprio",
    desc: "Use seu próprio domínio (ex: fidelidade.suaempresa.com.br) para total profissionalismo.",
  },
];

export default function LandingBenefits() {
  return (
    <section id="beneficios" className="py-20 md:py-28 bg-[hsl(160,30%,8%)] relative">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />

      <div className="max-w-6xl mx-auto px-5 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="text-center mb-14">
          <motion.span variants={fadeUp} custom={0} className="inline-flex px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-4 border border-emerald-500/20">
            Por que usar o Vale Resgate?
          </motion.span>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-black text-white mb-4">
            Tudo que você precisa para fidelizar clientes
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-white/50 text-lg max-w-xl mx-auto">
            Uma plataforma completa para criar, gerenciar e escalar seu programa de fidelidade.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              variants={fadeUp}
              custom={i + 3}
              className="group rounded-2xl p-6 bg-white/[0.03] border border-white/[0.06] hover:border-emerald-500/20 hover:bg-white/[0.05] transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/15 transition-colors">
                <b.icon className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">{b.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
