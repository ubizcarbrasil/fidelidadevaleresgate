import { motion } from "framer-motion";
import { ShoppingCart, TrendingDown, BarChart3, Clock, Heart, FileText } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const benefits = [
  {
    icon: ShoppingCart,
    title: "Mais clientes no caixa",
    desc: "Tráfego qualificado com intenção real de compra. Clientes vêm porque têm saldo para gastar.",
  },
  {
    icon: TrendingDown,
    title: "Menor custo de aquisição",
    desc: "CAC muito mais baixo que anúncios tradicionais. Sem desperdício com quem não vai comprar.",
  },
  {
    icon: BarChart3,
    title: "Vendas incrementais",
    desc: "Cliente vem porque 'tem pontos' e sempre compra mais do que o saldo disponível.",
  },
  {
    icon: Clock,
    title: "Controle total",
    desc: "Você define dia, horário, limite e oferta. Ative nos horários fracos e transforme em fluxo no caixa.",
  },
  {
    icon: Heart,
    title: "Fidelização real",
    desc: "Cliente volta para usar o saldo e cria hábito de comprar na sua loja. Recorrência automática.",
  },
  {
    icon: FileText,
    title: "Relatórios completos",
    desc: "Acompanhe resgates, ticket médio, horários de pico e ROI da campanha em tempo real.",
  },
];

export default function LandingBenefits() {
  return (
    <section id="beneficios" className="py-20 md:py-28 bg-[hsl(160,30%,8%)] relative">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />

      <div className="max-w-6xl mx-auto px-5 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="text-center mb-14">
          <motion.span variants={fadeUp} custom={0} className="inline-flex px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-4 border border-emerald-500/20">
            Por que participar?
          </motion.span>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-black text-white mb-4">
            Benefícios reais para sua loja
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-white/50 text-lg max-w-xl mx-auto">
            Não é desconto. É uma estratégia inteligente de aquisição e fidelização de clientes.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              variants={fadeUp}
              custom={i + 3}
              className="group rounded-2xl p-6 bg-white/[0.03] border border-white/[0.06] hover:border-emerald-500/20 hover:bg-white/[0.05] transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/15 transition-colors">
                <b.icon className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">{b.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
