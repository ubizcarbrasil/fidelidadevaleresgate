import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { LandingFaqItem } from "@/features/produtos_comerciais/types/tipos_produto";

interface Props {
  faq: LandingFaqItem[];
  primaryColor?: string;
}

export default function BlocoFaq({ faq, primaryColor }: Props) {
  const items = (faq ?? []).filter((f) => f.question && f.answer);
  if (items.length === 0) return null;

  return (
    <section className="px-4 py-12 sm:py-16 bg-muted/30">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2
            className="text-2xl sm:text-3xl font-extrabold tracking-tight"
            style={primaryColor ? { color: primaryColor } : undefined}
          >
            Perguntas frequentes
          </h2>
          <p className="text-sm text-muted-foreground">
            Tudo que você precisa saber antes de começar.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {items.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-sm font-semibold">
                {f.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {f.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
