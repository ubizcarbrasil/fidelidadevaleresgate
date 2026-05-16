import { CheckCircle2 } from "lucide-react";

const RECURSOS = [
  'Menu "Campeonato" no painel do empreendedor',
  'Card "Campeonato" no app do motorista (com inscrição)',
  "Distribuição automática de motoristas em séries",
  "Editor de prêmios por temporada",
  "Cron de avanço de fases automatizado",
] as const;

export default function ChecklistRecursosAtivados() {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        O que será habilitado
      </p>
      <ul className="space-y-2">
        {RECURSOS.map((r) => (
          <li key={r} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}