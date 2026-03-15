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
  { icon: BarChart3, title: "Diagnóstico do Negócio", description: "Entenda a saúde do seu negócio com métricas claras de retenção, frequência e ticket médio." },
  { icon: UserX, title: "Clientes Perdidos", description: "Descubra automaticamente quem parou de comprar e receba sugestões de reativação." },
  { icon: Target, title: "Potenciais Clientes", description: "Identifique os clientes com maior potencial de crescimento e saiba onde focar energia." },
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
      onViewportEnter={() => { animate(count, value, { duration, ease: "easeOut" }); }}
    >
      0
    </motion.span>
  );
}

function CRMPhoneMockup() {
  return (
    <motion.div
      className="relative mx-auto w-[240px] md:w-[270px]"
      whileHover={{ y: -8, rotateY: 3 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <div className="absolute -inset-8 rounded-[4rem] bg-cyan-500/10 blur-3xl -z-10 animate-pulse" />

      <div className="rounded-[2.5rem] border-[5px] border-white/15 bg-[hsl(220,30%,10%)] shadow-[0_25px_60px_-15px_rgba(6,182,212,0.2)] overflow-hidden">
        <div className="flex justify-center pt-2 pb-1 bg-white/5">
          <div className="w-20 h-5 rounded-full bg-white/10" />
        </div>

        <div className="h-[370px] md:h-[400px] bg-gradient-to-b from-cyan-500/8 via-[hsl(220,30%,10%)] to-[hsl(220,30%,10%)] p-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[8px] text-white/40 font-medium tracking-wide uppercase">CRM Estratégico</p>
              <p className="text-[11px] font-bold text-white">Diagnóstico</p>
            </div>
            <motion.div
              className="h-7 w-7 rounded-full bg-cyan-500/15 flex items-center justify-center"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
            </motion.div>
          </div>

          <motion.div
            className="rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 p-3.5 text-white shadow-lg"
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
            <div className="w-full h-2 bg-white/20 rounded-full mt-2 overflow-hidden">
              <motion.div
                className="h-full bg-white/70 rounded-full"
                initial={{ width: "0%" }}
                whileInView={{ width: "78%" }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
              />
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Ativos", value: "342", icon: Users, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
              { label: "Em risco", value: "28", icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
              { label: "Perdidos", value: "15", icon: UserX, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
              { label: "Potenciais", value: "67", icon: Target, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
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
                <p className="text-[7px] text-white/40 font-medium">{s.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="space-y-1.5 mt-auto">
            <p className="text-[8px] font-semibold text-white/40 flex items-center gap-1">
              <AlertTriangle className="h-2.5 w-2.5 text-amber-400" />
              Clientes em risco
            </p>
            {[
              { name: "Ana Costa", days: "45 dias sem compra" },
              { name: "Carlos Lima", days: "38 dias" },
            ].map((c, idx) => (
              <motion.div
                key={c.name}
                className="flex items-center gap-2 rounded-xl bg-red-500/5 border border-red-500/10 px-2.5 py-2"
                initial={{ x: 20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 + idx * 0.15, duration: 0.4 }}
              >
                <div className="h-5 w-5 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <UserX className="h-2.5 w-2.5 text-red-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-semibold text-white">{c.name}</p>
                  <p className="text-[7px] text-white/40">{c.days}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex justify-center py-2 bg-white/5">
          <div className="w-24 h-1 rounded-full bg-white/15" />
        </div>
      </div>
    </motion.div>
  );
}

export default function LandingCRM() {
  return (
    <section id="crm" className="py-24 md:py-32 bg-[hsl(220,30%,7%)] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-cyan-500/3 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-5 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-8">
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-cyan-500/10 text-cyan-400 text-sm font-bold border border-cyan-500/20">
              <Sparkles className="h-4 w-4" />
              100% Integrado ao Sistema de Fidelidade
            </span>
          </motion.div>

          <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-black text-center text-white mb-5 leading-tight">
            CRM Inteligente que{" "}
            <span className="text-cyan-400">recupera clientes</span>
          </motion.h2>

          <motion.p variants={fadeUp} custom={2} className="text-center text-white/50 text-lg md:text-xl max-w-2xl mx-auto mb-6">
            Analise automaticamente sua base, identifique quem parou de comprar e descubra onde focar para crescer.
          </motion.p>

          <motion.div variants={fadeUp} custom={2.5} className="flex justify-center gap-8 md:gap-12 mb-16">
            {[
              { label: "Clientes recuperados", value: 340, suffix: "+" },
              { label: "Receita resgatada", value: 89, suffix: "K" },
              { label: "Taxa de retenção", value: 94, suffix: "%" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-extrabold text-cyan-400">
                  <AnimatedCounter value={stat.value} />
                  {stat.suffix}
                </p>
                <p className="text-xs md:text-sm text-white/40">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          <div className="flex flex-col-reverse lg:flex-row items-center gap-14 lg:gap-20">
            <div className="flex-1 space-y-5">
              {crmFeatures.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  variants={fadeUp}
                  custom={3 + i}
                  className="flex gap-4 items-start rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 hover:border-cyan-500/20 transition-colors"
                >
                  <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                    <feature.icon className="h-7 w-7 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white mb-1.5">{feature.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}

              <motion.div variants={fadeUp} custom={6} className="pt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="rounded-full px-10 py-7 text-base font-bold bg-cyan-500 hover:bg-cyan-400 text-white shadow-[0_8px_30px_-5px_rgba(6,182,212,0.4)] border-0"
                  onClick={() => (window.location.href = "/trial")}
                >
                  Começar com CRM integrado
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-xs text-white/40 self-center">Sem custo extra · Incluso no plano</p>
              </motion.div>
            </div>

            <motion.div variants={scaleIn} custom={3} className="shrink-0">
              <CRMPhoneMockup />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
