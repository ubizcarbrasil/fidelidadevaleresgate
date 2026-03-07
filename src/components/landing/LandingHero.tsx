import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Zap, CheckCircle2, ArrowRight, Users, Trophy, Store } from "lucide-react";

export default function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/10 pointer-events-none" />
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
            O mecanismo que faz passageiros voltarem
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
            O <span className="text-primary font-semibold">Vale Resgate</span> transforma corridas em pontos que viram{" "}
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

          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Sem custo de desconto
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Integração em dias
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              WhatsApp API incluso
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
  );
}
