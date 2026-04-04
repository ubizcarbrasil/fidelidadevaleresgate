import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, Send, ClipboardList, Coins, Settings2, Check, ChevronRight, ChevronDown, BookOpen, ScanLine, BarChart3, Tag, ScrollText, Star } from "lucide-react";

interface JourneyStep {
  id: string;
  phase: string;
  phaseIcon: React.ElementType;
  phaseColor: string;
  title: string;
  description: string;
  route: string;
  steps: string[];
  tips?: string[];
}

const journeySteps: JourneyStep[] = [
  {
    id: "1",
    phase: "Fase 1",
    phaseIcon: ShoppingBag,
    phaseColor: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    title: "Entenda o que é ser Emissor",
    description: "Saiba a diferença entre os tipos de parceiro antes de solicitar.",
    route: "/store-panel",
    steps: [
      "Parceiros do tipo 'Receptora' apenas recebem resgates de cupons dos clientes.",
      "Parceiros do tipo 'Emissora' podem pontuar clientes diretamente por compras realizadas.",
      "Parceiros do tipo 'Mista' fazem as duas coisas: recebem resgates e emitem pontos.",
      "Emissores participam do programa de fidelidade ativo, aumentando o engajamento dos clientes.",
      "Antes de solicitar, verifique se o programa de fidelidade está ativo na sua marca.",
    ],
    tips: [
      "A emissão de pontos é uma ferramenta poderosa para fidelizar clientes recorrentes.",
      "Parceiros Mistos são ideais para quem quer oferecer cupons e também pontuar clientes.",
    ],
  },
  {
    id: "2",
    phase: "Fase 2",
    phaseIcon: Send,
    phaseColor: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    title: "Solicitar Ativação como Emissor",
    description: "Envie uma solicitação para o administrador da marca aprovar.",
    route: "/store-panel",
    steps: [
      "Acesse o Painel do Parceiro → aba 'Perfil' ou 'Início'.",
      "Localize o card 'Tornar-se Emissor de Pontos'.",
      "Clique em 'Solicitar Ativação'.",
      "Escolha o tipo desejado: 'Mista' (resgata + emite) ou 'Emissora' (apenas emite).",
      "Preencha a justificativa explicando por que deseja emitir pontos (opcional, mas recomendado).",
      "Clique em 'Enviar Solicitação' e aguarde a análise do administrador.",
    ],
    tips: [
      "Uma justificativa bem escrita aumenta as chances de aprovação rápida.",
      "Você pode acompanhar o andamento da solicitação diretamente no Painel do Parceiro.",
      "Se a solicitação for rejeitada, você pode enviar uma nova com justificativa atualizada.",
    ],
  },
  {
    id: "3",
    phase: "Fase 3",
    phaseIcon: ClipboardList,
    phaseColor: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    title: "Acompanhar o Andamento da Solicitação",
    description: "Veja se sua solicitação está pendente, aprovada ou rejeitada.",
    route: "/store-panel",
    steps: [
      "No Painel do Parceiro, o card de Emissor mostra o andamento atual.",
      "Situação 'Aguardando aprovação': o administrador ainda não analisou.",
      "Situação 'Aprovado': seu tipo foi alterado automaticamente. Você já pode emitir pontos!",
      "Situação 'Rejeitado': veja o motivo e envie uma nova solicitação se desejar.",
    ],
    tips: [
      "O administrador pode levar até 48h para analisar, dependendo da marca.",
      "Após a aprovação, o card de solicitação desaparece e novos recursos ficam disponíveis.",
    ],
  },
  {
    id: "4",
    phase: "Fase 4",
    phaseIcon: Settings2,
    phaseColor: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    title: "Configurar Regra de Pontos Própria",
    description: "Defina quantos pontos seus clientes ganham por compra (se permitido pela marca).",
    route: "/store-panel",
    steps: [
      "Após ser aprovado como Emissor, acesse o Painel do Parceiro → aba 'Pontos'.",
      "Se o administrador permitir regras personalizadas, você verá o formulário de configuração.",
      "Defina a taxa: quantos pontos por R$1 gasto (respeitando os limites da marca).",
      "Preencha o valor de resgate por ponto, se aplicável.",
      "Salve a regra. Ela pode precisar de aprovação do administrador antes de entrar em vigor.",
    ],
    tips: [
      "Se a marca não permitir regras personalizadas, a regra padrão será aplicada automaticamente.",
      "Regras que exigem aprovação ficam com situação 'Pendente' até o administrador aprovar.",
      "Você pode alterar sua regra a qualquer momento — cada alteração gera uma nova solicitação.",
    ],
  },
  {
    id: "5",
    phase: "Fase 5",
    phaseIcon: Coins,
    phaseColor: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
    title: "Pontuar Clientes",
    description: "Emita pontos para clientes após uma compra realizada no estabelecimento.",
    route: "/store-panel",
    steps: [
      "No Painel do Parceiro, acesse a aba 'Pontuar' ou use o Caixa PDV.",
      "Busque o cliente pelo nome, telefone ou código.",
      "Informe o valor da compra realizada.",
      "O sistema calcula automaticamente os pontos com base na regra ativa.",
      "Confirme a emissão. Os pontos são creditados imediatamente na carteira do cliente.",
    ],
    tips: [
      "O cliente pode verificar o saldo de pontos no app, na seção 'Carteira'.",
      "Cada emissão gera um registro no extrato de pontos para consulta.",
      "Se a marca exigir código de recibo, o campo aparecerá automaticamente.",
    ],
  },
  {
    id: "6",
    phase: "Fase 6",
    phaseIcon: ScanLine,
    phaseColor: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    title: "Usar o Caixa PDV",
    description: "Use a interface simplificada para pontuar clientes no caixa.",
    route: "/pdv",
    steps: [
      "Acesse o Caixa PDV pelo menu lateral ou pela rota /pdv.",
      "A tela é otimizada para uso rápido no ponto de venda.",
      "Busque o cliente pelo telefone ou QR code.",
      "Informe o valor da compra e confirme a pontuação.",
      "O cliente recebe os pontos instantaneamente.",
    ],
    tips: [
      "O Caixa PDV funciona bem em tablets e celulares — ideal para balcões.",
      "Treine sua equipe para usar o Caixa PDV: é simples e rápido.",
    ],
  },
  {
    id: "7",
    phase: "Fase 7",
    phaseIcon: ScrollText,
    phaseColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
    title: "Acompanhar o Extrato de Pontos",
    description: "Monitore todas as emissões de pontos do seu estabelecimento.",
    route: "/store-panel",
    steps: [
      "No Painel do Parceiro, acesse a aba 'Extrato'.",
      "Veja todas as emissões realizadas: data, cliente, valor da compra e pontos emitidos.",
      "Use os filtros para buscar por período ou cliente específico.",
      "Identifique padrões: quais clientes compram mais, quais dias têm mais movimento.",
    ],
    tips: [
      "O extrato é uma ferramenta poderosa para entender o comportamento dos seus clientes.",
      "Clientes frequentes podem receber atenção especial — use os dados a seu favor!",
    ],
  },
  {
    id: "8",
    phase: "Fase 8",
    phaseIcon: Tag,
    phaseColor: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
    title: "Combinar Pontos com Ofertas",
    description: "Crie ofertas especiais para clientes que acumulam pontos no seu estabelecimento.",
    route: "/store-panel",
    steps: [
      "No Painel do Parceiro, crie ofertas normalmente pelo assistente de cupons.",
      "Considere criar ofertas exclusivas para clientes fiéis (ex: 'Ganhe 2x pontos às terças').",
      "Combine pontos + cupons para criar promoções irresistíveis.",
      "Monitore o impacto: ofertas + pontos geram mais retorno que cada um isolado.",
    ],
    tips: [
      "Clientes com pontos acumulados voltam mais — ofereça motivos para gastar os pontos no seu estabelecimento.",
      "Promoções sazonais com bônus de pontos aumentam o fluxo em dias fracos.",
    ],
  },
  {
    id: "9",
    phase: "Fase 9",
    phaseIcon: BarChart3,
    phaseColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
    title: "Analisar Resultados",
    description: "Avalie o impacto do programa de fidelidade no seu negócio.",
    route: "/store-panel",
    steps: [
      "Acesse o extrato para ver o volume total de pontos emitidos.",
      "Compare períodos: antes e depois da ativação como emissor.",
      "Identifique seus clientes mais fiéis (maiores acumuladores de pontos).",
      "Avalie se a taxa de pontos está adequada — ajuste se necessário.",
      "Converse com o administrador da marca para sugestões e melhorias.",
    ],
    tips: [
      "Emissores ativos geralmente têm 30-50% mais recorrência de clientes.",
      "Ajuste a regra de pontos trimestralmente para manter o programa atrativo.",
    ],
  },
  {
    id: "10",
    phase: "Fase 10",
    phaseIcon: Star,
    phaseColor: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    title: "Boas Práticas do Emissor",
    description: "Dicas finais para maximizar o sucesso como emissor de pontos.",
    route: "/store-panel",
    steps: [
      "Sempre informe o cliente que ele está ganhando pontos — isso gera satisfação imediata.",
      "Coloque um aviso visível no estabelecimento: 'Aqui você acumula pontos!'.",
      "Treine todos os funcionários para pontuar clientes corretamente.",
      "Monitore o extrato semanalmente para detectar possíveis problemas.",
      "Mantenha contato com o administrador da marca para alinhamento estratégico.",
    ],
    tips: [
      "A transparência com o cliente é a chave: mostre o saldo de pontos sempre que possível.",
      "Parceiros engajados no programa de fidelidade são prioridade para destaque na vitrine do app.",
      "Quanto mais pontos seus clientes acumulam, mais eles voltam!",
    ],
  },
];

export default function EmitterJourneyGuidePage() {
  const navigate = useNavigate();
  const [expandedStep, setExpandedStep] = useState<string | null>("1");
  const toggleStep = (id: string) => {
    setExpandedStep(expandedStep === id ? null : id);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Guia do Emissor de Pontos"
        description="Passo a passo para parceiros se tornarem emissores de pontos e operarem o programa de fidelidade."
      />

      <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-950/20 dark:to-orange-950/20">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <BookOpen className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm mb-1">Do Parceiro ao Emissor</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Esta jornada guia o parceiro desde o entendimento do programa de fidelidade até a operação completa como emissor.
                Siga as 10 fases para ativar, configurar e maximizar o programa de fidelidade no seu estabelecimento.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary" className="text-xs">10 Fases</Badge>
                <Badge variant="secondary" className="text-xs">~40 passos</Badge>
                <Badge variant="secondary" className="text-xs">Tempo estimado: 15–30 min</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="relative space-y-3">
        <div className="absolute left-[22px] top-4 bottom-4 w-0.5 bg-border" />

        {journeySteps.map((step) => {
          const isExpanded = expandedStep === step.id;
          const PhaseIcon = step.phaseIcon;

          return (
            <div key={step.id} className="relative pl-12">
              <div className={`absolute left-2 top-4 h-[18px] w-[18px] rounded-full border-2 border-background flex items-center justify-center z-10 ${step.phaseColor}`}>
                <span className="text-[9px] font-bold">{step.id}</span>
              </div>

              <Card
                className={`rounded-xl border transition-all cursor-pointer ${isExpanded ? "shadow-md" : "shadow-sm hover:shadow-md"}`}
                onClick={() => toggleStep(step.id)}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${step.phaseColor}`}>
                        <PhaseIcon className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">{step.phase}</Badge>
                          <CardTitle className="text-sm truncate">{step.title}</CardTitle>
                        </div>
                        <CardDescription className="text-xs mt-0.5 truncate">{step.description}</CardDescription>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="px-4 pb-4 pt-0" onClick={(e) => e.stopPropagation()}>
                    <Separator className="mb-3" />
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Passos</p>
                        <ol className="space-y-2">
                          {step.steps.map((s, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5">
                                {i + 1}
                              </span>
                              <span className="text-foreground/90 leading-relaxed">{s}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {step.tips && step.tips.length > 0 && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">💡 Dicas</p>
                          <ul className="space-y-1">
                            {step.tips.map((tip, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <Check className="h-3 w-3 text-green-600 shrink-0 mt-0.5" />
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-muted-foreground font-mono">{step.route}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => navigate(step.route)}
                        >
                          Ir para esta página
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
