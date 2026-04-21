import type { FaixaMotoristas, JanelaContato, CanalContato, SolucaoAtual } from "../types/tipos_lead";

export const OPCOES_CARGO = [
  "CEO / Sócio",
  "Diretor / Head Comercial",
  "Diretor / Head de Operações",
  "Gerente de Operações",
  "Gerente de Tecnologia",
  "Marketing / CRM",
  "Outro",
] as const;

export const OPCOES_FAIXA_MOTORISTAS: { value: FaixaMotoristas; label: string }[] = [
  { value: "1-50", label: "Até 50 motoristas" },
  { value: "50-200", label: "50 a 200 motoristas" },
  { value: "200-500", label: "200 a 500 motoristas" },
  { value: "500-1000", label: "500 a 1.000 motoristas" },
  { value: "1000+", label: "Mais de 1.000 motoristas" },
];

export const OPCOES_SOLUCAO_ATUAL: { value: SolucaoAtual; label: string }[] = [
  { value: "nenhuma", label: "Nenhuma — começando agora" },
  { value: "app_proprio", label: "App próprio da operação" },
  { value: "terceiro", label: "Solução de terceiro / SaaS" },
  { value: "planilha", label: "Controle manual / planilha" },
  { value: "outro", label: "Outra abordagem" },
];

export const OPCOES_CANAL_CONTATO: { value: CanalContato; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "E-mail" },
  { value: "ligacao", label: "Ligação" },
];

export const OPCOES_JANELA: { value: JanelaContato; label: string }[] = [
  { value: "manha", label: "Manhã (08h–12h)" },
  { value: "tarde", label: "Tarde (13h–18h)" },
  { value: "noite", label: "Noite (após 18h)" },
];

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  novo: { label: "Novo", color: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30" },
  contatado: { label: "Contatado", color: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  qualificado: { label: "Qualificado", color: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30" },
  convertido: { label: "Convertido", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  descartado: { label: "Descartado", color: "bg-muted text-muted-foreground border-border" },
};