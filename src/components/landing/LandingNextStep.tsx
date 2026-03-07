import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function LandingNextStep() {
  return (
    <section id="proximo-passo" className="py-20 md:py-28 bg-gradient-to-br from-primary/5 to-accent/10">
      <div className="container mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="max-w-2xl mx-auto text-center">
          <motion.div variants={fadeUp} custom={0}>
            <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-6" />
          </motion.div>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold mb-4">
            Próximo Passo
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
  );
}
