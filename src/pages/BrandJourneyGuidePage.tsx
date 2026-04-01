import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Palette, Globe, Layout, Image, Type, Layers, MapPin, ShoppingBag, Tag,
  UserCheck, ReceiptText, Coins, Settings2, Shield, Zap, Bell, BarChart3,
  Check, ChevronRight, ChevronDown, Eye, BookOpen, Rocket, ShieldCheck,
  Sparkles, PackageSearch, ScrollText, ScanLine,
} from "lucide-react";

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
    phaseIcon: Palette,
    phaseColor: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    title: "Personalizar a Identidade Visual",
    description: "Configure as cores, logo e aparência da sua marca.",
    route: "/brands",
    steps: [
      "No menu lateral, acesse Personalização & Vitrine → Aparência da Marca.",
      "Faça upload do logo da sua marca.",
      "Escolha as cores primária e secundária que representam sua marca.",
      "Configure o nome de exibição da marca.",
      "Salve as alterações.",
    ],
    tips: [
      "Suas cores aparecerão automaticamente no app do cliente e em todo o painel.",
      "Use um logo com fundo transparente (PNG) para melhor resultado.",
    ],
  },
  {
    id: "2",
    phase: "Fase 2",
    phaseIcon: Globe,
    phaseColor: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    title: "Configurar Domínio Personalizado",
    description: "Defina o endereço web (URL) onde seus clientes acessarão o app.",
    route: "/domains",
    steps: [
      "Solicite ao administrador da plataforma a configuração do domínio.",
      "Informe o domínio ou subdomínio desejado (ex: app.suamarca.com.br).",
      "Configure o DNS do seu domínio conforme as instruções recebidas.",
      "Aguarde a propagação do DNS (pode levar até 48h).",
    ],
    tips: [
      "Enquanto o domínio personalizado não estiver configurado, o app funciona no domínio padrão da plataforma.",
      "Um domínio profissional transmite mais confiança para seus clientes.",
    ],
  },
  {
    id: "3",
    phase: "Fase 3",
    phaseIcon: MapPin,
    phaseColor: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
    title: "Gerenciar suas Cidades",
    description: "Adicione e configure as cidades onde sua marca opera.",
    route: "/brand-branches",
    steps: [
      "No menu lateral, acesse Personalização & Vitrine → Cidades.",
      "Sua primeira cidade já foi criada automaticamente.",
      "Para expandir, clique em 'Nova Cidade'.",
      "Selecione o Estado (UF) e digite o nome da cidade — coordenadas são preenchidas automaticamente.",
      "Ative ou desative cidades conforme sua operação.",
    ],
    tips: [
      "Cada cidade pode ter regras de pontos diferentes.",
      "Parceiros e clientes são vinculados à cidade, garantindo que as ofertas sejam locais.",
    ],
  },
  {
    id: "4",
    phase: "Fase 4",
    phaseIcon: Layout,
    phaseColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
    title: "Montar a Vitrine do App",
    description: "Configure as seções, banners e visual da tela inicial do seu app.",
    route: "/templates",
    steps: [
      "No menu lateral, acesse Personalização & Vitrine → Mídia & Banners para criar banners com agendamento.",
      "Configure as seções da tela inicial com os parceiros e ofertas em destaque.",
      "Acesse Personalização & Vitrine → Biblioteca de Ícones para personalizar os ícones das categorias.",
      "Acesse Personalização & Vitrine → Layout de Ofertas para definir como as ofertas aparecem no app.",
    ],
    tips: [
      "Um modelo de demonstração já foi aplicado automaticamente. Edite-o ao seu gosto.",
      "Banners com agendamento permitem planejar campanhas com antecedência.",
    ],
  },
  {
    id: "5",
    phase: "Fase 5",
    phaseIcon: Layers,
    phaseColor: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    title: "Criar Páginas Personalizadas",
    description: "Crie páginas extras com conteúdo livre para o app do cliente.",
    route: "/page-builder-v2",
    steps: [
      "No menu lateral, acesse Personalização & Vitrine → Editor de Páginas.",
      "Clique em 'Nova Página'.",
      "Defina o título e o slug (URL da página).",
      "Adicione elementos: textos, imagens, botões, links.",
      "Publique a página e vincule-a ao menu ou a um banner.",
    ],
    tips: [
      "Use para criar páginas como 'Sobre Nós', 'Regulamento', 'Perguntas Frequentes'.",
      "Páginas podem ser vinculadas em banners da Mídia & Banners.",
    ],
  },
  {
    id: "6",
    phase: "Fase 6",
    phaseIcon: PackageSearch,
    phaseColor: "bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-300",
    title: "Ativar o Catálogo Digital",
    description: "Configure o cardápio digital com categorias, produtos e checkout via WhatsApp.",
    route: "/store-panel",
    steps: [
      "Certifique-se de que o parceiro é do tipo 'Emissora' ou 'Mista' (necessário para exibir o catálogo).",
      "No Painel do Parceiro → aba 'Perfil', configure o número de WhatsApp.",
      "Configure a regra de pontos da loja (mínimo 1 pt/R$) na aba 'Pontos'.",
      "Acesse a aba 'Catálogo' e crie categorias (ex: Carnes, Bebidas, Sobremesas).",
      "Adicione produtos com nome, descrição, preço e foto para cada categoria.",
      "Teste no app do cliente: acesse a página do parceiro → aba 'Catálogo'.",
      "Adicione itens ao carrinho e finalize pelo botão WhatsApp.",
    ],
    tips: [
      "O catálogo só aparece para parceiros do tipo Emissora ou Mista.",
      "O checkout via WhatsApp envia uma mensagem formatada com itens, total e estimativa de pontos.",
      "Sem WhatsApp configurado, o botão de checkout fica desabilitado.",
    ],
  },
  {
    id: "7",
    phase: "Fase 7",
    phaseIcon: ShoppingBag,
    phaseColor: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    title: "Atrair e Aprovar Parceiros",
    description: "Parceiros se cadastram pelo app e precisam de aprovação para operar.",
    route: "/stores",
    steps: [
      "Compartilhe o link de cadastro com potenciais parceiros.",
      "O parceiro acessa a tela de login e clica em 'Quero ser parceiro'.",
      "Ele preenche o cadastro: Dados, Endereço, Mídia e Acesso.",
      "Acesse Gestão Comercial → Parceiros e filtre pela aba 'Pendentes' para revisar.",
      "Aprove ou rejeite cada solicitação. Parceiros aprovados podem criar ofertas imediatamente.",
    ],
    tips: [
      "Você pode importar parceiros em lote via Inteligência & Dados → Importação de Dados.",
      "Parceiros aprovados recebem acesso automático ao Painel do Parceiro.",
    ],
  },
  {
    id: "8",
    phase: "Fase 8",
    phaseIcon: Tag,
    phaseColor: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
    title: "Acompanhar Ofertas e Resgates",
    description: "Monitore as ofertas criadas pelos parceiros e os resgates dos clientes.",
    route: "/offers",
    steps: [
      "Acesse Gestão Comercial → Ofertas para ver todas as ofertas ativas.",
      "Monitore os resgates em Gestão Comercial → Resgates.",
      "Verifique o desempenho de cada parceiro: quantas ofertas, quantos resgates.",
      "Use filtros para analisar por cidade, parceiro ou período.",
    ],
    tips: [
      "Ofertas podem ser: Desconto %, Cashback, Brinde ou Valor Fixo.",
      "Os parceiros criam e gerenciam suas próprias ofertas pelo Painel do Parceiro.",
    ],
  },
  {
    id: "9",
    phase: "Fase 9",
    phaseIcon: Coins,
    phaseColor: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
    title: "Configurar o Programa de Fidelidade",
    description: "Defina as regras de acúmulo e resgate de pontos.",
    route: "/points-rules",
    steps: [
      "Acesse Programa de Fidelidade → Regras de Fidelidade.",
      "Defina a taxa base: quantos pontos o cliente ganha por R$1 gasto.",
      "Configure limites: máximo por compra, por dia (cliente) e por dia (parceiro).",
      "Defina o valor em dinheiro de cada ponto (ex: 1 ponto = R$0,01).",
      "Opcionalmente, permita que parceiros criem regras próprias.",
    ],
    tips: [
      "Regras personalizadas dos parceiros podem exigir sua aprovação.",
      "Use Programa de Fidelidade → Extrato de Fidelidade para auditar movimentações.",
    ],
  },
  {
    id: "10",
    phase: "Fase 10",
    phaseIcon: Zap,
    phaseColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    title: "Gerenciar Emissores de Pontos",
    description: "Controle quais parceiros podem emitir pontos para clientes.",
    route: "/emitter-requests",
    steps: [
      "Parceiros do tipo 'Receptora' podem solicitar virar Emissores.",
      "As solicitações aparecem em Aprovações → Solicitações de Upgrade.",
      "Revise a justificativa de cada parceiro.",
      "Aprove ou rejeite a solicitação.",
      "Ao aprovar, o parceiro pode emitir pontos diretamente para clientes.",
    ],
    tips: [
      "Parceiros Emissores são ideais para programas de fidelidade descentralizados.",
      "Parceiros Mistos podem emitir pontos e receber resgates ao mesmo tempo.",
    ],
  },
  {
    id: "11",
    phase: "Fase 11",
    phaseIcon: UserCheck,
    phaseColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
    title: "Acompanhar Clientes e Engajamento",
    description: "Monitore a base de clientes e envie notificações.",
    route: "/customers",
    steps: [
      "Acesse Gestão Comercial → Clientes para ver toda a base.",
      "Analise o saldo de pontos e histórico de cada cliente.",
      "Envie notificações push em Gestão Comercial → Enviar Notificação (se disponível).",
      "Acesse Inteligência & Dados → Relatórios para dados consolidados.",
      "Use Inteligência & Dados → Auditoria para rastrear ações dos usuários.",
    ],
    tips: [
      "Notificações push aumentam significativamente o engajamento.",
      "Acompanhe o saldo médio de pontos para calibrar as regras do programa.",
    ],
  },
  {
    id: "12",
    phase: "Fase 12",
    phaseIcon: Shield,
    phaseColor: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    title: "Configurar Permissões dos Parceiros",
    description: "Defina o que cada parceiro pode fazer no Painel.",
    route: "/brand-permissions",
    steps: [
      "Acesse Equipe & Acessos → Permissão de Parceiros.",
      "Defina quais ações os parceiros podem realizar: criar ofertas, emitir pontos, etc.",
      "Gerencie os usuários em Equipe & Acessos → Usuários.",
      "Gerencie os módulos habilitados em Configurações → Módulos.",
    ],
    tips: [
      "Módulos desativados escondem automaticamente os menus correspondentes.",
      "Use permissões para dar mais ou menos autonomia aos parceiros.",
    ],
  },
  {
    id: "13",
    phase: "Fase 13",
    phaseIcon: Eye,
    phaseColor: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    title: "Testar o App do Cliente",
    description: "Veja como o cliente final enxerga o seu app.",
    route: "/customer-preview",
    steps: [
      "Acesse a visualização do app do cliente pelo menu ou pela rota /customer-preview.",
      "Selecione a cidade desejada.",
      "Navegue pela tela inicial, ofertas, carteira e perfil.",
      "Teste o fluxo de resgate: escolha uma oferta → gere o código.",
      "Verifique se as cores, logo e seções estão corretas.",
    ],
    tips: [
      "Use as credenciais de teste para testar como cliente.",
      "O app é um PWA — pode ser instalado no celular via 'Adicionar à Tela Inicial'.",
      "Compartilhe o link do app com sua equipe para feedback antes de lançar.",
    ],
  },
];

export default function BrandJourneyGuidePage() {
  const navigate = useNavigate();
  const [expandedStep, setExpandedStep] = useState<string | null>("1");
  const toggleStep = (id: string) => {
    setExpandedStep(expandedStep === id ? null : id);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Guia do Empreendedor"
        description="Passo a passo para configurar e lançar sua marca do zero até a operação completa."
      />

      <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <BookOpen className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm mb-1">Sua Jornada até o Lançamento</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                 Siga as 13 fases abaixo para configurar sua marca, atrair parceiros, lançar o app e começar a operar.
                 Cada fase inclui passos detalhados e dicas práticas para garantir o melhor resultado.
               </p>
               <div className="flex flex-wrap gap-2 mt-3">
                 <Badge variant="secondary" className="text-xs">13 Fases</Badge>
                 <Badge variant="secondary" className="text-xs">~60 passos</Badge>
                <Badge variant="secondary" className="text-xs">Tempo estimado: 20–40 min</Badge>
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
