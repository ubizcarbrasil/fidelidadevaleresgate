import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, UserX, Target, BarChart3, Sparkles, TrendingUp, Users, AlertTriangle } from "lucide-react";
import { useEffect, useRef } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.13, duration: 0.6, ease: "easeOut" as const },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { delay: i * 0.13, duration: 0.7, ease: "easeOut" as const },
  }),
};

const crmFeatures = [
  {
    icon: BarChart3,
    title: "Diagnóstico do Negócio",
    description: "Entenda a saúde do seu negócio com métricas claras de retenção, frequência e ticket médio.",
    gradient: "from-primary/20 to-primary/5",
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
  },
  {
    icon: UserX,
    title: "Clientes Perdidos",
    description: "Descubra automaticamente quem parou de comprar e receba sugestões de reativação.",
    gradient: "from-destructive/15 to-destructive/5",
    iconBg: "bg-destructive/15",
    iconColor: "text-destructive",
  },
  {
    icon: Target,
    title: "Potenciais Clientes",
    description: "Identifique os clientes com maior potencial de crescimento e saiba onde focar energia.",
    gradient: "from-accent/20 to-accent/5",
    iconBg: "bg-accent/15",
    iconColor: "text-accent-foreground",
  },
];

function AnimatedCounter({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const unsub = rounded.on("change", (v) => {
      if (ref.current) ref.current.textContent = String(v);
    });
    return unsub;
  }, [rounded]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      onViewportEnter={() => {
        animate(count, value, { duration, ease: "easeOut" });
      }}
    >
      0
    </motion.span>
  );
}

function CRMPhoneMockup() {
  return (
    <motion.div
      className="relative mx-auto w-[250px] md:w-[280px]"
      whileHover={{ y: -8, rotateY: 3 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      {/* Glow rings */}
      <div className="absolute -inset-8 rounded-[4rem] bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 blur-3xl -z-10 animate-pulse" />
      <div className="absolute -inset-4 rounded-[3rem] bg-gradient-to-tr from-primary/10 to-accent/10 blur-xl -z-10" />

      <div className="rounded-[2.5rem] border-[6px] border-foreground/80 bg-background shadow-[0_25px_60px_-15px_hsl(var(--primary)/0.3)] overflow-hidden">
        {/* Notch */}
        <div className="flex justify-center pt-2 pb-1 bg-foreground/5">
          <div className="w-20 h-5 rounded-full bg-foreground/15" />
        </div>

        <div className="h-[380px] md:h-[420px] bg-gradient-to-b from-primary/8 via-background to-accent/5 p-3.5 flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[8px] text-muted-foreground font-medium tracking-wide uppercase">CRM Estratégico</p>
              <p className="text-[11px] font-bold text-foreground">Diagnóstico</p>
            </div>
            <motion.div
              className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
            </motion.div>
          </div>

          {/* Health score card */}
          <motion.div
            className="rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-3.5 text-primary-foreground shadow-lg"
            initial={{ scale: 0.95 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <p className="text-[8px] opacity-80 font-medium">Saúde do Negócio</p>
            <div className="flex items-end gap-1.5 mt-0.5">
              <p className="text-3xl font-extrabold leading-none">78</p>
              <p className="text-[9px] opacity-60 mb-0.5">/100</p>
            </div>
            <div className="w-full h-2 bg-primary-foreground/20 rounded-full mt-2 overflow-hidden">
              <motion.div
                className="h-full bg-primary-foreground/70 rounded-full"
                initial={{ width: "0%" }}
                whileInView={{ width: "78%" }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
              />
            </div>
          </motion.div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Ativos", value: "342", icon: Users, color: "text-green-600", bg: "bg-green-500/10", border: "border-green-500/20" },
              { label: "Em risco", value: "28", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/20" },
              { label: "Perdidos", value: "15", icon: UserX, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
              { label: "Potenciais", value: "67", icon: Target, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
            ].map((s, idx) => (
              <motion.div
                key={s.label}
                className={`rounded-xl ${s.bg} border ${s.border} p-2.5 text-center`}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + idx * 0.08, duration: 0.4 }}
              >
                <s.icon className={`h-3 w-3 mx-auto mb-0.5 ${s.color}`} />
                <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[7px] text-muted-foreground font-medium">{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Alert list */}
          <div className="space-y-1.5 mt-auto">
            <p className="text-[8px] font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-2.5 w-2.5 text-amber-500" />
              Clientes em risco
            </p>
            {[
              { name: "Ana Costa", days: "45 dias sem compra" },
              { name: "Carlos Lima", days: "38 dias" },
            ].map((c, idx) => (
              <motion.div
                key={c.name}
                className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/10 px-2.5 py-2"
                initial={{ x: 20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 + idx * 0.15, duration: 0.4 }}
              >
                <div className="h-5 w-5 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                  <UserX className="h-2.5 w-2.5 text-destructive" />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-semibold text-foreground">{c.name}</p>
                  <p className="text-[7px] text-muted-foreground">{c.days}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Home bar */}
        <div className="flex justify-center py-2 bg-foreground/5">
          <div className="w-24 h-1 rounded-full bg-foreground/20" />
        </div>
      </div>
    </motion.div>
  );
}

export default function LandingCRM() {
  const openCRM = () => {
    window.location.href = "/trial";
  };

  return (
    <section id="crm" className="py-24 md:py-32 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/8 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="max-w-6xl mx-auto">
          {/* Badge */}
          <motion.div variants={fadeUp} custom={0} className="text-center mb-8">
            <motion.span
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-primary/15 to-accent/15 text-foreground text-sm font-bold border border-primary/20 shadow-sm"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Sparkles className="h-4 w-4 text-primary" />
              100% Integrado ao Sistema de Fidelidade
            </motion.span>
          </motion.div>

          {/* Title */}
          <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-extrabold text-center mb-5 leading-tight">
            CRM Inteligente que{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              recupera clientes
            </span>
          </motion.h2>

          <motion.p variants={fadeUp} custom={2} className="text-center text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-6">
            Analise automaticamente sua base, identifique quem parou de comprar e descubra onde focar para crescer.
          </motion.p>

          {/* Stats bar */}
          <motion.div variants={fadeUp} custom={2.5} className="flex justify-center gap-8 md:gap-12 mb-16">
            {[
              { label: "Clientes recuperados", value: 340, suffix: "+" },
              { label: "Receita resgatada", value: 89, suffix: "K" },
              { label: "Taxa de retenção", value: 94, suffix: "%" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-extrabold text-primary">
                  <AnimatedCounter value={stat.value} />
                  {stat.suffix}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          <div className="flex flex-col-reverse lg:flex-row items-center gap-14 lg:gap-20">
            {/* Features */}
            <div className="flex-1 space-y-5">
              {crmFeatures.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  variants={fadeUp}
                  custom={3 + i}
                  whileHover={{ x: 8, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`flex gap-4 items-start rounded-2xl bg-gradient-to-r ${feature.gradient} border border-border/50 p-5 cursor-default`}
                >
                  <div className={`h-14 w-14 rounded-2xl ${feature.iconBg} flex items-center justify-center shrink-0 shadow-sm`}>
                    <feature.icon className={`h-7 w-7 ${feature.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1.5">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}

              <motion.div variants={fadeUp} custom={6} className="pt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="rounded-full px-10 py-7 text-base font-bold shadow-[0_8px_30px_-5px_hsl(var(--primary)/0.4)] hover:shadow-[0_12px_40px_-5px_hsl(var(--primary)/0.5)] transition-all"
                  onClick={openCRM}
                >
                  Começar com CRM integrado
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-xs text-muted-foreground self-center">Sem custo extra · Incluso no plano</p>
              </motion.div>
            </div>

            {/* Mockup */}
            <motion.div variants={scaleIn} custom={3} className="shrink-0">
              <CRMPhoneMockup />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
