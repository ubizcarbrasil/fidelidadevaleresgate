import { motion } from "framer-motion";

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
      <div className="relative mx-auto w-[240px] md:w-[260px]">
        {/* Phone shell */}
        <div className="rounded-[2rem] border-[6px] border-foreground/80 bg-background shadow-2xl overflow-hidden">
          {/* Notch */}
          <div className="flex justify-center pt-2 pb-1 bg-foreground/5">
            <div className="w-20 h-5 rounded-full bg-foreground/15" />
          </div>
          {/* Screen */}
          <div className="h-[420px] md:h-[440px] overflow-hidden">
            {children}
          </div>
          {/* Home bar */}
          <div className="flex justify-center py-2 bg-foreground/5">
            <div className="w-24 h-1 rounded-full bg-foreground/20" />
          </div>
        </div>
      </div>
      <span className="text-sm font-semibold text-muted-foreground">{label}</span>
    </div>
  );
}

function ScreenHome() {
  return (
    <div className="bg-gradient-to-b from-primary/10 to-background p-4 h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground">Olá,</p>
          <p className="text-sm font-bold text-foreground">Maria Silva</p>
        </div>
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">MS</div>
      </div>

      {/* Balance card */}
      <div className="rounded-xl bg-primary p-4 text-primary-foreground">
        <p className="text-[10px] opacity-80">Seu saldo</p>
        <p className="text-2xl font-extrabold">1.430 pts</p>
        <p className="text-[10px] opacity-70 mt-1">≈ R$ 14,30 em resgates</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2">
        {["Ofertas", "Carteira", "Lojas"].map((a) => (
          <div key={a} className="rounded-lg bg-card border border-border p-2 text-center">
            <div className="h-6 w-6 rounded-md bg-primary/10 mx-auto mb-1" />
            <p className="text-[9px] font-medium text-foreground">{a}</p>
          </div>
        ))}
      </div>

      {/* Recent */}
      <div>
        <p className="text-[10px] font-semibold text-foreground mb-2">Destaques</p>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-lg bg-accent/30 shrink-0" />
            <div className="flex-1">
              <div className="h-2 w-20 rounded bg-foreground/10 mb-1" />
              <div className="h-2 w-14 rounded bg-foreground/5" />
            </div>
            <div className="rounded-full bg-primary/10 px-2 py-0.5">
              <span className="text-[8px] font-bold text-primary">20% OFF</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenOffers() {
  const offers = [
    { name: "Pizzaria do João", discount: "2x1", color: "bg-orange-500/10", badge: "🍕" },
    { name: "Barbearia Style", discount: "30% OFF", color: "bg-blue-500/10", badge: "✂️" },
    { name: "Farmácia Saúde", discount: "R$ 10", color: "bg-green-500/10", badge: "💊" },
    { name: "Café & Cia", discount: "15% OFF", color: "bg-amber-500/10", badge: "☕" },
  ];

  return (
    <div className="bg-background p-4 h-full flex flex-col gap-3">
      <p className="text-sm font-bold text-foreground">Ofertas Disponíveis</p>
      {/* Search */}
      <div className="rounded-lg bg-muted/50 border border-border px-3 py-2">
        <p className="text-[10px] text-muted-foreground">Buscar ofertas...</p>
      </div>
      {/* Offer cards */}
      <div className="flex flex-col gap-2 flex-1">
        {offers.map((o) => (
          <div key={o.name} className="flex items-center gap-3 rounded-xl border border-border p-3 bg-card">
            <div className={`h-10 w-10 rounded-lg ${o.color} flex items-center justify-center text-lg`}>
              {o.badge}
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-semibold text-foreground">{o.name}</p>
              <p className="text-[9px] text-muted-foreground">Válido até 30/03</p>
            </div>
            <div className="rounded-full bg-primary px-2 py-0.5">
              <span className="text-[9px] font-bold text-primary-foreground">{o.discount}</span>
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
    <div className="bg-background p-4 h-full flex flex-col gap-3">
      <p className="text-sm font-bold text-foreground">Minha Carteira</p>
      {/* Balance */}
      <div className="rounded-xl bg-gradient-to-br from-primary to-primary/70 p-4 text-primary-foreground text-center">
        <p className="text-[10px] opacity-80">Saldo disponível</p>
        <p className="text-3xl font-extrabold">1.430</p>
        <p className="text-[10px] opacity-70">pontos</p>
      </div>
      {/* History */}
      <p className="text-[10px] font-semibold text-foreground">Histórico</p>
      <div className="flex flex-col gap-2 flex-1">
        {history.map((h, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border border-border p-2.5 bg-card">
            <p className="text-[10px] text-foreground">{h.desc}</p>
            <span className={`text-[10px] font-bold ${h.positive ? "text-green-600" : "text-destructive"}`}>
              {h.pts}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingAppPreview() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="text-center mb-14">
          <motion.span variants={fadeUp} custom={0} className="inline-flex px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4 border border-primary/20">
            Veja na prática
          </motion.span>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold mb-4">
            O app que seus clientes vão usar
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Totalmente personalizado com a sua marca. Simples, rápido e sem fricção.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 max-w-4xl mx-auto items-start"
        >
          <motion.div variants={fadeUp} custom={3}>
            <PhoneFrame label="Tela Inicial">
              <ScreenHome />
            </PhoneFrame>
          </motion.div>
          <motion.div variants={fadeUp} custom={4}>
            <PhoneFrame label="Ofertas">
              <ScreenOffers />
            </PhoneFrame>
          </motion.div>
          <motion.div variants={fadeUp} custom={5}>
            <PhoneFrame label="Carteira">
              <ScreenWallet />
            </PhoneFrame>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
