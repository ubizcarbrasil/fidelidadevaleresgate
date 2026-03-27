import { useQuery } from "@tanstack/react-query";
import { fetchGovernanceKpis, type SourceSystem } from "@/lib/api/offerGovernance";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, CheckCircle, XCircle, AlertTriangle, Archive, Layers } from "lucide-react";

interface Props {
  brandId: string;
  origin: SourceSystem;
}

const KPI_CONFIG = [
  { key: "totalGrupos", label: "Grupos", icon: Layers, color: "text-blue-400" },
  { key: "totalOfertas", label: "Total Ofertas", icon: Package, color: "text-foreground" },
  { key: "totalAtivas", label: "Ativas", icon: CheckCircle, color: "text-emerald-400" },
  { key: "totalRemovidas", label: "Removidas", icon: XCircle, color: "text-red-400" },
  { key: "totalDenunciadas", label: "Denunciadas", icon: AlertTriangle, color: "text-amber-400" },
  { key: "totalArquivadas", label: "Arquivadas", icon: Archive, color: "text-muted-foreground" },
] as const;

export default function GovernanceKpis({ brandId, origin }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["governance-kpis", brandId, origin],
    queryFn: () => fetchGovernanceKpis(brandId, origin),
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {KPI_CONFIG.map((kpi) => (
        <Card key={kpi.key} className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className="text-2xl font-bold text-foreground">
                {data?.[kpi.key] ?? 0}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
