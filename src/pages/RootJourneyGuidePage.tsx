import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Building2, Store, MapPin, Rocket, ShoppingBag, Tag, UserCheck, Coins,
  Check, ChevronRight, ChevronDown, Eye, Zap, Shield, LayoutDashboard,
  Globe, Image, Layers, Settings2, BarChart3, BookOpen,
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
    phaseIcon: Building2,
    phaseColor: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    title: "Criar a Empresa (Tenant)",
    description: "Cada empreendedor que contrata o SaaS é representado por uma Empresa.",
    route: "/tenants/new",
    steps: [
      "Acesse o menu lateral → Estrutura → Empresas.",
      "Clique em 'Nova Empresa'.",
      "Preencha o nome da empresa (ex: 'Grupo Vale Resgate Goiânia').",
      "Preencha o identificador (slug único, ex: 'vale-resgate-gyn').",
      "Selecione o plano (Free, Starter, Pro ou Enterprise).",
      "Marque se a empresa deve iniciar ativa.",
      "Clique em 'Salvar'.",
    ],
    tips: [
      "O identificador é usado internamente para organizar dados. Use letras minúsculas e hífens.",
      "Uma empresa pode ter várias marcas.",
      "Se você usar o wizard da Fase 2 (Nova Empresa), o Tenant é criado automaticamente. Esta fase só é necessária se quiser criar Tenants avulsos.",
    ],
  },
  {
    id: "2",
    phase: "Fase 2",
    phaseIcon: Rocket,
    phaseColor: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    title: "Provisionar Nova Marca (Wizard Automático)",
    description: "O wizard cria automaticamente: Tenant, Marca, Cidade, Domínio e Usuários de teste — tudo de uma vez.",
    route: "/provision-brand",
    steps: [
      "Acesse o menu lateral → Estrutura → Nova Empresa.",
      "Preencha o nome da empresa (ex: 'Vale Resgate Goiânia') — o slug é gerado automaticamente.",
      "Clique em 'Próximo'.",
      "Preencha o nome da primeira cidade (ex: 'Goiânia Centro') e o estado.",
      "Clique em 'Próximo'.",
      "(Opcional) Insira a URL do logo e escolha as cores primária e secundária.",
      "Defina os pontos iniciais do cliente de teste.",
      "Clique em 'Revisar', confira os dados e clique em 'Criar Empresa'.",
    ],
    tips: [
      "Não é necessário criar o Tenant antes — o wizard já cria tudo automaticamente (Tenant + Marca + Cidade + Domínio).",
      "O wizard cria automaticamente 3 contas de teste: Admin, Cliente (com pontos iniciais) e Parceiro. Senha padrão: 123456.",
      "Um template de Home Page com seções de demonstração é aplicado automaticamente.",
      "Após o provisionamento, você pode acessar o painel da marca com as credenciais de teste.",
    ],
  },
  {
    id: "3",
    phase: "Fase 3",
    phaseIcon: Settings2,
    phaseColor: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    title: "Configurar Kit Inicial da Plataforma",
    description: "Defina os templates e configurações padrão aplicados a cada nova marca.",
    route: "/starter-kit",
    steps: [
      "Acesse o menu lateral → Plataforma → Kit Inicial.",
      "Defina o número de Seções Demo que serão criadas ao provisionar uma nova empresa.",
      "Defina o número de Parceiros Demo que serão criados para popular a vitrine inicial.",
      "Configure os Pontos Iniciais que o cliente teste receberá.",
      "Selecione o Template de Home Padrão que será aplicado automaticamente nas novas empresas.",
      "Clique em 'Salvar Configuração'.",
    ],
    tips: [
      "O Kit Inicial é aplicado toda vez que uma nova marca é provisionada pelo wizard.",
      "Você pode alterar o kit a qualquer momento — as mudanças valem para futuras marcas.",
      "Se nenhum template for selecionado, o sistema usa o padrão interno.",
    ],
  },
  {
    id: "4",
    phase: "Fase 4",
    phaseIcon: Shield,
    phaseColor: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    title: "Configurar Módulos e Permissões",
    description: "Controle quais funcionalidades cada marca pode usar.",
    route: "/modules",
    steps: [
      "Acesse → Plataforma → Funcionalidades para cadastrar ou editar módulos globais (ex: Ofertas, Pontos, Catálogo).",
      "Módulos marcados como 'Core' ficam sempre ativos e não podem ser desativados por marca.",
      "Acesse → Usuários & Permissões → Módulos da Marca para ativar/desativar módulos específicos por marca.",
      "Selecione a marca desejada e ligue/desligue cada módulo conforme o plano contratado.",
      "Acesse → Usuários & Permissões → Permissões por Empresa para controlar ações granulares.",
      "Defina o que parceiros de cada marca podem fazer: criar ofertas, emitir pontos, editar perfil, etc.",
      "Revise as permissões sempre que adicionar novos módulos ou parceiros.",
    ],
    tips: [
      "Módulos desativados escondem automaticamente os menus correspondentes no painel do empreendedor e dos parceiros.",
      "O transbordo de permissões permite definir regras por nível hierárquico (Marca → Parceiro).",
      "Módulos 'Core' garantem que funcionalidades essenciais nunca sejam desligadas acidentalmente.",
      "Configure permissões antes de aprovar parceiros para garantir que o acesso esteja correto desde o início.",
    ],
  },
  {
    id: "5",
    phase: "Fase 5",
    phaseIcon: MapPin,
    phaseColor: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
    title: "Gerenciar Cidades (Filiais)",
    description: "Cidades representam as regiões onde a marca opera.",
    route: "/branches",
    steps: [
      "Acesse → Estrutura → Cidades para ver todas as cidades da marca.",
      "A cidade principal já foi criada pelo wizard. Para adicionar mais, clique em 'Nova Cidade'.",
      "Preencha: nome, slug, cidade, estado e fuso horário.",
      "Informe latitude e longitude para ativar a detecção automática de proximidade no app do cliente.",
      "Configure o raio de cobertura ou deixe o sistema usar a fórmula de Haversine para encontrar a cidade mais próxima.",
      "Ative ou desative cidades conforme a operação do empreendedor — cidades inativas ficam ocultas no app.",
      "Use 'Clonar Cidade' para duplicar todas as configurações (regras de pontos, parceiros, etc.) de uma cidade existente.",
      "Revise as configurações avançadas em branch_settings_json para personalizar comportamentos por cidade.",
    ],
    tips: [
      "Cada cidade pode ter suas próprias regras de pontos independentes da regra geral da marca.",
      "A geolocalização (lat/lng) permite que o app do cliente detecte automaticamente a cidade mais próxima via GPS.",
      "No app do cliente, as cidades são organizadas por Estado > Cidade — o termo 'Filial' não aparece para o usuário final.",
      "Clonar uma cidade é ideal para expandir a operação para novas regiões mantendo as mesmas configurações.",
    ],
  },
  {
    id: "6",
    phase: "Fase 6",
    phaseIcon: ShoppingBag,
    phaseColor: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    title: "Cadastrar e Aprovar Parceiros",
    description: "Parceiros se cadastram publicamente e precisam de aprovação para operar.",
    route: "/stores",
    steps: [
      "O parceiro acessa a tela de login e clica em 'Quero ser parceiro'.",
      "Ele preenche o wizard de 4 etapas: Dados, Endereço, Mídia/Docs e Acesso.",
      "Acesse → Gestão Comercial → Parceiros e filtre pela aba 'Pendentes'.",
      "Clique em 'Revisar' para ver os dados e clique em 'Aprovar' ou 'Rejeitar'.",
      "Após aprovação, o parceiro acessa o Portal do Parceiro e pode criar ofertas.",
    ],
    tips: [
      "Parceiros aprovados recebem automaticamente o papel 'store_admin'.",
      "Você pode importar parceiros em lote via → Operações → Importar Planilha.",
    ],
  },
  {
    id: "7",
    phase: "Fase 7",
    phaseIcon: Tag,
    phaseColor: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
    title: "Gerenciar Ofertas e Cupons",
    description: "Ofertas são os descontos que os clientes resgatam nos parceiros.",
    route: "/offers",
    steps: [
      "Acesse → Operações → Ofertas para ver todas as ofertas da marca.",
      "Os parceiros criam ofertas pelo Portal do Parceiro (wizard passo a passo).",
      "Cada oferta define: título, descrição, valor de resgate, validade, limites de uso.",
      "Ofertas podem ser do tipo: Desconto %, Cashback, Brinde, Valor Fixo.",
      "Monitore resgates em → Operações → Resgates.",
    ],
  },
  {
    id: "8",
    phase: "Fase 8",
    phaseIcon: Coins,
    phaseColor: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
    title: "Configurar Programa de Pontos",
    description: "Defina como os clientes acumulam e usam pontos.",
    route: "/points-rules",
    steps: [
      "Acesse → Programa de Pontos → Regras de Pontos.",
      "Defina a taxa base: quantos pontos por R$1 gasto.",
      "Configure limites: máximo por compra, por dia (cliente) e por dia (parceiro).",
      "Defina o valor em dinheiro de cada ponto (ex: 1 ponto = R$0,01).",
      "Opcionalmente, permita que parceiros criem regras próprias (com ou sem aprovação).",
    ],
    tips: [
      "Use → Programa de Pontos → Extrato para auditar todas as movimentações.",
      "Regras personalizadas dos parceiros podem exigir aprovação do admin.",
    ],
  },
  {
    id: "9",
    phase: "Fase 9",
    phaseIcon: Zap,
    phaseColor: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    title: "Aprovar Solicitações de Emissor",
    description: "Parceiros do tipo Receptora podem solicitar virar Emissores de pontos.",
    route: "/emitter-requests",
    steps: [
      "O parceiro acessa o Portal e clica em 'Solicitar Ativação como Emissor'.",
      "Ele escolhe o tipo desejado (Emissora ou Mista) e envia uma justificativa.",
      "A solicitação aparece em → Operações → Solicitações de Emissor.",
      "Revise a justificativa e clique em 'Aprovar' ou 'Rejeitar'.",
      "Ao aprovar, o tipo do parceiro é atualizado automaticamente.",
    ],
  },
  {
    id: "10",
    phase: "Fase 10",
    phaseIcon: Image,
    phaseColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
    title: "Personalizar a Vitrine do App",
    description: "Monte a tela inicial, banners e páginas personalizadas do aplicativo.",
    route: "/templates",
    steps: [
      "Acesse → Plataforma → Seções da Home para configurar as seções da tela inicial.",
      "Acesse → Identidade & Vitrine → Central de Propagandas para criar banners com agendamento.",
      "Use o Construtor de Páginas para criar páginas personalizadas.",
      "Configure ícones e categorias em → Galeria de Ícones.",
      "Personalize os nomes dos menus em → Nomes e Rótulos.",
    ],
    tips: [
      "Use → Plataforma → Modelos de Home para aplicar templates em massa para todas as marcas.",
    ],
  },
  {
    id: "11",
    phase: "Fase 11",
    phaseIcon: UserCheck,
    phaseColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
    title: "Acompanhar Clientes e Operação",
    description: "Monitore a base de clientes, resgates e a saúde do negócio.",
    route: "/customers",
    steps: [
      "Acesse → Operações → Clientes para ver a base de clientes.",
      "Acesse → Operações → Resgates para acompanhar resgates em tempo real.",
      "Use → Plataforma → Relatórios para análises consolidadas.",
      "Acesse → Plataforma → Auditoria para rastrear todas as ações dos usuários.",
      "Envie notificações push em → Operações → Enviar Notificação.",
    ],
  },
  {
    id: "12",
    phase: "Fase 12",
    phaseIcon: Eye,
    phaseColor: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    title: "Visualizar o App do Cliente",
    description: "Teste como o cliente final vê o aplicativo da marca.",
    route: "/customer-preview",
    steps: [
      "Acesse a rota /customer-preview no navegador.",
      "Selecione a cidade desejada.",
      "Navegue pela tela inicial, ofertas, carteira e perfil.",
      "Teste o fluxo de resgate: escolha uma oferta → gere o código de resgate.",
      "Verifique se as cores, logo e seções estão corretas.",
    ],
    tips: [
      "Use as credenciais de teste criadas pelo wizard para testar como cliente.",
      "O app do cliente é um PWA — pode ser instalado no celular via 'Adicionar à Tela Inicial'.",
    ],
  },
];

export default function RootJourneyGuidePage() {
  const navigate = useNavigate();
  const [expandedStep, setExpandedStep] = useState<string | null>("1");
  const toggleStep = (id: string) => {
    setExpandedStep(expandedStep === id ? null : id);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Jornada Completa do ROOT"
        description="Passo a passo para configurar e operar a plataforma do zero até a operação completa."
      />

      {/* Summary overview */}
      <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <BookOpen className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm mb-1">Resumo da Jornada</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Esta jornada cobre 12 fases: desde a criação da empresa até a visualização do app final do cliente.
                Siga cada fase na ordem para configurar a plataforma completa. Cada fase inclui os passos detalhados e dicas práticas.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary" className="text-xs">12 Fases</Badge>
                <Badge variant="secondary" className="text-xs">~60 passos</Badge>
                <Badge variant="secondary" className="text-xs">Tempo estimado: 30–60 min</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="relative space-y-3">
        {/* Vertical line */}
        <div className="absolute left-[22px] top-4 bottom-4 w-0.5 bg-border" />

        {journeySteps.map((step, index) => {
          const isExpanded = expandedStep === step.id;
          const PhaseIcon = step.phaseIcon;

          return (
            <div key={step.id} className="relative pl-12">
              {/* Timeline dot */}
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
                      {/* Steps */}
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

                      {/* Tips */}
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

                      {/* Route shortcut */}
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
