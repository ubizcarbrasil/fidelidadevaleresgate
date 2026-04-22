import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { History } from "lucide-react";
import { useTemporadasMarca } from "../../hooks/hook_campeonato_empreendedor";
import {
  CORES_FASE,
  ROTULOS_FASE,
} from "../../constants/constantes_campeonato";
import { formatarData } from "../../utils/utilitarios_campeonato";
import type { StatusFiltroSeason } from "../../types/tipos_empreendedor";

interface Props {
  brandId: string;
}

export default function ListaTemporadasAnteriores({ brandId }: Props) {
  const [filtro, setFiltro] = useState<StatusFiltroSeason>("all");
  const { data, isLoading } = useTemporadasMarca(brandId, filtro);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" /> Histórico de temporadas
          </CardTitle>
        </div>
        <Tabs value={filtro} onValueChange={(v) => setFiltro(v as StatusFiltroSeason)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="text-xs">Todas</TabsTrigger>
            <TabsTrigger value="active" className="text-xs">Ativas</TabsTrigger>
            <TabsTrigger value="finished" className="text-xs">Finalizadas</TabsTrigger>
            <TabsTrigger value="cancelled" className="text-xs">Canceladas</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : !data || data.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma temporada encontrada.
          </p>
        ) : (
          <ul className="space-y-2">
            {data.map((s) => {
              const fase = (s.phase ?? "classification") as keyof typeof ROTULOS_FASE;
              const corClass = CORES_FASE[fase] ?? "bg-muted text-muted-foreground";
              return (
                <li
                  key={s.id}
                  className="flex flex-col gap-1 rounded-md border border-border bg-muted/20 p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.branch_name ?? "—"} ·{" "}
                      {formatarData(s.classification_starts_at)} →{" "}
                      {formatarData(s.knockout_ends_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${corClass}`} variant="outline">
                      {ROTULOS_FASE[fase] ?? fase}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {s.tiers_count} série{s.tiers_count === 1 ? "" : "s"}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
