import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search, UserX, Target, BarChart3, Sparkles } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" as const },
  }),
};

const crmFeatures = [
  {
    icon: BarChart3,
    title: "Diagnóstico do Negócio",
    description: "Entenda a saúde do seu negócio com métricas claras de retenção, frequência e ticket médio.",
  },
  {
    icon: UserX,
    title: "Clientes Perdidos",
    description: "Descubra automaticamente quem parou de comprar e receba sugestões de reativação.",
  },
  {
    icon: Target,
    title: "Potenciais Clientes",
    description: "Identifique os clientes com maior potencial de crescimento e saiba onde focar energia.",
  },
];

function CRMPhoneMockup() {
  return (
    <div className="relative mx-auto w-[220px] md:w-[240px]">
      <div className="rounded-[2rem] border-[6px] border-foreground/80 bg-background shadow-2xl overflow-hidden">
        <div className="flex justify-center pt-2 pb-1 bg-foreground/5">
          <div className="w-16 h-4 rounded-full bg-foreground/15" />
        </div>
        <div className="h-[340px] md:h-[370px] bg-gradient-to-b from-accent/10 to-background p-3 flex flex-col gap-2.5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[8px] text-muted-foreground">CRM Estratégico</p>
              <p className="text-[10px] font-bold text-foreground">Diagnóstico</p>
            </div>
            <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center">
              <BarChart3 className="h-3 w-3 text-accent-foreground" />
            </div>
          </div>

          {/* Health score */}
          <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-3 text-primary-foreground">
            <p className="text-[8px] opacity-80">Saúde do Negócio</p>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-extrabold">78</p>
              <p className="text-[8px] opacity-70 mb-1">/100</p>
            </div>
            <div className="w-full h-1.5 bg-primary-foreground/20 rounded-full mt-1">
              <div className="h-full w-[78%] bg-primary-foreground/60 rounded-full" />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: "Ativos", value: "342", color: "text-green-500" },
              { label: "Em risco", value: "28", color: "text-amber-500" },
              { label: "Perdidos", value: "15", color: "text-destructive" },
              { label: "Potenciais", value: "67", color: "text-primary" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-card border border-border p-2 text-center">
                <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[7px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* List */}
          <div className="space-y-1.5">
            <p className="text-[8px] font-semibold text-muted-foreground">⚠️ Clientes em risco</p>
            {["Ana Costa — 45 dias sem compra", "Carlos Lima — 38 dias"].map((c) => (
              <div key={c} className="flex items-center gap-1.5 rounded-lg bg-destructive/5 border border-destructive/10 px-2 py-1.5">
                <UserX className="h-3 w-3 text-destructive shrink-0" />
                <p className="text-[7px] text-foreground truncate">{c}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center py-1.5 bg-foreground/5">
          <div className="w-20 h-1 rounded-full bg-foreground/20" />
        </div>
      </div>
      <div className="absolute -inset-4 bg-accent/5 rounded-[3rem] blur-2xl -z-10" />
    </div>
  );
}

export default function LandingCRM() {
  const openCRM = () => {
    window.location.href = "/trial";
  };

  return (
    <section id="crm" className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="max-w-6xl mx-auto">
          {/* Badge */}
          <motion.div variants={fadeUp} custom={0} className="text-center mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent-foreground text-sm font-semibold border border-accent/20">
              <Sparkles className="h-4 w-4" />
              Incluso no ecossistema Vale Resgate
            </span>
          </motion.div>

          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold text-center mb-4">
            CRM Inteligente:{" "}
            <span className="text-primary">Descubra clientes perdidos e potenciais</span>
          </motion.h2>

          <motion.p variants={fadeUp} custom={2} className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-14">
            O CRM estratégico analisa automaticamente sua base de clientes e mostra onde focar energia para crescer mais rápido.
          </motion.p>

          <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-16">
            {/* Features */}
            <div className="flex-1 space-y-6">
              {crmFeatures.map((feature, i) => (
                <motion.div key={feature.title} variants={fadeUp} custom={3 + i} className="flex gap-4 items-start">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              ))}

              <motion.div variants={fadeUp} custom={6} className="pt-4">
                <Button size="lg" className="rounded-full px-8 py-6 text-base shadow-lg" onClick={openCRM}>
                  CRM integrado — comece agora <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </div>

            {/* Mockup */}
            <motion.div variants={fadeUp} custom={3} className="shrink-0">
              <CRMPhoneMockup />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
