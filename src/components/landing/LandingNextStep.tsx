import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Clock, Sparkles } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function LandingNextStep() {
  return (
    <section id="proximo-passo" className="py-20 md:py-28 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/15 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="max-w-2xl mx-auto text-center">
          <motion.div variants={fadeUp} custom={0}>
            <Sparkles className="h-14 w-14 text-primary mx-auto mb-6" />
          </motion.div>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold mb-4">
            Comece agora, <span className="text-primary">grátis por 30 dias</span>
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-lg mb-4">
            Acesso completo a todas as funcionalidades. Sem cartão de crédito, sem pegadinhas.
          </motion.p>
          <motion.p variants={fadeUp} custom={3} className="text-muted-foreground text-sm mb-8">
            Fidelidade + CRM: tudo com sua marca. Monte sua plataforma em menos de 2 minutos e comece a fidelizar seus clientes hoje mesmo.
          </motion.p>

          {/* Trust signals */}
          <motion.div variants={fadeUp} custom={3.5} className="flex items-center justify-center gap-6 mb-10 flex-wrap">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-green-500" />
              Sem cartão de crédito
            </span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" />
              Pronto em 2 minutos
            </span>
          </motion.div>

          <motion.div variants={fadeUp} custom={4}>
            <Button asChild size="lg" className="text-lg px-12 py-7 rounded-full shadow-2xl shadow-primary/20">
              <Link to="/trial">
                Criar meu programa grátis <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
