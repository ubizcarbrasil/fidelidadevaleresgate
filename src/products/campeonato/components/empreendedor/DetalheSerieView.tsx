import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDetalheSerie } from "../../hooks/hook_campeonato_empreendedor";

interface Props {
  open: boolean;
  onClose: () => void;
  seasonId: string;
  tierId: string | null;
  tierName: string | null;
}

export default function DetalheSerieView({
  open,
  onClose,
  seasonId,
  tierId,
  tierName,
}: Props) {
  const { data, isLoading } = useDetalheSerie(seasonId, tierId);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Série {tierName ?? "—"}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : !data || data.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum motorista nesta série ainda.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Motorista</TableHead>
                <TableHead className="text-right">Pontos</TableHead>
                <TableHead className="text-right">FDS</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => (
                <TableRow key={row.driver_id}>
                  <TableCell className="font-mono text-xs">
                    {row.position_in_tier ?? idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{row.driver_name ?? "—"}</span>
                      {row.source === "manual_add" && (
                        <Badge variant="outline" className="h-4 text-[10px]">
                          Manual
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {row.points}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {row.weekend_rides_count}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.qualified ? (
                      <Badge className="text-xs">Qualificado</Badge>
                    ) : row.relegated_auto ? (
                      <Badge variant="destructive" className="text-xs">
                        Rebaixado
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Em disputa
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
