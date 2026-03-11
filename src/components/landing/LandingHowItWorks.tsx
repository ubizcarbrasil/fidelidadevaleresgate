import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Settings, Store, Users, Sparkles } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const steps = [
  { icon: Settings, num: "01", title: "Configure seu programa", desc: "Cadastre-se, personalize marca, cores e regras de pontuação. Tudo no-code, pronto em minutos." },
  { icon: Store, num: "02", title: "Convide parceiros", desc: "Adicione lojas à sua rede de resgate. Elas recebem clientes com saldo para gastar." },
  { icon: Users, num: "03", title: "Clientes acumulam pontos", desc: "Seus clientes ganham pontos a cada compra, corrida ou interação — automático ou manual." },
  { icon: Sparkles, num: "04", title: "Resgate e fidelização", desc: "Clientes usam o saldo nos parceiros da rede. Você acompanha tudo pelo CRM integrado." },
];

export default function LandingHowItWorks() {
  return (
    <section id="como-funciona" className="py-20 md:py-28 bg-[hsl(160,30%,6%)] relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(160,30%,8%)] via-transparent to-[hsl(160,30%,8%)]" />

      <div className="max-w-6xl mx-auto px-5 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="text-center mb-14">
          <motion.span variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-4 border border-emerald-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            Simples e direto
          </motion.span>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-black text-white mb-4">
            Como funciona para o empreendedor?
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-white/50 text-lg max-w-xl mx-auto">
            Em 4 passos você cria seu programa de fidelidade completo.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              variants={fadeUp}
              custom={i + 3}
              className="relative text-center group"
            >
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-emerald-500/20 to-transparent" />
              )}

              <div className="relative inline-flex mb-6">
                <div className="h-20 w-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/15 transition-colors">
                  <s.icon className="h-8 w-8 text-emerald-400" />
                </div>
                <span className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shadow-lg">
                  {s.num}
                </span>
              </div>
              <h3 className="font-bold text-lg text-white mb-2">{s.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mt-14">
          <motion.div variants={fadeUp} custom={8}>
            <Button asChild size="lg" className="rounded-full px-10 py-7 bg-emerald-500 hover:bg-emerald-400 text-white font-bold shadow-[0_8px_30px_-5px_rgba(16,185,129,0.4)] border-0">
              <Link to="/trial">
                Criar meu programa <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
