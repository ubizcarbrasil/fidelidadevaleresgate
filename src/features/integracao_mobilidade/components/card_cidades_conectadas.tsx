import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Hash, Coins } from "lucide-react";
import type { Integration } from "../hooks/hook_integracoes";

interface Props {
  activeIntegrations: Integration[];
  selectedBranchId: string | null;
  onSelectBranch: (branchId: string) => void;
  getBranchName: (id: string | null) => string;
}

export function CardCidadesConectadas({
  activeIntegrations,
  selectedBranchId,
  onSelectBranch,
  getBranchName,
}: Props) {
  if (activeIntegrations.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-5 w-5 text-primary" />
          Cidades conectadas ({activeIntegrations.length})
        </CardTitle>
        <CardDescription>
          Clique em uma cidade para ver e configurar a pontuação do motorista, webhook e diagnóstico.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {activeIntegrations.map((integ) => {
            const hasCredentials = Boolean(integ.basic_auth_user && integ.basic_auth_password);
            const isSelected = selectedBranchId === integ.branch_id;
            return (
              <div
                key={integ.id}
                onClick={() => integ.branch_id && onSelectBranch(integ.branch_id)}
                className={`cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md ${
                  isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">{getBranchName(integ.branch_id)}</span>
                  <Badge variant={hasCredentials ? "default" : "destructive"} className="text-xs">
                    {hasCredentials ? "Ativo" : "Sem credenciais"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    <span>{integ.total_rides} corridas</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Coins className="h-3 w-3" />
                    <span>{integ.total_points} pts</span>
                  </div>
                </div>
                {integ.last_ride_processed_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Última: {new Date(integ.last_ride_processed_at).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
