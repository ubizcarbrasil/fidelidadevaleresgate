import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, Route } from "lucide-react";
import { useSalvarConfigDuelo } from "../hooks/hook_config_duelo_avancada";

interface Props { branchId: string; settings: Record<string, any>; }

export default function AbaIntegracaoCorridas({ branchId, settings }: Props) {
  const [enabled, setEnabled] = useState<boolean>(settings.duel_count_ride_points === true);
  const [factor, setFactor] = useState<number>(Number(settings.duel_ride_points_factor ?? 1));
  const salvar = useSalvarConfigDuelo(branchId, settings);

  const handleSalvar = () => {
    salvar.mutate({
      duel_count_ride_points: enabled,
      duel_ride_points_factor: factor,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Route className="h-4 w-4 text-primary" /> Integração com Corridas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex-1">
            <p className="text-sm font-medium">Pontos de corrida somam no saldo de duelo</p>
            <p className="text-xs text-muted-foreground">Quando ativado, motoristas podem usar pontos de corridas para apostar e resgatar prêmios.</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {enabled && (
          <div className="space-y-2">
            <Label className="text-xs">Fator de conversão (1 corrida = X pontos)</Label>
            <Input type="number" min={0} step={0.1} value={factor} onChange={(e) => setFactor(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground">
              Exemplo: com fator <strong>{factor}</strong>, 10 corridas equivalem a {(10 * factor).toLocaleString("pt-BR")} pontos no saldo de duelo.
            </p>
          </div>
        )}

        <Button onClick={handleSalvar} disabled={salvar.isPending} className="w-full sm:w-auto">
          <Save className="h-4 w-4 mr-2" />
          {salvar.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </CardContent>
    </Card>
  );
}