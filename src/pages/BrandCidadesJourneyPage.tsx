import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MapPin, Plus, ShoppingBag, Coins, Copy, Eye,
  Check, ChevronRight, ChevronDown, BookOpen, Settings2,
} from "lucide-react";

interface JourneyStep {
  id: string;
  phase: string;
  phaseIcon: React.ElementType;
  phaseColor: string;
  title: string;
  description: string;
  route?: string;
  steps: string[];
  tips?: string[];
}

const journeySteps: JourneyStep[] = [
  {
    id: "1",
    phase: "Conceito",
    phaseIcon: BookOpen,
    phaseColor: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    title: "O que é uma Cidade na plataforma?",
    description: "Entenda por que criar novas cidades e como funciona.",
    steps: [
      "Uma 'Cidade' representa uma região geográfica onde sua marca opera.",
      "Cada cidade pode ter seus próprios parceiros, ofertas e regras de pontos.",
      "Clientes são vinculados à cidade mais próxima automaticamente pelo GPS.",
      "Expandir para novas cidades permite crescer sem misturar parceiros e regras.",
    ],
    tips: [
      "Você pode ter regras de pontos diferentes para cada cidade.",
      "Parceiros de uma cidade só aparecem para clientes daquela região.",
    ],
  },
  {
    id: "2",
    phase: "Criar",
    phaseIcon: Plus,
    phaseColor: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
    title: "Criar sua primeira nova Cidade",
    description: "Passo a passo do formulário simplificado.",
    route: "/brand-branches/new",
    steps: [
      "No menu lateral, acesse Personalização & Vitrine → Cidades.",
      "Clique em 'Nova Cidade'.",
      "Selecione o Estado (UF) no seletor.",
      "Digite o nome da cidade (ex: Campinas).",
      "O sistema preenche automaticamente: nome, slug, timezone e coordenadas.",
      "Clique em 'Criar Cidade' para salvar.",
    ],
    tips: [
      "Você não precisa preencher coordenadas — o sistema busca automaticamente.",
      "O slug (identificador técnico) também é gerado para você.",
    ],
  },
  {
    id: "3",
    phase: "Modelo",
    phaseIcon: Settings2,
    phaseColor: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    title: "Definir o modelo de negócio da Cidade",
    description: "Escolha se a cidade opera com motoristas, passageiros ou ambos.",
    route: "/regras-resgate",
    steps: [
      "Acesse Cidades → Regras de Resgate.",
      "Selecione a cidade recém-criada no filtro.",
      "Escolha o modelo de negócio: Apenas Motorista, Apenas Passageiro ou Ambos.",
      "O modelo define quais funcionalidades e menus ficam disponíveis na cidade.",
      "Clique em 'Salvar' para aplicar.",
    ],
    tips: [
      "Novas cidades herdam o modelo padrão da marca automaticamente.",
      "Você pode alterar o modelo a qualquer momento em Regras de Resgate.",
      "O modelo 'Ambos' habilita funcionalidades de motorista e passageiro simultaneamente.",
    ],
  },
  {
    id: "4",
    phase: "Parceiros",
    phaseIcon: ShoppingBag,
    phaseColor: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    title: "Ativar parceiros na nova Cidade",
    description: "Vincule parceiros à cidade recém-criada.",
    route: "/stores",
    steps: [
      "Acesse Gestão Comercial → Parceiros.",
      "Ao criar ou editar um parceiro, selecione a nova cidade no campo 'Cidade'.",
      "Parceiros já existentes em outra cidade continuam operando normalmente.",
      "Novos parceiros podem se cadastrar e serão vinculados à cidade escolhida.",
    ],
    tips: [
      "Um parceiro pertence a uma única cidade.",
      "Você pode importar parceiros em lote via Importação de Dados.",
    ],
  },
  {
    id: "5",
    phase: "Pontos",
    phaseIcon: Coins,
    phaseColor: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
    title: "Configurar regras de pontos por Cidade",
    description: "Cada cidade pode ter suas próprias regras de fidelidade.",
    route: "/points-rules",
    steps: [
      "Acesse Programa de Fidelidade → Regras de Fidelidade.",
      "As regras podem ser configuradas por cidade usando o filtro de cidade.",
      "Defina a taxa de pontos por R$ gasto para a nova cidade.",
      "Configure limites de pontos específicos se necessário.",
    ],
    tips: [
      "Cidades novas herdam a regra padrão da marca até você personalizar.",
      "Use regras diferentes para incentivar regiões com menos engajamento.",
    ],
  },
  {
    id: "6",
    phase: "Clonar",
    phaseIcon: Copy,
    phaseColor: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    title: "Duplicar configurações entre Cidades",
    description: "Copie ofertas, parceiros e regras de uma cidade para outra.",
    steps: [
      "Solicite ao administrador da plataforma o Clone de Região.",
      "O clone copia parceiros, ofertas, regras de pontos e configurações.",
      "Após o clone, ajuste apenas o que for diferente na nova cidade.",
      "Cada clone gera um registro de auditoria para rastreamento.",
    ],
    tips: [
      "O clone é ideal quando a nova cidade tem operação similar à existente.",
      "Você pode clonar e depois ajustar apenas as diferenças.",
    ],
  },
  {
    id: "7",
    phase: "Testar",
    phaseIcon: Eye,
    phaseColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    title: "Verificar no app do cliente",
    description: "Teste como o cliente vê a nova cidade no app.",
    route: "/customer-preview",
    steps: [
      "Acesse a visualização do app do cliente (/customer-preview).",
      "O seletor de cidades no cabeçalho deve mostrar a nova cidade.",
      "Selecione a nova cidade e verifique se os parceiros aparecem corretamente.",
      "Teste o fluxo de ofertas e resgate na nova cidade.",
      "Se tiver GPS habilitado, verifique se a detecção automática funciona.",
    ],
    tips: [
      "O app detecta automaticamente a cidade mais próxima pelo GPS do celular.",
      "Clientes podem trocar de cidade manualmente pelo cabeçalho do app.",
    ],
  },
];

export default function BrandCidadesJourneyPage() {
  const navigate = useNavigate();
  const [expandedStep, setExpandedStep] = useState<string | null>("1");
  const toggleStep = (id: string) =>
    setExpandedStep(expandedStep === id ? null : id);

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Guia de Cidades"
        description="Aprenda a expandir sua marca para novas cidades passo a passo."
      />

      <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-teal-500/5 to-teal-500/10">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <MapPin className="h-6 w-6 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm mb-1">Expandindo para Novas Cidades</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Siga as 7 etapas abaixo para adicionar uma nova cidade à sua operação.
                Cada etapa inclui passos detalhados e dicas práticas.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary" className="text-xs">7 Etapas</Badge>
                <Badge variant="secondary" className="text-xs">~10 min</Badge>
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
              <div
                className={`absolute left-2 top-4 h-[18px] w-[18px] rounded-full border-2 border-background flex items-center justify-center z-10 ${step.phaseColor}`}
              >
                <span className="text-[9px] font-bold">{step.id}</span>
              </div>

              <Card
                className={`rounded-xl border transition-all cursor-pointer ${
                  isExpanded ? "shadow-md" : "shadow-sm hover:shadow-md"
                }`}
                onClick={() => toggleStep(step.id)}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${step.phaseColor}`}
                      >
                        <PhaseIcon className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                            {step.phase}
                          </Badge>
                          <CardTitle className="text-sm truncate">{step.title}</CardTitle>
                        </div>
                        <CardDescription className="text-xs mt-0.5 truncate">
                          {step.description}
                        </CardDescription>
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
                  <CardContent
                    className="px-4 pb-4 pt-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Separator className="mb-3" />
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Passos
                        </p>
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
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                            💡 Dicas
                          </p>
                          <ul className="space-y-1">
                            {step.tips.map((tip, i) => (
                              <li
                                key={i}
                                className="text-xs text-muted-foreground flex items-start gap-1.5"
                              >
                                <Check className="h-3 w-3 text-green-600 shrink-0 mt-0.5" />
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {step.route && (
                        <div className="flex items-center justify-end pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => navigate(step.route!)}
                          >
                            Ir para esta página
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      )}
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
