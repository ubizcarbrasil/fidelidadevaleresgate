import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen, Power, MapPin, KeyRound, Link2, Activity,
  CheckCircle, Check, ChevronRight, ChevronDown, Car,
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
    title: "O que é a integração de mobilidade?",
    description: "Entenda como a API conecta corridas ao programa de fidelidade.",
    steps: [
      "A integração de mobilidade conecta o sistema de transporte (TaxiMachine) ao seu programa de fidelidade.",
      "A cada corrida finalizada, o sistema pontua automaticamente passageiros e/ou motoristas.",
      "A comunicação acontece via webhook: o sistema de mobilidade envia eventos de corrida para a plataforma.",
      "Motoristas e passageiros acumulam pontos sem precisar de ação manual.",
    ],
    tips: [
      "A pontuação automática elimina a necessidade de registro manual de corridas.",
      "Motoristas são identificados automaticamente pelo ID externo ou nome.",
    ],
  },
  {
    id: "2",
    phase: "Módulo",
    phaseIcon: Power,
    phaseColor: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    title: "Ativar o módulo de integração",
    description: "Habilite o módulo de mobilidade na sua marca.",
    route: "/brand-modules",
    steps: [
      "No menu lateral, acesse Configurações → Módulos.",
      "Localize o módulo 'Integração Mobilidade' na lista.",
      "Ative o módulo clicando no botão de ativar/desativar.",
      "Após ativar, os menus de integração aparecerão automaticamente no painel.",
    ],
    tips: [
      "O módulo precisa estar ativo antes de qualquer configuração.",
      "Ativar o módulo não gera custos — a cobrança depende do uso efetivo.",
    ],
  },
  {
    id: "3",
    phase: "Cidade",
    phaseIcon: MapPin,
    phaseColor: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
    title: "Selecionar a cidade para integrar",
    description: "Escolha em qual cidade a API será ativada.",
    route: "/machine-integration",
    steps: [
      "No menu lateral, acesse Integrações & API → Integração Mobilidade.",
      "No seletor de cidade no topo da página, escolha a cidade desejada.",
      "Cada cidade tem sua própria configuração de integração independente.",
      "Certifique-se de que a cidade já foi criada em Cidades → Minhas Cidades.",
    ],
    tips: [
      "Você pode integrar múltiplas cidades, cada uma com credenciais diferentes.",
      "O modelo de negócio da cidade (Motorista/Passageiro/Ambos) define como os pontos são distribuídos.",
    ],
  },
  {
    id: "4",
    phase: "Credenciais",
    phaseIcon: KeyRound,
    phaseColor: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    title: "Configurar credenciais da API",
    description: "Preencha as credenciais fornecidas pelo sistema de mobilidade.",
    route: "/machine-integration",
    steps: [
      "Na seção 'Credenciais da API', preencha o Usuário e Senha do Basic Auth.",
      "Informe a API Key fornecida pelo sistema de mobilidade.",
      "Opcionalmente, configure as credenciais Matrix (api_key, usuário, senha) para consulta de recibos.",
      "Opcionalmente, informe o Chat ID do Telegram para receber notificações de corridas.",
      "Clique em 'Salvar' para persistir as credenciais.",
    ],
    tips: [
      "As credenciais são criptografadas e armazenadas de forma segura.",
      "O Telegram Chat ID permite receber alertas a cada corrida processada.",
      "As credenciais Matrix são usadas para enriquecer dados (CPF, e-mail, telefone).",
    ],
  },
  {
    id: "5",
    phase: "Webhook",
    phaseIcon: Link2,
    phaseColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
    title: "Registrar o webhook automático",
    description: "O webhook conecta o sistema de mobilidade à plataforma.",
    route: "/machine-integration",
    steps: [
      "Com a API Key preenchida, o webhook é registrado automaticamente ao salvar.",
      "A URL do webhook aparecerá na tela após o registro bem-sucedido.",
      "Se necessário, copie a URL e configure manualmente no sistema de mobilidade.",
      "Sem a API Key, adicione o webhook manualmente no status router do sistema externo.",
    ],
    tips: [
      "O registro automático do webhook é a forma mais rápida de integrar.",
      "Se o webhook falhar, verifique se a API Key está correta e tente novamente.",
      "A URL do webhook é única por cidade — cada cidade tem seu próprio endpoint.",
    ],
  },
  {
    id: "6",
    phase: "Teste",
    phaseIcon: Activity,
    phaseColor: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
    title: "Testar com o Lab de Webhook",
    description: "Simule eventos de corrida e valide a pontuação.",
    route: "/machine-webhook-test",
    steps: [
      "No menu lateral, acesse Integrações & API → Lab Webhook.",
      "Selecione a cidade e o tipo de evento (corrida finalizada).",
      "Preencha os dados da corrida simulada (valor, motorista, passageiro).",
      "Envie o evento e verifique se os pontos foram creditados corretamente.",
      "Confira o log de resposta para identificar possíveis erros.",
    ],
    tips: [
      "O Lab é seguro — eventos de teste são processados como corridas reais para validação.",
      "Use valores pequenos para testes iniciais.",
      "Verifique se o motorista/passageiro recebeu os pontos na tela de Clientes/Motoristas.",
    ],
  },
  {
    id: "7",
    phase: "Validar",
    phaseIcon: CheckCircle,
    phaseColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    title: "Verificar corridas e pontuação",
    description: "Confirme que tudo está funcionando em produção.",
    route: "/machine-integration",
    steps: [
      "Volte à tela de Integração Mobilidade e verifique o painel de diagnóstico.",
      "Confira se o status da integração está ativo e saudável.",
      "Verifique o feed de eventos em tempo real para ver corridas processadas.",
      "Acesse Motoristas ou Clientes para confirmar que os pontos foram creditados.",
      "Monitore as notificações do Telegram (se configurado) para acompanhar em tempo real.",
    ],
    tips: [
      "O painel de diagnóstico mostra erros recentes — corrija rapidamente.",
      "Se corridas não aparecem, verifique credenciais e status do webhook.",
      "Após validar, a integração opera 100% automática sem intervenção manual.",
    ],
  },
];

export default function BrandApiJourneyPage() {
  const navigate = useNavigate();
  const [expandedStep, setExpandedStep] = useState<string | null>("1");
  const toggleStep = (id: string) =>
    setExpandedStep(expandedStep === id ? null : id);

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Guia da API de Mobilidade"
        description="Ative a integração com o sistema de mobilidade passo a passo."
      />

      <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-indigo-500/5 to-indigo-500/10">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Car className="h-6 w-6 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm mb-1">Integração de Mobilidade</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Siga as 7 etapas abaixo para conectar o sistema de mobilidade ao seu
                programa de fidelidade e pontuar corridas automaticamente.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary" className="text-xs">7 Etapas</Badge>
                <Badge variant="secondary" className="text-xs">~15 min</Badge>
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
