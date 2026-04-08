import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Swords, Target, UserCheck, Hash, Radio, Trophy, Crown,
  EyeOff, HelpCircle, Handshake, Wallet, Gift, Star, Rss, Eye
} from "lucide-react";

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
      "Um duelo é uma competição amigável entre dois motoristas da mesma cidade. Vocês competem para ver quem completa mais corridas dentro de um período definido. Apenas corridas finalizadas (status FINALIZED) são contabilizadas. O duelo pode incluir uma aposta opcional de pontos — quem perder transfere os pontos ao vencedor.",
  },
  {
    id: "como-desafiar",
    icone: Target,
    titulo: "Como desafiar alguém?",
    conteudo:
      "Ative a participação nos duelos, toque em 'Desafiar' e escolha um adversário da lista de motoristas disponíveis na sua cidade. Defina o período do duelo (mínimo 24h) e, opcionalmente, proponha uma aposta de pontos. O adversário receberá o convite e poderá aceitar, recusar ou negociar o valor da aposta.",
  },
  {
    id: "negociacao",
    icone: Handshake,
    titulo: "Negociação de pontos",
    conteudo:
      "Ao receber um desafio com aposta, você pode aceitar o valor proposto ou enviar uma contraproposta com um valor diferente. O desafiante então decide se aceita a contraproposta ou cancela o desafio. Quando ambos concordam, os pontos são reservados automaticamente (escrow) — garantindo que o pagamento será feito ao vencedor.",
  },
  {
    id: "aceitar-recusar",
    icone: UserCheck,
    titulo: "Aceitar ou recusar desafio",
    conteudo:
      "Quando alguém te desafiar, você verá o convite na seção 'Desafios Recebidos'. Ao aceitar, o duelo começa imediatamente e seus pontos apostados ficam reservados. Ao recusar, nada acontece — sem penalidade no ranking ou reputação. Se houver aposta, você verá um aviso de risco antes de confirmar.",
  },
  {
    id: "contagem-corridas",
    icone: Hash,
    titulo: "Como são contadas as corridas?",
    conteudo:
      "Apenas corridas com status FINALIZED realizadas dentro do período do duelo são contabilizadas. Corridas canceladas, em andamento ou fora do período não entram na contagem. O sistema é 100% automático — não é possível adicionar corridas manualmente.",
  },
  {
    id: "arena-ao-vivo",
    icone: Radio,
    titulo: "Arena ao vivo",
    conteudo:
      "Durante o duelo, o placar é atualizado automaticamente a cada 30 segundos. Você e qualquer motorista da cidade podem acompanhar em tempo real quem está na frente. Badges de liderança mostram quem está vencendo. A arena também exibe os palpites da torcida e as apostas paralelas abertas.",
  },
  {
    id: "apostas-espectadores",
    icone: Wallet,
    titulo: "Apostas entre espectadores",
    conteudo:
      "Motoristas que não estão no duelo podem apostar pontos no resultado! É um sistema P2P (pessoa a pessoa): você cria uma aposta escolhendo em quem acredita e o valor. Outro motorista pode aceitar sua aposta ou enviar uma contraproposta de valor. Quando dois apostadores fecham acordo, os pontos são reservados em escrow.\n\nApós o duelo:\n• 90% do total vai para o apostador que acertou o vencedor\n• 10% vai como bônus para o motorista que venceu o duelo\n• Em caso de empate, todos os pontos são devolvidos integralmente",
  },
  {
    id: "bonus-vencedor",
    icone: Gift,
    titulo: "Bônus 10% para o vencedor do duelo",
    conteudo:
      "Além de ganhar os pontos da aposta direta do duelo, o motorista vencedor recebe 10% de todas as apostas paralelas feitas por espectadores naquele duelo. Quanto mais apostas a torcida fizer, maior o prêmio extra! Esse bônus é creditado automaticamente ao final do duelo.",
  },
  {
    id: "ranking",
    icone: Trophy,
    titulo: "Ranking da cidade",
    conteudo:
      "O ranking mostra os motoristas mais ativos da cidade, classificados por corridas finalizadas ou pontos acumulados. Ele é atualizado automaticamente e visível para todos os participantes. Dispute as primeiras posições e ganhe destaque na comunidade!",
  },
  {
    id: "cinturao",
    icone: Crown,
    titulo: "Cinturão da cidade",
    conteudo:
      "O cinturão é o título máximo! O motorista com o melhor desempenho conquista o cinturão da cidade e ganha destaque especial com uma badge dourada. O título pode mudar de mãos quando alguém superar o recorde atual. Apenas um motorista por cidade pode ser o campeão.",
  },
  {
    id: "perfil-competitivo",
    icone: Star,
    titulo: "Perfil competitivo",
    conteudo:
      "Cada motorista tem um perfil público com apelido, avatar, estatísticas de duelos (vitórias, derrotas, empates, sequência de vitórias) e conquistas desbloqueadas. As conquistas incluem marcos como 'Primeira Vitória', '5 Vitórias Seguidas', 'Dono do Cinturão' e 'Campeão da Temporada'. Você pode editar seu apelido e avatar a qualquer momento.",
  },
  {
    id: "feed-atividade",
    icone: Rss,
    titulo: "Feed de atividade",
    conteudo:
      "O feed da cidade mostra em tempo real os eventos competitivos: novos desafios, duelos aceitos, resultados de duelos, conquistas desbloqueadas e mudanças no cinturão. É a timeline social da arena — acompanhe tudo que está acontecendo na competição da sua cidade.",
  },
  {
    id: "privacidade",
    icone: EyeOff,
    titulo: "Privacidade e anonimato",
    conteudo:
      "Sua privacidade é total. Você compete usando um apelido público — seu nome real nunca é exibido para outros motoristas. Nenhum dado de rota, endereço, valor de corrida, nome de passageiro ou informação pessoal é compartilhado. Apenas o total de corridas finalizadas e seus pontos são visíveis.",
  },
  {
    id: "faq",
    icone: HelpCircle,
    titulo: "Dúvidas frequentes",
    conteudo:
      "• E se der empate no duelo? → Ambos são considerados vencedores e os pontos apostados são devolvidos.\n• Posso ter vários duelos ao mesmo tempo? → Sim, até o limite da cidade (geralmente 3).\n• Recusar prejudica meu ranking? → Não, recusar não tem penalidade.\n• Posso mudar meu apelido? → Sim, a qualquer momento no seu perfil.\n• Desativar a participação cancela duelos ativos? → Não, duelos em andamento continuam normalmente.\n• E se eu não tiver pontos suficientes? → Você não pode aceitar um duelo com aposta se não tiver saldo. O sistema bloqueia automaticamente.\n• As apostas de espectadores afetam meu saldo? → Só se você participar como apostador. Se você é um dos duelistas, só recebe o bônus de 10%.\n• Onde vejo meus pontos reservados? → No seu perfil, a seção de saldo mostra pontos disponíveis e pontos em escrow (reservados).",
  },
];

export default function AjudaDuelosSheet({ open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Swords className="h-5 w-5 text-primary" />
            Jornada Completa dos Duelos
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
