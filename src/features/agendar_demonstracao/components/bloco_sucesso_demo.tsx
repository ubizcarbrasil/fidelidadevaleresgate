import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, MessageSquare, Calendar, FileText, Phone } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  productName: string;
  voltarUrl: string;
  canalEscolhido: string;
  primaryColor: string;
}

const PROXIMOS_PASSOS = [
  { Icon: Phone, title: "Contato inicial", desc: "Nosso time comercial entra em contato em até 1 dia útil" },
  { Icon: Calendar, title: "Agendamento", desc: "Você escolhe um horário que se encaixa na sua agenda" },
  { Icon: MessageSquare, title: "Demonstração de 30 min", desc: "Apresentação ao vivo do produto com dados reais" },
  { Icon: FileText, title: "Proposta personalizada", desc: "Recebe uma proposta sob medida para sua operação" },
];

const LABEL_CANAL: Record<string, string> = {
  whatsapp: "WhatsApp",
  email: "e-mail",
  ligacao: "ligação",
};

export default function BlocoSucessoDemo({
  productName,
  voltarUrl,
  canalEscolhido,
  primaryColor,
}: Props) {
  const canalLabel = LABEL_CANAL[canalEscolhido] || "WhatsApp";

  return (
    <Card className="overflow-hidden border-2" style={{ borderColor: `${primaryColor}33` }}>
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}66)` }} />
      <CardContent className="p-8 sm:p-12 text-center space-y-6">
        <div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: `${primaryColor}22` }}
        >
          <CheckCircle2 className="h-12 w-12" style={{ color: primaryColor }} />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Demonstração solicitada com sucesso
          </h2>
          <p className="text-base text-muted-foreground max-w-md mx-auto">
            Recebemos sua solicitação de demo do <strong className="text-foreground">{productName}</strong>. Nosso time comercial entrará em contato em até <strong className="text-foreground">1 dia útil</strong> via <strong className="text-foreground">{canalLabel}</strong>.
          </p>
        </div>

        <div className="border-t pt-6 text-left max-w-md mx-auto space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-center" style={{ color: primaryColor }}>
            Próximos passos
          </p>
          <ol className="space-y-3">
            {PROXIMOS_PASSOS.map(({ Icon, title, desc }, i) => (
              <li key={title} className="flex items-start gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 text-xs font-bold"
                  style={{ backgroundColor: `${primaryColor}22`, color: primaryColor }}
                >
                  {i + 1}
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                    {title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
          <Button asChild variant="outline" className="gap-2">
            <Link to={voltarUrl}>
              <ArrowRight className="h-4 w-4" />
              Voltar à página do produto
            </Link>
          </Button>
          <Button asChild variant="ghost" className="gap-2">
            <Link to="/produtos">Ver outros produtos</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}