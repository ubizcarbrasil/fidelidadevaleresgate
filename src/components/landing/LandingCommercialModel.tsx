import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Handshake, DollarSign, Percent, Gift } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const modelItems = [
  {
    icon: Handshake,
    title: "Rede de parceiros locais",
    desc: "Lojas e restaurantes da sua cidade oferecem vantagens aos seus passageiros. Cada parceiro paga uma taxa por ponto resgatado — o custo não é seu.",
  },
  {
    icon: DollarSign,
    title: "Custo zero de desconto",
    desc: "Você não dá desconto. Quem financia o resgate é o parceiro que quer atrair novos clientes. Sua margem fica intacta.",
  },
  {
    icon: Percent,
    title: "Receita por transação",
    desc: "A cada resgate, a plataforma cobra uma taxa do parceiro. Você pode participar dessa receita conforme o modelo negociado.",
  },
  {
    icon: Gift,
    title: "O passageiro ganha de verdade",
    desc: "Pontos acumulados viram resgates reais: pizza, corte de cabelo, produtos. Benefício tangível que traz o cliente de volta.",
  },
];

export default function LandingCommercialModel() {
  return (
    <section id="modelo-comercial" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="text-center mb-14">
          <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Modelo Comercial
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold mb-4">
            Como o Vale Resgate gera valor sem custo para você
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Um modelo em que todos ganham: o passageiro fideliza, o parceiro atrai clientes e você retém sem gastar com desconto.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {modelItems.map((item, i) => (
            <motion.div key={item.title} variants={fadeUp} custom={i + 3}>
              <Card className="h-full hover:shadow-md transition-shadow border-border/50">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
