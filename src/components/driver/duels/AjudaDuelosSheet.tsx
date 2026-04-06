import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Swords, Target, UserCheck, UserX, Hash, Radio, Trophy, Crown, EyeOff, HelpCircle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const secoes = [
  {
    id: "como-funciona",
    icone: Swords,
    titulo: "Como funciona o duelo?",
    conteudo:
      "Um duelo é uma competição amigável entre dois motoristas da mesma cidade. Vocês competem para ver quem completa mais corridas dentro de um período definido. Apenas corridas finalizadas são contabilizadas.",
  },
  {
    id: "como-desafiar",
    icone: Target,
    titulo: "Como desafiar alguém?",
    conteudo:
      "Ative a participação nos duelos, toque em 'Desafiar' e escolha um adversário da lista de motoristas disponíveis. Defina o período do duelo (mínimo 24h) e envie o desafio. O adversário receberá uma notificação.",
  },
  {
    id: "aceitar-recusar",
    icone: UserCheck,
    titulo: "Aceitar ou recusar desafio",
    conteudo:
      "Quando alguém te desafiar, você verá o convite na seção 'Desafios Recebidos'. Você pode aceitar (o duelo começa imediatamente) ou recusar (sem nenhuma penalidade). Recusar não afeta seu ranking nem reputação.",
  },
  {
    id: "contagem-corridas",
    icone: Hash,
    titulo: "Como são contadas as corridas?",
    conteudo:
      "Apenas corridas com status FINALIZED realizadas dentro do período do duelo são contabilizadas. Corridas canceladas, em andamento ou fora do período não entram na contagem. O sistema é 100% automático.",
  },
  {
    id: "acompanhamento-vivo",
    icone: Radio,
    titulo: "Acompanhamento ao vivo",
    conteudo:
      "Durante o duelo, o placar é atualizado automaticamente a cada 30 segundos. Você pode acompanhar em tempo real quem está na frente. Badges de liderança mostram quem está vencendo no momento.",
  },
  {
    id: "ranking",
    icone: Trophy,
    titulo: "Ranking da cidade",
    conteudo:
      "O ranking mostra os motoristas mais ativos da cidade, classificados por corridas ou pontos. Ele é atualizado automaticamente e visível para todos os participantes. Dispute as primeiras posições!",
  },
  {
    id: "cinturao",
    icone: Crown,
    titulo: "Cinturão da cidade",
    conteudo:
      "O cinturão é o título máximo! O motorista com o melhor desempenho conquista o cinturão da cidade e ganha destaque especial. O título pode mudar de mãos quando alguém superar o recorde.",
  },
  {
    id: "privacidade",
    icone: EyeOff,
    titulo: "Privacidade e anonimato",
    conteudo:
      "Sua privacidade é total. Você compete usando um apelido público — seu nome real nunca é exibido. Nenhum dado de rota, valor de corrida ou informação pessoal é compartilhado. Apenas o total de corridas é visível.",
  },
  {
    id: "faq",
    icone: HelpCircle,
    titulo: "Dúvidas frequentes",
    conteudo:
      "• E se der empate? → Ambos são considerados vencedores.\n• Posso ter vários duelos ao mesmo tempo? → Sim, até o limite da cidade (geralmente 3).\n• Recusar prejudica meu ranking? → Não, recusar não tem penalidade.\n• Posso mudar meu apelido? → Sim, a qualquer momento no seu perfil.\n• Desativar a participação cancela duelos ativos? → Não, duelos em andamento continuam normalmente.",
  },
];

export default function AjudaDuelosSheet({ open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Swords className="h-5 w-5 text-primary" />
            Como funcionam os Duelos
          </SheetTitle>
        </SheetHeader>

        <Accordion type="single" collapsible className="w-full">
          {secoes.map((s) => {
            const Icone = s.icone;
            return (
              <AccordionItem key={s.id} value={s.id}>
                <AccordionTrigger className="text-sm py-3 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <Icone className="h-4 w-4 text-primary shrink-0" />
                    {s.titulo}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                  {s.conteudo}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </SheetContent>
    </Sheet>
  );
}
