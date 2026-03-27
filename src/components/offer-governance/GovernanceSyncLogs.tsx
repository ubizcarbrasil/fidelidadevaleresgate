import { useQuery } from "@tanstack/react-query";
import { fetchSyncLogs } from "@/lib/api/offerGovernance";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  brandId: string;
}

const LOG_STATUS_COLORS: Record<string, string> = {
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  partial: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  error: "bg-red-500/15 text-red-400 border-red-500/30",
};

export default function GovernanceSyncLogs({ brandId }: Props) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["governance-sync-logs", brandId],
    queryFn: () => fetchSyncLogs(brandId),
  });

  return (
    <div className="rounded-lg border border-border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Início</TableHead>
            <TableHead>Fim</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Lidos</TableHead>
            <TableHead>Novos</TableHead>
            <TableHead>Atualizados</TableHead>
            <TableHead>Erros</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell>
              </TableRow>
            ))
          ) : !logs?.length ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Nenhum log de sincronização
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log: any) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs">
                  {new Date(log.started_at).toLocaleString("pt-BR")}
                </TableCell>
                <TableCell className="text-xs">
                  {log.finished_at ? new Date(log.finished_at).toLocaleString("pt-BR") : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={LOG_STATUS_COLORS[log.status] || ""}>
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{log.total_read ?? "—"}</TableCell>
                <TableCell className="text-sm text-emerald-400">{log.new_count ?? "—"}</TableCell>
                <TableCell className="text-sm text-blue-400">{log.updated_count ?? "—"}</TableCell>
                <TableCell className="text-sm text-red-400">{log.error_count ?? "—"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
