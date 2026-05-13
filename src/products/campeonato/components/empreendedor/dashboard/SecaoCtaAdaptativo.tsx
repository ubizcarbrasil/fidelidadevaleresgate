import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Trophy,
  Users,
  Layers,
} from "lucide-react";
import type { FaseCampeonato } from "../../../types/tipos_campeonato";
import type { KpisCampeonato } from "../../../types/tipos_dashboard_kpis";

interface Props {
  phase: FaseCampeonato | "cancelled";
  kpis: KpisCampeonato;
  knockoutStartsAt: string;
  knockoutEndsAt: string;
  onAcaoPrincipal?: () => void;
}

/**
 * Seção 4 do Dashboard de Operação do Campeonato.
 * Sugere a próxima ação relevante baseada na fase + estado dos KPIs.
 * Mantém o admin focado no que importa agora.
 */
export default function SecaoCtaAdaptativo({
  phase,
  kpis,
  knockoutStartsAt,
  knockoutEndsAt,
  onAcaoPrincipal,
}: Props) {
  const cfg = derivarCta(phase, kpis, knockoutStartsAt, knockoutEndsAt);

  return (
    <Card className={cfg.containerClass}>
      <CardContent className="flex items-start gap-3 p-4">
        <cfg.Icon className={`h-5 w-5 shrink-0 ${cfg.iconClass}`} />
        <div className="flex-1 space-y-1">
          <p className={`text-sm font-semibold ${cfg.titleClass}`}>
            {cfg.titulo}
          </p>
          <p className={`text-xs ${cfg.descClass}`}>{cfg.descricao}</p>
        </div>
        {cfg.cta && onAcaoPrincipal ? (
          <Button
            size="sm"
            variant={cfg.ctaVariant}
            onClick={onAcaoPrincipal}
            className="shrink-0"
          >
            {cfg.cta}
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function derivarCta(
  phase: FaseCampeonato | "cancelled",
  kpis: KpisCampeonato,
  knockoutStartsAt: string,
  knockoutEndsAt: string,
) {
  const agora = Date.now();
  const inicioMataMata = new Date(knockoutStartsAt).getTime();
  const fimMataMata = new Date(knockoutEndsAt).getTime();
  const horasParaMataMata = (inicioMataMata - agora) / (1000 * 60 * 60);

  // Caso 1: temporada finalizada — coroar campeões
  if (phase === "finished") {
    return {
      Icon: Trophy,
      iconClass: "text-amber-500",
      titulo: "Temporada encerrada",
      descricao:
        "Confira os pódios e distribua os prêmios pendentes para fechar o ciclo.",
      cta: "Ver pódios",
      ctaVariant: "default" as const,
      containerClass:
        "border-amber-300 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20",
      titleClass: "text-amber-900 dark:text-amber-100",
      descClass: "text-amber-800/90 dark:text-amber-200/80",
    };
  }

  // Caso 2: nenhum motorista distribuído ainda
  if (kpis.total_drivers === 0) {
    return {
      Icon: AlertTriangle,
      iconClass: "text-amber-600",
      titulo: "Sem motoristas no campeonato",
      descricao:
        "Nenhum motorista foi inscrito ainda. Importe ou habilite motoristas para iniciar a competição.",
      cta: "Gerenciar motoristas",
      ctaVariant: "default" as const,
      containerClass:
        "border-amber-300 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20",
      titleClass: "text-amber-900 dark:text-amber-100",
      descClass: "text-amber-800/90 dark:text-amber-200/80",
    };
  }

  // Caso 3: motoristas existem mas Séries A e B estão vazias (todos em C / sem seeding)
  if (kpis.by_tier.A === 0 && kpis.by_tier.B === 0 && kpis.by_tier.C > 0) {
    return {
      Icon: Layers,
      iconClass: "text-amber-600",
      titulo: "Séries A e B vazias",
      descricao: `${kpis.by_tier.C} motoristas concentrados na Série C. Faça o seeding para promover os melhores às Séries A e B e iniciar a disputa.`,
      cta: "Fazer seeding",
      ctaVariant: "default" as const,
      containerClass:
        "border-amber-300 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20",
      titleClass: "text-amber-900 dark:text-amber-100",
      descClass: "text-amber-800/90 dark:text-amber-200/80",
    };
  }

  // Caso 3b: apenas uma das séries de elite vazia — sugerir rebalanceamento
  if (
    phase === "classification" &&
    (kpis.by_tier.A === 0 || kpis.by_tier.B === 0)
  ) {
    const serieVazia = kpis.by_tier.A === 0 ? "A" : "B";
    return {
      Icon: Layers,
      iconClass: "text-orange-600",
      titulo: `Série ${serieVazia} sem motoristas`,
      descricao:
        "Distribuição desbalanceada entre as séries. Revise o seeding para garantir competição equilibrada.",
      cta: "Revisar séries",
      ctaVariant: "default" as const,
      containerClass:
        "border-orange-300 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/20",
      titleClass: "text-orange-900 dark:text-orange-100",
      descClass: "text-orange-800/90 dark:text-orange-200/80",
    };
  }

  // Caso 4: classificação + pouco tempo até mata-mata (<24h) — revisar bracket
  if (phase === "classification" && horasParaMataMata > 0 && horasParaMataMata < 24) {
    return {
      Icon: Users,
      iconClass: "text-orange-600",
      titulo: "Mata-mata começa em breve",
      descricao: `Falta menos de 24h para o início. Revise o bracket gerado a partir da classificação.`,
      cta: "Ver bracket",
      ctaVariant: "default" as const,
      containerClass:
        "border-orange-300 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/20",
      titleClass: "text-orange-900 dark:text-orange-100",
      descClass: "text-orange-800/90 dark:text-orange-200/80",
    };
  }

  // Caso 5: mata-mata em andamento — acompanhar
  if (phase !== "classification" && agora >= inicioMataMata && agora <= fimMataMata) {
    return {
      Icon: Trophy,
      iconClass: "text-purple-600",
      titulo: "Mata-mata em andamento",
      descricao:
        "Acompanhe os duelos e garanta que os pódios fiquem prontos para o encerramento.",
      cta: "Acompanhar",
      ctaVariant: "outline" as const,
      containerClass:
        "border-purple-300 bg-purple-50 dark:border-purple-900/50 dark:bg-purple-950/20",
      titleClass: "text-purple-900 dark:text-purple-100",
      descClass: "text-purple-800/90 dark:text-purple-200/80",
    };
  }

  // Caso 6 (default): operação saudável durante classificação
  return {
    Icon: CheckCircle2,
    iconClass: "text-emerald-600",
    titulo: "Tudo em ordem",
    descricao: `${kpis.total_drivers} motoristas competindo (A:${kpis.by_tier.A} · B:${kpis.by_tier.B} · C:${kpis.by_tier.C}) · ${kpis.events_last_24h} ações nas últimas 24h.`,
    cta: undefined,
    ctaVariant: "outline" as const,
    containerClass:
      "border-emerald-300 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20",
    titleClass: "text-emerald-900 dark:text-emerald-100",
    descClass: "text-emerald-800/90 dark:text-emerald-200/80",
  };
}