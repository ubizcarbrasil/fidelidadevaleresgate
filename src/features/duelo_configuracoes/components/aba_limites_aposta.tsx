import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, Coins } from "lucide-react";
import { useSalvarConfigDuelo } from "../hooks/hook_config_duelo_avancada";
import { schemaLimitesAposta } from "../schemas/schema_limites_aposta";
import { toast } from "sonner";

interface Props { branchId: string; settings: Record<string, any>; }

function nullableNumber(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export default function AbaLimitesAposta({ branchId, settings }: Props) {
  const [minInd, setMinInd] = useState<string>(settings.duel_bet_min_individual?.toString() ?? "");
  const [maxInd, setMaxInd] = useState<string>(settings.duel_bet_max_individual?.toString() ?? "");
  const [maxTot, setMaxTot] = useState<string>(settings.duel_bet_max_total?.toString() ?? "");

  const salvar = useSalvarConfigDuelo(branchId, settings);

  const handleSalvar = () => {
    const payload = {
      duel_bet_min_individual: nullableNumber(minInd),
      duel_bet_max_individual: nullableNumber(maxInd),
      duel_bet_max_total: nullableNumber(maxTot),
    };
    const parsed = schemaLimitesAposta.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    salvar.mutate(payload);
  };

  const exemploMax = Number(maxInd) || 0;
  const exemploTot = exemploMax * 2;
  const limiteTot = Number(maxTot) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Coins className="h-4 w-4 text-primary" /> Limites de Aposta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Defina os limites de pontos que motoristas podem apostar em duelos. Deixe em branco para não aplicar limite.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">Mínimo individual (pontos)</Label>
            <Input type="number" min={0} value={minInd} onChange={(e) => setMinInd(e.target.value)} placeholder="ex: 10" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Máximo individual (pontos)</Label>
            <Input type="number" min={0} value={maxInd} onChange={(e) => setMaxInd(e.target.value)} placeholder="ex: 5000" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Máximo total do duelo (pontos)</Label>
            <Input type="number" min={0} value={maxTot} onChange={(e) => setMaxTot(e.target.value)} placeholder="ex: 10000" />
          </div>
        </div>

        {exemploMax > 0 && (
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <strong>Exemplo:</strong> Motorista A aposta {exemploMax} + Motorista B aposta {exemploMax} = <strong>{exemploTot} pontos</strong>
            {limiteTot > 0 && (
              <span className={exemploTot > limiteTot ? "text-destructive ml-1" : "text-muted-foreground ml-1"}>
                ({exemploTot > limiteTot ? "⚠️ acima" : "✅ dentro"} do limite total de {limiteTot})
              </span>
            )}
          </div>
        )}

        <Button onClick={handleSalvar} disabled={salvar.isPending} className="w-full sm:w-auto">
          <Save className="h-4 w-4 mr-2" />
          {salvar.isPending ? "Salvando..." : "Salvar limites"}
        </Button>
      </CardContent>
    </Card>
  );
}