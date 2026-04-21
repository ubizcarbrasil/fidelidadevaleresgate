import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { useClassificacaoTemporada } from "../hooks/hook_campeonato";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  seasonId: string;
}

export default function TabelaClassificacao({ seasonId }: Props) {
  const { data, isLoading } = useClassificacaoTemporada(seasonId);

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-lg" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Nenhum motorista pontuou nesta temporada ainda.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Motorista</TableHead>
            <TableHead className="text-right">Corridas</TableHead>
            <TableHead className="text-right">5★</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => {
            const posicao = row.position ?? idx + 1;
            const top16 = posicao <= 16;
            return (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-1">
                    {posicao <= 3 && <Trophy className="h-3.5 w-3.5 text-amber-500" />}
                    {posicao}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {row.driver_name ?? row.driver_id.slice(0, 8)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{row.points}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {row.five_star_count}
                </TableCell>
                <TableCell className="text-right">
                  {row.qualified ? (
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-transparent">
                      Classificado
                    </Badge>
                  ) : top16 ? (
                    <Badge variant="outline">Zona de classificação</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Fora
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}