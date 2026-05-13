import { Calendar, User, Hash } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import BadgeResultadoAuditoria from "./badge_resultado_auditoria";
import TabelaDivergencias from "./tabela_divergencias";
import type { RegistroAuditoria } from "../types/tipos_auditoria";

interface Props {
  registro: RegistroAuditoria;
}

function formatarData(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function CardRegistroAuditoria({ registro }: Props) {
  const temDivergencias =
    registro.block_code === "divergent_points" &&
    registro.divergent_sample.length > 0;

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-2 p-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <BadgeResultadoAuditoria
              outcome={registro.outcome}
              code={registro.block_code}
            />
            {registro.season_name && (
              <span className="text-sm font-semibold">{registro.season_name}</span>
            )}
          </div>
          {registro.block_reason && (
            <p className="text-sm text-muted-foreground">{registro.block_reason}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {formatarData(registro.created_at)}
            </span>
            {registro.attempted_by && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {registro.attempted_by.slice(0, 8)}…
              </span>
            )}
            {registro.eligible_count !== null && (
              <span className="flex items-center gap-1">
                <Hash className="h-3 w-3" /> Elegíveis: {registro.eligible_count}/
                {registro.required_count ?? "—"}
              </span>
            )}
            {registro.divergent_count !== null && registro.divergent_count > 0 && (
              <span className="flex items-center gap-1 font-medium text-fuchsia-600 dark:text-fuchsia-400">
                <Hash className="h-3 w-3" /> Divergentes: {registro.divergent_count}
              </span>
            )}
          </div>
        </div>
      </div>

      {temDivergencias && (
        <Accordion type="single" collapsible className="border-t border-border px-4">
          <AccordionItem value="divergencias" className="border-0">
            <AccordionTrigger className="py-3 text-xs font-medium">
              Ver amostra de divergências ({registro.divergent_sample.length})
            </AccordionTrigger>
            <AccordionContent>
              <TabelaDivergencias
                divergencias={registro.divergent_sample}
                totalDivergentes={registro.divergent_count ?? 0}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
