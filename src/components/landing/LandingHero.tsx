import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Rocket, Globe, Palette } from "lucide-react";

const stats = [
  { value: "100%", label: "White-Label", icon: Palette },
  { value: "No-Code", label: "Sem programação", icon: Rocket },
  { value: "Global", label: "Domínio próprio", icon: Globe },
];

export default function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/40 via-[hsl(160,30%,6%)] to-[hsl(160,30%,6%)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/8 rounded-full blur-[120px]" />

      <motion.div
        className="absolute top-16 left-[10%]"
        animate={{ y: [-5, 5, -5], rotate: [0, 10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles className="h-6 w-6 text-yellow-400/40" />
      </motion.div>
      <motion.div
        className="absolute top-32 right-[15%]"
        animate={{ y: [5, -5, 5], rotate: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles className="h-5 w-5 text-emerald-400/30" />
      </motion.div>

      <div className="max-w-6xl mx-auto px-5 pt-16 pb-20 md:pt-24 md:pb-28 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-semibold border border-emerald-500/20">
            <Sparkles className="h-4 w-4" />
            Plataforma de Fidelidade White-Label
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center max-w-4xl mx-auto mb-8"
        >
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight text-white">
            Crie seu próprio{" "}
            <span className="text-emerald-400">programa de fidelidade</span>{" "}
            com sua marca
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-10"
        >
          App completo, domínio próprio e CRM integrado. Monte seu ecossistema de pontos e resgate
          sem escrever uma linha de código.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mb-16"
        >
          <Button
            asChild
            size="lg"
            className="text-base md:text-lg px-10 py-7 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold shadow-[0_8px_30px_-5px_rgba(16,185,129,0.4)] hover:shadow-[0_12px_40px_-5px_rgba(16,185,129,0.5)] transition-all border-0"
          >
            <Link to="/trial">
              Começar grátis por 30 dias <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
                className="text-center p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm"
              >
                <stat.icon className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
                <p className="text-xl md:text-3xl font-black text-emerald-400">{stat.value}</p>
                <p className="text-xs md:text-sm text-white/50 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-b from-transparent to-[hsl(160,30%,8%)]" />
    </section>
  );
}
