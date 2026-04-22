import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Trophy, Users } from "lucide-react";
import type { SerieDashboard } from "../../types/tipos_empreendedor";

interface Props {
  serie: SerieDashboard;
  aoVerDetalhes: () => void;
}

export default function CardResumoSerie({ serie, aoVerDetalhes }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Série {serie.tier_name}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {serie.members_count} motorista{serie.members_count === 1 ? "" : "s"}
            </p>
          </div>
          <Badge variant="secondary" className="gap-1 text-xs">
            <Users className="h-3 w-3" /> {serie.qualified_count}/16
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {serie.top.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem motoristas pontuando ainda.</p>
        ) : (
          <ul className="space-y-1.5">
            {serie.top.slice(0, 3).map((d, idx) => (
              <li
                key={d.driver_id}
                className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2 py-1.5"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Badge
                    variant={idx === 0 ? "default" : "outline"}
                    className="h-5 w-5 justify-center p-0 text-[10px]"
                  >
                    {idx + 1}
                  </Badge>
                  <span className="truncate text-xs font-medium">
                    {d.driver_name ?? "—"}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold">
                  <Trophy className="h-3 w-3 text-amber-500" /> {d.points}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={aoVerDetalhes}
        >
          <Eye className="mr-2 h-3.5 w-3.5" /> Ver série completa
        </Button>
      </CardContent>
    </Card>
  );
}
