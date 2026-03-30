import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, Gift, Car } from "lucide-react";
import type { DriverRow } from "@/pages/DriverManagementPage";
import DriverScoringToggle from "../DriverScoringToggle";
import { formatPoints } from "@/lib/formatPoints";

interface Props {
  driver: DriverRow;
  onAddPoints: () => void;
}

export default function AbaPontuacaoMotorista({ driver, onAddPoints }: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saldo de Pontos</h4>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Saldo atual</span>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-400/30 text-sm font-mono">
            <Coins className="h-3.5 w-3.5 mr-1" />
            {driver.points_balance} pts
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Pontos de corridas</span>
          <Badge className="bg-blue-500/10 text-blue-400 border border-blue-400/30 text-sm font-mono">
            +{driver.total_ride_points} pts
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Corridas realizadas</span>
          <Badge variant="outline" className="text-sm font-mono">
            <Car className="h-3.5 w-3.5 mr-1" />
            {driver.total_rides}
          </Badge>
        </div>
      </div>

      <Button size="sm" variant="outline" onClick={onAddPoints} className="w-full">
        <Gift className="h-3.5 w-3.5 mr-1" />
        Adicionar Pontos
      </Button>

      <DriverScoringToggle driver={driver} />
    </div>
  );
}
