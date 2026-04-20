import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useHistoricoResets } from "../hooks/hook_historico_resets";
import { History, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ACAO_LABEL: Record<string, string> = {
  no_zero: "Sem zerar",
  zero_duel: "Zerou duelo",
  zero_rides: "Zerou corridas",
  zero_both: "Zerou tudo",
};

export default function HistoricoResets({ branchId }: { branchId: string }) {
  const { data, isLoading } = useHistoricoResets(branchId, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4 text-primary" /> Últimos resets executados
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Nenhum reset executado ainda.</p>
        ) : (
          <div className="space-y-2">
            {data.map((h) => (
              <div key={h.id} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between rounded-lg border p-3 text-sm">
                <div>
                  <div className="font-medium">
                    {format(new Date(h.executed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {h.drivers_affected} motoristas · {h.total_points_distributed.toLocaleString("pt-BR")} pontos
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{ACAO_LABEL[h.action_executed] ?? h.action_executed}</Badge>
                  <Badge variant={h.triggered_by === "manual" ? "secondary" : "default"}>
                    {h.triggered_by === "manual" ? "Manual" : "Automático"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}