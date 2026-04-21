import { CheckCircle2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CORES_BLOQUEIO, ROTULOS_BLOQUEIO } from "../constants/constantes_auditoria";
import type { CodigoBloqueioAuditoria, ResultadoAuditoria } from "../types/tipos_auditoria";

interface Props {
  outcome: ResultadoAuditoria;
  code?: CodigoBloqueioAuditoria | null;
}

export default function BadgeResultadoAuditoria({ outcome, code }: Props) {
  if (outcome === "success") {
    return (
      <Badge variant="outline" className="gap-1 border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" /> Sucesso
      </Badge>
    );
  }
  const cor = code ? CORES_BLOQUEIO[code] : "bg-muted text-muted-foreground";
  const rotulo = code ? ROTULOS_BLOQUEIO[code] : "Bloqueado";
  return (
    <Badge variant="outline" className={`gap-1 border-transparent ${cor}`}>
      <ShieldAlert className="h-3 w-3" /> {rotulo}
    </Badge>
  );
}
