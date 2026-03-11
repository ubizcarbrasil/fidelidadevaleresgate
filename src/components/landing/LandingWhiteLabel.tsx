import { motion } from "framer-motion";
import { Palette, Globe, Fingerprint, Store } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" as const },
  }),
};

const features = [
  { icon: Palette, title: "App com sua marca", description: "Logo, cores e identidade visual 100% personalizados. Seus clientes nunca veem 'Vale Resgate'." },
  { icon: Globe, title: "Domínio personalizado", description: "Use seu próprio domínio (ex: fidelidade.suaempresa.com.br) para total profissionalismo." },
  { icon: Fingerprint, title: "Identidade visual completa", description: "Ícones, temas, paletas de cores e tipografia sob medida para cada marca." },
];

function BrandVariationsMockup() {
  const brands = [
    { name: "Fideliza+", from: "from-violet-500", to: "to-violet-700", accent: "bg-violet-500", text: "text-violet-400" },
    { name: "Club Pontos", from: "from-emerald-500", to: "to-emerald-700", accent: "bg-emerald-500", text: "text-emerald-400" },
    { name: "Meu Resgate", from: "from-amber-500", to: "to-amber-700", accent: "bg-amber-500", text: "text-amber-400" },
  ];

  return (
    <div className="flex items-end justify-center gap-3 md:gap-4">
      {brands.map((brand, idx) => {
        const isCenter = idx === 1;
        const scale = isCenter ? "scale-105 z-10" : "scale-95 opacity-70";
        return (
          <div key={brand.name} className={`relative transition-all ${scale}`}>
            <div className={`rounded-[1.4rem] border-[4px] border-white/15 bg-[hsl(160,30%,10%)] shadow-xl overflow-hidden ${isCenter ? "w-[150px] md:w-[170px]" : "w-[120px] md:w-[140px]"}`}>
              <div className="flex justify-center pt-1.5 pb-0.5 bg-white/5">
                <div className="w-10 h-3 rounded-full bg-white/10" />
              </div>
              <div className={`${isCenter ? "h-[200px] md:h-[230px]" : "h-[170px] md:h-[200px]"} p-2.5 flex flex-col gap-2`}>
                <div className="flex items-center gap-1.5">
                  <div className={`h-5 w-5 rounded-md bg-gradient-to-br ${brand.from} ${brand.to} flex items-center justify-center`}>
                    <Store className="h-3 w-3 text-white" />
                  </div>
                  <p className={`text-[9px] font-bold ${brand.text}`}>{brand.name}</p>
                </div>
                <div className={`rounded-lg bg-gradient-to-br ${brand.from} ${brand.to} p-2 text-white`}>
                  <p className="text-[7px] opacity-80">Saldo</p>
                  <p className="text-base font-extrabold">850 pts</p>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {["Ofertas", "Lojas", "Carteira"].map((a) => (
                    <div key={a} className="rounded bg-white/5 border border-white/10 p-1 text-center">
                      <div className={`h-3 w-3 rounded mx-auto mb-0.5 ${brand.accent} opacity-20`} />
                      <p className="text-[6px] text-white/50">{a}</p>
                    </div>
                  ))}
                </div>
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className={`h-5 w-5 rounded ${brand.accent} opacity-15 shrink-0`} />
                    <div className="flex-1 space-y-0.5">
                      <div className="h-1 w-12 rounded bg-white/10" />
                      <div className="h-1 w-8 rounded bg-white/5" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center py-1 bg-white/5">
                <div className="w-12 h-0.5 rounded-full bg-white/15" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function LandingWhiteLabel() {
  return (
    <section id="marca-propria" className="py-20 md:py-28 bg-[hsl(160,30%,8%)] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tl from-emerald-500/5 via-transparent to-violet-500/5 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-5 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="max-w-6xl mx-auto">
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-5xl font-black text-center text-white mb-4">
            Sua marca, seu app,{" "}
            <span className="text-emerald-400">seu domínio</span>
          </motion.h2>

          <motion.p variants={fadeUp} custom={1} className="text-center text-white/50 text-lg max-w-2xl mx-auto mb-6">
            Modelo 100% White-Label. Seus clientes veem <strong className="text-white">apenas a sua marca</strong> — sem logos de terceiros.
          </motion.p>

          <motion.p variants={fadeUp} custom={1.5} className="text-center text-white/40 text-sm max-w-xl mx-auto mb-14">
            O empreendedor configura cores, logos, ícones e domínio. O resultado é um app profissional com identidade própria.
          </motion.p>

          <motion.div variants={fadeUp} custom={2} className="mb-16">
            <BrandVariationsMockup />
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div key={feature.title} variants={fadeUp} custom={3 + i} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 text-center hover:border-emerald-500/20 transition-colors">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="font-bold text-lg text-white mb-2">{feature.title}</h3>
                <p className="text-white/50 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
