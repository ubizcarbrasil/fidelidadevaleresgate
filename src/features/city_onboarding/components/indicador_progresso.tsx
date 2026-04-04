import { Progress } from "@/components/ui/progress";
import type { ValidacaoCidade } from "../types/tipos_onboarding";

export function IndicadorProgresso({ validacao }: { validacao: ValidacaoCidade | undefined }) {
  if (!validacao) return null;

  const entries = Object.values(validacao);
  const aplicaveis = entries.filter((v) => v.status !== "nao_aplicavel");
  const concluidas = aplicaveis.filter((v) => v.status === "concluida").length;
  const total = aplicaveis.length;
  const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{concluidas} de {total} etapas concluídas</span>
        <span className="font-semibold">{pct}%</span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}
