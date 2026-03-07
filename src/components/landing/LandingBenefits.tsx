import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Star, HeadphonesIcon, Smartphone } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const benefits = [
  {
    icon: Star,
    label: "Pontos que retém os clientes de verdade",
    title: "Fidelização que gera resultados",
    desc: "O sistema de pontos em rede é uma das estratégias mais eficazes para reter clientes e reduzir seu ciclo de recompra. Ao oferecer recompensas diretas em parceiros, você cria uma conexão mais forte com seus passageiros.",
  },
  {
    icon: HeadphonesIcon,
    label: "Suporte total em todos os momentos",
    title: "Maximize suas corridas",
    desc: "Nossa solução é robusta, fácil de implementar e simples de usar. Sua equipe não encontrará obstáculos para fidelizar clientes. Garantimos que você terá mais recorrência sem aumentar a complexidade da operação.",
  },
  {
    icon: Smartphone,
    label: "App fácil de usar",
    title: "Os pontos na palma da mão dos seus clientes",
    desc: "Nosso sistema permite que o passageiro tenha acesso ao saldo de pontos, extrato de movimentações e detalhes importantes sobre os resgates disponíveis. Tudo via WhatsApp.",
  },
];

export default function LandingBenefits() {
  return (
    <section id="beneficios" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="text-center mb-14">
          <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Fidelização sem destruir margem
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold mb-4">
            Simplifique a rotina, fidelize clientes e cresça com o Vale Resgate
          </motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {benefits.map((b, i) => (
            <motion.div key={b.title} variants={fadeUp} custom={i + 2}>
              <Card className="h-full hover:shadow-md transition-shadow border-border/50">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <b.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">{b.label}</p>
                  <h3 className="font-semibold text-lg mb-3">{b.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{b.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
