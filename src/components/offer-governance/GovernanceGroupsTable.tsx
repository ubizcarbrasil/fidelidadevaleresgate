import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSyncGroups, syncGroupNow, resetGroup, cleanupGroupByStatus, type SourceSystem } from "@/lib/api/offerGovernance";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { RefreshCw, MoreVertical, Archive, Trash2, AlertTriangle, RotateCcw } from "lucide-react";
import { useState } from "react";

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
  const queryClient = useQueryClient();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const { data: groups, isLoading } = useQuery({
    queryKey: ["governance-groups", brandId, origin],
    queryFn: () => fetchSyncGroups(brandId, origin),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["governance-groups"] });
    queryClient.invalidateQueries({ queryKey: ["governance-kpis"] });
    queryClient.invalidateQueries({ queryKey: ["governance-deals"] });
  };

  const handleSync = async () => {
    setLoadingAction("sync");
    try {
      await syncGroupNow(brandId, origin);
      toast.success("Sincronização concluída");
      invalidateAll();
    } catch {
      toast.error("Erro ao sincronizar");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReset = async (groupId: string) => {
    setLoadingAction(`reset-${groupId}`);
    try {
      await resetGroup(brandId, origin, groupId);
      toast.success("Grupo resetado");
      invalidateAll();
    } catch {
      toast.error("Erro ao resetar grupo");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCleanup = async (statusFilter: string, label: string) => {
    setLoadingAction(`cleanup-${statusFilter}`);
    try {
      await cleanupGroupByStatus(brandId, origin, statusFilter);
      toast.success(`${label} arquivadas`);
      invalidateAll();
    } catch {
      toast.error("Erro ao limpar");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Grupos de sincronização</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleSync} disabled={loadingAction === "sync"}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loadingAction === "sync" ? "animate-spin" : ""}`} />
            Sincronizar agora
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Trash2 className="h-4 w-4 mr-1" /> Limpeza
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleCleanup("sync_error", "Ofertas com erro")}>
                <AlertTriangle className="h-4 w-4 mr-2 text-red-400" /> Limpar com erro
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCleanup("removed_from_source", "Removidas da origem")}>
                <Trash2 className="h-4 w-4 mr-2 text-muted-foreground" /> Limpar removidas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCleanup("user_reported", "Denunciadas")}>
                <AlertTriangle className="h-4 w-4 mr-2 text-amber-400" /> Limpar denunciadas
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

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
              <TableHead className="w-[60px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={9}><Skeleton className="h-10 w-full" /></TableCell>
                </TableRow>
              ))
            ) : !groups?.length ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
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
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleReset(g.source_group_id)}>
                          <RotateCcw className="h-4 w-4 mr-2" /> Resetar grupo
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleReset(g.source_group_id)}>
                          <Archive className="h-4 w-4 mr-2" /> Arquivar ofertas
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
