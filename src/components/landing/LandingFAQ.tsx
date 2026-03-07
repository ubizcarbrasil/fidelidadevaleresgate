import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const faqs = [
  {
    q: "O que é o Vale Resgate?",
    a: "O Vale Resgate é uma plataforma de fidelidade em rede que transforma compras/corridas em pontos que podem ser resgatados em parceiros locais. É um mecanismo de recorrência — não um programa de desconto.",
  },
  {
    q: "Quanto custa para minha empresa?",
    a: "A plataforma oferece 30 dias de teste grátis, sem cartão de crédito. Após o período de teste, os planos são acessíveis e baseados no volume de uso. O custo dos resgates é financiado pelos parceiros, não por você.",
  },
  {
    q: "Preciso ter conhecimento técnico?",
    a: "Não. A plataforma é no-code. Você configura marca, cores, ofertas e parceiros em poucos minutos diretamente no painel. Integração via WhatsApp API já vem inclusa.",
  },
  {
    q: "Como funciona para o passageiro/cliente?",
    a: "O cliente acumula pontos a cada corrida ou compra. Esses pontos podem ser resgatados em parceiros locais (pizzarias, barbearias, lojas etc.) via QR Code, tudo de forma simples e rápida.",
  },
  {
    q: "Quem são os parceiros?",
    a: "São estabelecimentos locais que querem atrair novos clientes. Eles oferecem produtos/serviços como recompensa em troca de visibilidade e tráfego de clientes para seu negócio.",
  },
  {
    q: "E se eu já tiver um programa de fidelidade?",
    a: "O Vale Resgate complementa ou substitui programas tradicionais. A diferença é que o custo do resgate é do parceiro — não da sua empresa. Sua margem fica intacta.",
  },
  {
    q: "O teste de 30 dias é realmente grátis?",
    a: "Sim, 100% grátis. Sem cartão de crédito, sem pegadinhas. Você tem acesso completo à plataforma para configurar e testar com seus clientes reais.",
  },
];

export default function LandingFAQ() {
  return (
    <section id="faq" className="py-20 md:py-28 bg-card/50">
      <div className="container mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="text-center mb-14">
          <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Perguntas Frequentes
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold mb-4">
            FAQ
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="max-w-3xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={2}>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-base">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
