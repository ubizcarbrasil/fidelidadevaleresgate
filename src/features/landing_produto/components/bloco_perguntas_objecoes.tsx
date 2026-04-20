import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { LandingFaqItem } from "@/features/produtos_comerciais/types/tipos_produto";

interface Props {
  faq: LandingFaqItem[];
  trialDays: number;
  primaryColor: string;
}

export default function BlocoPerguntasObjecoes({ faq, trialDays, primaryColor }: Props) {
  const adminFaq = (faq ?? []).filter((f) => f.question && f.answer);

  // Perguntas-âncora SEMPRE presentes (objeções comuns)
  const padroes: LandingFaqItem[] = [
    {
      question: "E se eu não gostar?",
      answer: `Você cancela em 1 clique nos primeiros ${trialDays} dias e nada é cobrado. Sem letra miúda.`,
    },
    {
      question: "Preciso instalar algum aplicativo?",
      answer:
        "Não. É 100% web — funciona no celular dos seus motoristas direto pelo navegador. Sem download, sem fricção.",
    },
    {
      question: "Posso cancelar quando quiser?",
      answer:
        "Sim. Sem multa, sem amarras, sem fidelidade. Você cancela direto no painel quando decidir.",
    },
  ];

  // Mescla, evitando duplicar pergunta cadastrada manualmente
  const adminQuestions = new Set(
    adminFaq.map((f) => f.question.trim().toLowerCase()),
  );
  const itens = [
    ...adminFaq,
    ...padroes.filter((p) => !adminQuestions.has(p.question.trim().toLowerCase())),
  ];

  return (
    <section className="px-4 py-12 sm:py-16">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ainda com dúvida?
          </h2>
          <p className="text-sm text-muted-foreground">
            Respondemos as perguntas mais comuns antes de você começar.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {itens.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-sm sm:text-base font-semibold">
                {f.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {f.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <p className="text-center text-xs text-muted-foreground">
          Outra dúvida?{" "}
          <a
            href="mailto:contato@valeresgate.com.br"
            className="font-semibold underline-offset-4 hover:underline"
            style={{ color: primaryColor }}
          >
            Fale com a gente
          </a>
        </p>
      </div>
    </section>
  );
}