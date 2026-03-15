import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" as const },
  }),
};

function PhoneFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative mx-auto w-[220px] md:w-[250px]">
        <div className="rounded-[2rem] border-[5px] border-white/20 bg-[hsl(220,30%,10%)] shadow-2xl overflow-hidden">
          <div className="flex justify-center pt-2 pb-1 bg-white/5">
            <div className="w-16 h-4 rounded-full bg-white/10" />
          </div>
          <div className="h-[380px] md:h-[400px] overflow-hidden">{children}</div>
          <div className="flex justify-center py-2 bg-white/5">
            <div className="w-20 h-1 rounded-full bg-white/15" />
          </div>
        </div>
        <div className="absolute -inset-4 bg-cyan-500/5 rounded-[3rem] blur-2xl -z-10" />
      </div>
      <span className="text-sm font-semibold text-white/40">{label}</span>
    </div>
  );
}

function ScreenHome() {
  return (
    <div className="bg-gradient-to-b from-cyan-500/10 to-[hsl(220,30%,10%)] p-4 h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-white/50">Olá,</p>
          <p className="text-sm font-bold text-white">Maria Silva</p>
        </div>
        <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">MS</div>
      </div>
      <div className="rounded-xl bg-cyan-500 p-4 text-white">
        <p className="text-[10px] opacity-80">Seu saldo</p>
        <p className="text-2xl font-extrabold">1.430 pts</p>
        <p className="text-[10px] opacity-70 mt-1">≈ R$ 14,30 em resgates</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["Ofertas", "Carteira", "Lojas"].map((a) => (
          <div key={a} className="rounded-lg bg-white/5 border border-white/10 p-2 text-center">
            <div className="h-5 w-5 rounded-md bg-cyan-500/15 mx-auto mb-1" />
            <p className="text-[9px] font-medium text-white/70">{a}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="text-[10px] font-semibold text-white/60 mb-2">Destaques</p>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-lg bg-cyan-500/10 shrink-0" />
            <div className="flex-1">
              <div className="h-2 w-16 rounded bg-white/10 mb-1" />
              <div className="h-2 w-10 rounded bg-white/5" />
            </div>
            <div className="rounded-full bg-cyan-500/15 px-2 py-0.5">
              <span className="text-[8px] font-bold text-cyan-400">20% OFF</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenOffers() {
  const offers = [
    { name: "Pizzaria do João", discount: "2x1", badge: "🍕" },
    { name: "Barbearia Style", discount: "30% OFF", badge: "✂️" },
    { name: "Farmácia Saúde", discount: "R$ 10", badge: "💊" },
    { name: "Café & Cia", discount: "15% OFF", badge: "☕" },
  ];
  return (
    <div className="bg-[hsl(220,30%,10%)] p-4 h-full flex flex-col gap-3">
      <p className="text-sm font-bold text-white">Ofertas Disponíveis</p>
      <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
        <p className="text-[10px] text-white/40">Buscar ofertas...</p>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        {offers.map((o) => (
          <div key={o.name} className="flex items-center gap-3 rounded-xl border border-white/10 p-3 bg-white/[0.03]">
            <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center text-lg">{o.badge}</div>
            <div className="flex-1">
              <p className="text-[11px] font-semibold text-white">{o.name}</p>
              <p className="text-[9px] text-white/40">Válido até 30/03</p>
            </div>
            <div className="rounded-full bg-cyan-500 px-2 py-0.5">
              <span className="text-[9px] font-bold text-white">{o.discount}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenWallet() {
  const history = [
    { desc: "Compra — Pizzaria do João", pts: "+120 pts", positive: true },
    { desc: "Resgate — Barbearia Style", pts: "-80 pts", positive: false },
    { desc: "Compra — Café & Cia", pts: "+45 pts", positive: true },
    { desc: "Bônus de cadastro", pts: "+200 pts", positive: true },
  ];
  return (
    <div className="bg-[hsl(220,30%,10%)] p-4 h-full flex flex-col gap-3">
      <p className="text-sm font-bold text-white">Minha Carteira</p>
      <div className="rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 p-4 text-white text-center">
        <p className="text-[10px] opacity-80">Saldo disponível</p>
        <p className="text-3xl font-extrabold">1.430</p>
        <p className="text-[10px] opacity-70">pontos</p>
      </div>
      <p className="text-[10px] font-semibold text-white/60">Histórico</p>
      <div className="flex flex-col gap-2 flex-1">
        {history.map((h, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border border-white/10 p-2.5 bg-white/[0.03]">
            <p className="text-[10px] text-white/70">{h.desc}</p>
            <span className={`text-[10px] font-bold ${h.positive ? "text-cyan-400" : "text-red-400"}`}>{h.pts}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingAppPreview() {
  return (
    <section className="py-20 md:py-28 bg-[hsl(220,30%,9%)] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[80px]" />

      <div className="max-w-6xl mx-auto px-5 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="text-center mb-14">
          <motion.span variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold mb-4 border border-cyan-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            Veja na prática
          </motion.span>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-black text-white mb-4">
            O app que seus clientes vão usar
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-white/50 text-lg max-w-2xl mx-auto">
            Totalmente personalizado com a sua marca. Simples, rápido e sem fricção.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 max-w-4xl mx-auto items-start">
          <motion.div variants={fadeUp} custom={3}>
            <PhoneFrame label="Tela Inicial"><ScreenHome /></PhoneFrame>
          </motion.div>
          <motion.div variants={fadeUp} custom={4}>
            <PhoneFrame label="Ofertas"><ScreenOffers /></PhoneFrame>
          </motion.div>
          <motion.div variants={fadeUp} custom={5}>
            <PhoneFrame label="Carteira"><ScreenWallet /></PhoneFrame>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
