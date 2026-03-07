import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Ghost, AlertTriangle, TrendingDown, Megaphone, Frown, ShieldAlert, ArrowRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const painPoints = [
  { icon: Ghost, title: "Cliente Fantasma", desc: "Seu passageiro usa apenas uma vez e depois nunca mais volta?" },
  { icon: AlertTriangle, title: "Histórico de Amnésia", desc: "Você não tem histórico de corridas e nem períodos de uso do passageiro?" },
  { icon: TrendingDown, title: "Desconto de Fugitivo", desc: "Você dá desconto e seu passageiro usa esse desconto no concorrente?" },
  { icon: Megaphone, title: "Promo-Dependente", desc: "Sua plataforma depende de ações promocionais para ter corridas?" },
  { icon: Frown, title: "Última Opção", desc: "Sua plataforma não é o primeiro app que o passageiro abre?" },
  { icon: ShieldAlert, title: "Concorrente Descolado", desc: "Você sente que a concorrência pode estar na sua frente?" },
];

export default function LandingPainPoints() {
  return (
    <section id="para-quem" className="py-20 md:py-28 bg-card/50">
      <div className="container mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="text-center mb-6">
          <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            A verdade que ninguém fala no setor
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold mb-4">
            Você não perde cliente por preço.
          </motion.h2>
          <motion.h3 variants={fadeUp} custom={2} className="text-xl md:text-2xl text-muted-foreground font-medium mb-4">
            Você perde cliente por falta de motivo para voltar.
          </motion.h3>
          <motion.div variants={fadeUp} custom={3} className="text-muted-foreground max-w-md mx-auto text-left space-y-1 mb-4">
            <p className="font-medium text-foreground">O passageiro:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>usa uma vez</li>
              <li>compara com outro app</li>
              <li>some</li>
              <li>volta só quando alguém dá cupom</li>
            </ul>
          </motion.div>
          <motion.p variants={fadeUp} custom={4} className="text-muted-foreground max-w-xl mx-auto">
            Desconto resolve hoje. Destrói margem amanhã.{" "}
            <span className="text-primary font-semibold">O Vale Resgate muda esse jogo.</span>
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} className="text-center mb-8 mt-10">
          <motion.p variants={fadeUp} custom={5} className="text-lg font-semibold mb-2">
            O Vale Resgate é para mim?
          </motion.p>
          <motion.p variants={fadeUp} custom={6} className="text-sm text-muted-foreground">
            Responda com a gente, você está em alguma dessas situações:
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {painPoints.map((p, i) => (
            <motion.div key={p.title} variants={fadeUp} custom={i + 7}>
              <Card className="h-full hover:shadow-md transition-shadow border-border/50 hover:border-primary/30">
                <CardContent className="p-5">
                  <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center mb-3">
                    <p.icon className="h-5 w-5 text-destructive" />
                  </div>
                  <h3 className="font-semibold text-base mb-1">{p.title}</h3>
                  <p className="text-muted-foreground text-sm">{p.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mt-10">
          <motion.div variants={fadeUp} custom={13}>
            <p className="text-lg font-semibold text-primary mb-4">
              Se você está em alguma situação dessas, o Vale Resgate é pra você!
            </p>
            <Button asChild size="lg" className="rounded-full px-10 py-6 shadow-lg">
              <Link to="/trial">
                Testar grátis por 30 dias <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
