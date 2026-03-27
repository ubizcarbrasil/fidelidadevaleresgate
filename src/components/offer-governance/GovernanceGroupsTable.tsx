import { useQuery } from "@tanstack/react-query";
import { fetchSyncGroups, type SourceSystem } from "@/lib/api/offerGovernance";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  brandId: string;
  origin: SourceSystem;
}

const SYNC_STATUS_COLORS: Record<string, string> = {
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  partial: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  error: "bg-red-500/15 text-red-400 border-red-500/30",
  pending: "bg-muted text-muted-foreground border-border",
};

export default function GovernanceGroupsTable({ brandId, origin }: Props) {
  const { data: groups, isLoading } = useQuery({
    queryKey: ["governance-groups", brandId, origin],
    queryFn: () => fetchSyncGroups(brandId, origin),
  });

  return (
    <div className="rounded-lg border border-border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Grupo</TableHead>
            <TableHead>Importados</TableHead>
            <TableHead>Ativas</TableHead>
            <TableHead>Removidas</TableHead>
            <TableHead>Denunciadas</TableHead>
            <TableHead>Última Sync</TableHead>
            <TableHead>Status Sync</TableHead>
            <TableHead>Versão</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell>
              </TableRow>
            ))
          ) : !groups?.length ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                Nenhum grupo de sincronização encontrado
              </TableCell>
            </TableRow>
          ) : (
            groups.map((g: any) => (
              <TableRow key={g.id}>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium">{g.source_group_name || g.source_group_id}</p>
                    <p className="text-xs text-muted-foreground">{g.source_group_id}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{g.total_imported}</TableCell>
                <TableCell className="text-sm text-emerald-400">{g.total_active}</TableCell>
                <TableCell className="text-sm text-red-400">{g.total_removed}</TableCell>
                <TableCell className="text-sm text-amber-400">{g.total_reported}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {g.last_sync_at ? new Date(g.last_sync_at).toLocaleString("pt-BR") : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={SYNC_STATUS_COLORS[g.last_sync_status] || ""}>
                    {g.last_sync_status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">v{g.sync_version}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
