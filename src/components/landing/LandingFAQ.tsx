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
    q: "Eu vou 'dar desconto'?",
    a: "Não. O resgate é financiado pelos parceiros da rede, não por você. Sua margem fica intacta. O cliente acumula pontos e resgata em lojas que querem atrair novos clientes.",
  },
  {
    q: "Como funciona o fluxo para o cliente?",
    a: "O cliente acumula pontos a cada corrida ou compra. Esses pontos podem ser resgatados em parceiros locais (pizzarias, barbearias, lojas etc.) via QR Code, tudo de forma simples e rápida.",
  },
  {
    q: "Como o cliente pontua?",
    a: "Os pontos podem ser concedidos automaticamente (via integração) ou manualmente (pelo operador no caixa). A regra de pontuação é configurável por você.",
  },
  {
    q: "Quanto custa para minha empresa?",
    a: "A plataforma oferece 30 dias de teste grátis, sem cartão de crédito. Após o período de teste, os planos são acessíveis e baseados no volume de uso.",
  },
  {
    q: "O que eu preciso para começar?",
    a: "Apenas um cadastro rápido. Não precisa de site, app ou conhecimento técnico. A plataforma é no-code e você configura tudo em minutos.",
  },
  {
    q: "Eu consigo controlar dia e horário da oferta?",
    a: "Sim. Você define dias da semana, horários de funcionamento, limites por cliente e por período. Total controle sobre quando e como os resgates acontecem.",
  },
  {
    q: "Como funciona o resgate no caixa?",
    a: "O cliente apresenta um QR Code ou código no caixa. O operador confirma e o saldo é debitado automaticamente. Simples e sem fricção.",
  },
  {
    q: "Em quais produtos o resgate pode ser usado?",
    a: "Você define. Pode ser em qualquer produto, em categorias específicas ou em itens selecionados. As regras são totalmente configuráveis.",
  },
  {
    q: "Minha loja precisa ter integração/PDV?",
    a: "Não é obrigatório. O sistema funciona de forma manual ou com integração. A escolha é sua conforme a necessidade do seu negócio.",
  },
  {
    q: "A plataforma divulga minha loja para a base?",
    a: "Sim! Sua loja aparece na vitrine do app para toda a base de clientes da rede, aumentando sua visibilidade sem custo adicional de marketing.",
  },
  {
    q: "Como evitar fraudes?",
    a: "O sistema possui validações automáticas, limites configuráveis e registro completo de todas as transações. Você tem controle e auditoria total.",
  },
  {
    q: "Eu vou ter relatório do que aconteceu?",
    a: "Sim. Relatórios completos de resgates, ticket médio, horários de pico, taxa de retorno e ROI da campanha. Tudo em tempo real no painel.",
  },
  {
    q: "O teste de 30 dias é realmente grátis?",
    a: "Sim, 100% grátis. Sem cartão de crédito, sem pegadinhas. Você tem acesso completo à plataforma para configurar e testar com seus clientes reais.",
  },
  {
    q: "Em quanto tempo minha oferta entra no ar?",
    a: "Em minutos. Após o cadastro, você configura sua oferta e ela já fica disponível para os clientes na vitrine do app.",
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
            Tudo que você precisa saber para se tornar um parceiro.
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
