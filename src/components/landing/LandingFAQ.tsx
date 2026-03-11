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
    a: "O Vale Resgate é uma plataforma white-label para criar programas de fidelidade com sua própria marca. Você monta um ecossistema de pontos e resgate com lojas parceiras, sem precisar programar.",
  },
  {
    q: "Preciso saber programar?",
    a: "Não. A plataforma é 100% no-code. Você configura marca, cores, regras de pontuação, ofertas e parceiros em poucos cliques.",
  },
  {
    q: "O que significa White-Label?",
    a: "Significa que seus clientes veem apenas a sua marca — logo, cores, domínio e identidade visual. O Vale Resgate fica invisível para o usuário final.",
  },
  {
    q: "Como funciona a rede de parceiros?",
    a: "Você convida lojas para participarem da sua rede. Elas aceitam resgate de pontos dos seus clientes e ganham tráfego qualificado. Você controla as regras.",
  },
  {
    q: "Posso usar meu próprio domínio?",
    a: "Sim. Você pode configurar um domínio personalizado (ex: fidelidade.suaempresa.com.br) para total profissionalismo.",
  },
  {
    q: "Quanto custa para começar?",
    a: "Você pode começar com 30 dias de teste grátis, sem cartão de crédito. Após o teste, os planos são flexíveis e baseados no tamanho da sua rede.",
  },
  {
    q: "Como os clientes acumulam pontos?",
    a: "Os pontos podem ser concedidos automaticamente (via integração) ou manualmente (pelo operador). A regra de pontuação é totalmente configurável.",
  },
  {
    q: "O CRM está incluso?",
    a: "Sim. O CRM integrado identifica automaticamente clientes perdidos, potenciais e em risco. Você também pode criar campanhas de reativação.",
  },
  {
    q: "Posso ter mais de uma marca?",
    a: "Sim. O plano Enterprise suporta multi-marca e multi-tenant, ideal para operações com várias bandeiras ou franquias.",
  },
  {
    q: "Como funciona o resgate no caixa?",
    a: "O cliente apresenta um QR Code ou código no caixa. O operador confirma e o saldo é debitado automaticamente. Simples e sem fricção.",
  },
  {
    q: "Vocês têm API para integrações?",
    a: "Sim. A API completa permite integrar com PDVs, ERPs, apps e qualquer sistema externo. Documentação disponível no painel.",
  },
  {
    q: "O teste de 30 dias é realmente grátis?",
    a: "Sim, 100% grátis. Sem cartão de crédito, sem pegadinhas. Acesso completo para configurar e testar com clientes reais.",
  },
];

export default function LandingFAQ() {
  return (
    <section id="faq" className="py-20 md:py-28 bg-[hsl(160,30%,8%)]">
      <div className="max-w-3xl mx-auto px-5">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="text-center mb-14">
          <motion.span variants={fadeUp} custom={0} className="inline-flex px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-4 border border-emerald-500/20">
            Dúvidas frequentes
          </motion.span>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-black text-white mb-4">
            Perguntas & Respostas
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-white/50 text-lg">
            Tudo que você precisa saber sobre a plataforma.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          <motion.div variants={fadeUp} custom={3}>
            <Accordion type="single" collapsible className="w-full space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 data-[state=open]:border-emerald-500/20 data-[state=open]:bg-white/[0.04] transition-colors"
                >
                  <AccordionTrigger className="text-left text-base text-white hover:no-underline hover:text-emerald-400 transition-colors py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-white/50 leading-relaxed pb-4">
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
