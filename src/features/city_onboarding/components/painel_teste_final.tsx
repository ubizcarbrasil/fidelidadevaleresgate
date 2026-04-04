import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { IndicadorStatus } from "./indicador_status";
import type { ValidacaoCidade } from "../types/tipos_onboarding";

const LABELS: Record<keyof ValidacaoCidade, string> = {
  cidadeCriada: "Cidade criada",
  modeloNegocio: "Modelo de negócio",
  parceiros: "Parceiros ativos",
  regrasPontos: "Regras de pontos",
  integracaoMobilidade: "Integração mobilidade",
  carteiraPontos: "Carteira de pontos",
  ofertasAtivas: "Ofertas ativas",
};

export function PainelTesteFinal({
  validacao,
  isLoading,
}: {
  validacao: ValidacaoCidade | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-5 flex items-center gap-3 justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Validando configurações…</span>
        </CardContent>
      </Card>
    );
  }

  if (!validacao) return null;

  const entries = Object.entries(validacao) as [keyof ValidacaoCidade, ValidacaoCidade[keyof ValidacaoCidade]][];
  const aplicaveis = entries.filter(([, v]) => v.status !== "nao_aplicavel");
  const concluidas = aplicaveis.filter(([, v]) => v.status === "concluida").length;
  const total = aplicaveis.length;
  const todosOk = concluidas === total;

  return (
    <Card className={`rounded-2xl border-0 shadow-sm ${
      todosOk
        ? "bg-gradient-to-br from-green-500/5 to-green-500/10"
        : "bg-gradient-to-br from-yellow-500/5 to-yellow-500/10"
    }`}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          {todosOk ? (
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
          )}
          <div>
            <h3 className="font-bold text-sm mb-1">
              {todosOk ? "Cidade pronta para operar! 🎉" : "Pendências encontradas"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {todosOk
                ? "Todas as configurações estão concluídas. A cidade está pronta."
                : `${total - concluidas} etapa(s) pendente(s) — configure antes de operar.`}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant={todosOk ? "default" : "secondary"} className="text-xs">
                {concluidas}/{total} concluídas
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          {entries.map(([key, val]) => (
            <div key={key} className="flex items-center gap-2 text-xs">
              <IndicadorStatus status={val.status} />
              <span className="text-foreground/80">{LABELS[key]}</span>
              <span className="ml-auto text-muted-foreground truncate max-w-[180px]">
                {val.mensagem}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
