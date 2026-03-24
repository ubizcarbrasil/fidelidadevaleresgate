import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { fetchSyncLogs } from "@/lib/api/mirrorSync";

interface Props {
  brandId: string;
  refreshKey: number;
}

export default function MirrorSyncLogs({ brandId, refreshKey }: Props) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["mirror-sync-logs", brandId, refreshKey],
    queryFn: () => fetchSyncLogs(brandId, 50),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Lidos</TableHead>
            <TableHead>Novos</TableHead>
            <TableHead>Atualizados</TableHead>
            <TableHead>Ignorados</TableHead>
            <TableHead>Erros</TableHead>
            <TableHead>Resumo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                Carregando...
              </TableCell>
            </TableRow>
          ) : !logs?.length ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                Nenhum log de sincronização
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log: any) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs">
                  {new Date(log.started_at).toLocaleString("pt-BR")}
                </TableCell>
                <TableCell>
                  <Badge variant={log.status === "success" ? "default" : log.status === "running" ? "secondary" : "destructive"}>
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell>{log.total_read}</TableCell>
                <TableCell className="text-emerald-500 font-medium">{log.total_new}</TableCell>
                <TableCell>{log.total_updated}</TableCell>
                <TableCell>{log.total_skipped}</TableCell>
                <TableCell className={log.total_errors > 0 ? "text-destructive font-medium" : ""}>
                  {log.total_errors}
                </TableCell>
                <TableCell className="text-xs max-w-[200px] truncate text-muted-foreground">
                  {log.summary || "—"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
