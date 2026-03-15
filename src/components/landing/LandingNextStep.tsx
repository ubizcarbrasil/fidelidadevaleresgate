import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Clock, Sparkles, MessageCircle } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function LandingNextStep() {
  return (
    <section id="proximo-passo" className="py-20 md:py-28 bg-[hsl(220,30%,7%)] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-cyan-500/5 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-3xl mx-auto px-5 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="text-center">
          <motion.div variants={fadeUp} custom={0} className="mb-6">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-cyan-500/15 border border-cyan-500/20">
              <Sparkles className="h-8 w-8 text-cyan-400" />
            </div>
          </motion.div>

          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-black text-white mb-5">
            Pronto para criar seu programa de fidelidade?
          </motion.h2>

          <motion.p variants={fadeUp} custom={2} className="text-white/50 text-lg mb-4 max-w-xl mx-auto">
            Junte-se a centenas de empreendedores que já criaram seus próprios programas de pontos e resgate. Cadastro rápido, sem burocracia.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex items-center justify-center gap-6 mb-10 flex-wrap">
            <span className="flex items-center gap-1.5 text-sm text-white/50">
              <Shield className="h-4 w-4 text-cyan-400" />
              Sem cartão de crédito
            </span>
            <span className="flex items-center gap-1.5 text-sm text-white/50">
              <Clock className="h-4 w-4 text-cyan-400" />
              Pronto em 2 minutos
            </span>
          </motion.div>

          <motion.div variants={fadeUp} custom={4} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="text-lg px-12 py-7 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white font-bold shadow-[0_8px_30px_-5px_rgba(6,182,212,0.4)] hover:shadow-[0_12px_40px_-5px_rgba(6,182,212,0.5)] transition-all border-0"
            >
              <Link to="/trial">
                Começar grátis por 30 dias <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-lg px-10 py-7 rounded-full border-white/15 text-white hover:bg-white/5 hover:text-white"
            >
              <a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" />
                Falar no WhatsApp
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
