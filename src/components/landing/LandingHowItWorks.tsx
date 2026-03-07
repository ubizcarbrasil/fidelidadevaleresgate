import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { UserPlus, Settings, Rocket, ArrowRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const steps = [
  { icon: UserPlus, title: "Cadastre-se", desc: "Crie sua conta em segundos, sem cartão de crédito." },
  { icon: Settings, title: "Configure", desc: "Personalize marca, cores, ofertas e parceiros." },
  { icon: Rocket, title: "Publique", desc: "Seu programa de fidelidade no ar, pronto para engajar." },
];

export default function LandingHowItWorks() {
  return (
    <section id="como-funciona" className="py-20 md:py-28 bg-card/50">
      <div className="container mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="text-center mb-14">
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold mb-4">
            Como funciona
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-lg">
            Três passos simples para começar a fidelizar.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} className="relative max-w-4xl mx-auto">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-[3.5rem] left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div key={s.title} variants={fadeUp} custom={i + 2} className="text-center relative">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 relative z-10 border-4 border-background">
                  <s.icon className="h-7 w-7 text-primary" />
                  <span className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mt-12">
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
  );
}
