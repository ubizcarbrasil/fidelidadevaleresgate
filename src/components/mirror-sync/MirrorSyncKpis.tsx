import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { RefreshCw, Package, Eye, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { triggerMirrorSync, fetchMirroredDeals, fetchSyncLogs } from "@/lib/api/mirrorSync";

interface Props {
  brandId: string;
  refreshKey: number;
  onSyncDone: () => void;
  sourceType?: string;
}

export default function MirrorSyncKpis({ brandId, refreshKey, onSyncDone, sourceType = "divulgador_inteligente" }: Props) {
  const [syncing, setSyncing] = useState(false);

  const { data: deals } = useQuery({
    queryKey: ["mirror-deals-kpis", brandId, refreshKey],
    queryFn: () => fetchMirroredDeals(brandId),
  });

  const { data: logs } = useQuery({
    queryKey: ["mirror-logs-latest", brandId, refreshKey],
    queryFn: () => fetchSyncLogs(brandId, 1),
  });

  const lastLog = logs?.[0];
  const total = deals?.length || 0;
  const active = deals?.filter((d: any) => d.is_active)?.length || 0;
  const visible = deals?.filter((d: any) => d.visible_driver)?.length || 0;
  const errors = deals?.filter((d: any) => d.sync_status === "error")?.length || 0;

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await triggerMirrorSync(brandId, sourceType);
      toast.success(result.summary || "Sincronização concluída!");
      onSyncDone();
    } catch (e: any) {
      toast.error("Erro na sincronização: " + e.message);
    } finally {
      setSyncing(false);
    }
  };

  const kpis = [
    { label: "Total Importadas", value: total, icon: Package, color: "text-primary" },
    { label: "Ativas", value: active, icon: CheckCircle2, color: "text-emerald-500" },
    { label: "Visíveis Motorista", value: visible, icon: Eye, color: "text-blue-500" },
    { label: "Com Erro", value: errors, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {lastLog ? (
            <>
              Última sync:{" "}
              <span className="font-medium text-foreground">
                {new Date(lastLog.started_at).toLocaleString("pt-BR")}
              </span>
              {" — "}
              <span className={lastLog.status === "success" ? "text-emerald-500" : "text-destructive"}>
                {lastLog.status}
              </span>
            </>
          ) : (
            "Nenhuma sincronização realizada"
          )}
        </div>
        <Button onClick={handleSync} disabled={syncing} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Sincronizando..." : "Sincronizar agora"}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              <div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
