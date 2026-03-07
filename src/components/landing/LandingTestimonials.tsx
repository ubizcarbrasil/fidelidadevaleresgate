import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" as const },
  }),
};

const testimonials = [
  {
    name: "Carlos Mendes",
    role: "Dono de frota — 12 veículos",
    text: "Em 2 meses, a recorrência dos meus passageiros subiu 40%. Eles voltam por causa dos pontos, não por desconto.",
    initials: "CM",
  },
  {
    name: "Ana Beatriz",
    role: "Cooperativa de transporte",
    text: "Montei o programa em 1 dia e os parceiros adoraram entrar. Hoje tenho 15 lojas oferecendo resgates pros meus clientes.",
    initials: "AB",
  },
  {
    name: "Roberto Lima",
    role: "Motorista autônomo",
    text: "Meus passageiros me indicam pra amigos por causa do programa de pontos. Nunca tive isso antes com desconto.",
    initials: "RL",
  },
];

export default function LandingTestimonials() {
  return (
    <section className="py-20 md:py-28 bg-card/50">
      <div className="container mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="text-center mb-14">
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold mb-4">
            Quem usa, recomenda
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-lg">
            Veja o que empreendedores como você estão dizendo.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              variants={fadeUp}
              custom={i + 2}
              className="relative rounded-2xl border border-border bg-background p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <Quote className="h-8 w-8 text-primary/20 absolute top-4 right-4" />
              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
              <div className="flex gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-3.5 w-3.5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">"{t.text}"</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
