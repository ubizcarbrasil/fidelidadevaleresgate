import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DataTableControls } from "@/components/DataTableControls";
import { useDebounce } from "@/hooks/useDebounce";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { TelaCarregamentoInline } from "@/compartilhados/components/tela_carregamento";

const PAGE_SIZE = 30;

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);
  const { isRootAdmin, currentBrandId, currentBranchId } = useBrandGuard();

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", debouncedSearch, page, currentBrandId, currentBranchId],
    queryFn: async () => {
      let query = supabase.from("audit_logs").select("*", { count: "exact" });
      if (debouncedSearch) query = query.or(`action.ilike.%${debouncedSearch}%,entity_type.ilike.%${debouncedSearch}%`);
      // Non-root users: RLS already filters by scope, but we also apply explicit filter for UX
      if (!isRootAdmin && currentBranchId) {
        query = query.eq("scope_type", "BRANCH").eq("scope_id", currentBranchId);
      } else if (!isRootAdmin && currentBrandId) {
        query = query.eq("scope_type", "BRAND").eq("scope_id", currentBrandId);
      }
      query = query.order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: data, count: count ?? 0 };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Auditoria Global</h2>
        <p className="text-muted-foreground">Registro de ações na plataforma</p>
      </div>
      <DataTableControls search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} searchPlaceholder="Buscar por ação ou entidade..." page={page} pageSize={PAGE_SIZE} totalCount={data?.count ?? 0} onPageChange={setPage} />
      <Card>
        <CardContent className="p-0">
          {isLoading ? <TelaCarregamentoInline /> : (
          <Table>
            <TableHeader><TableRow><TableHead>Data/Hora</TableHead><TableHead>Ação</TableHead><TableHead>Entidade</TableHead><TableHead>Detalhes</TableHead></TableRow></TableHeader>
            <TableBody>
              {data?.rows?.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum registro de auditoria</TableCell></TableRow>}
              {data?.rows?.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(l.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}</TableCell>
                  <TableCell><Badge variant="outline">{l.action}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{l.entity_type}{l.entity_id ? ` #${String(l.entity_id).slice(0, 8)}` : ""}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{JSON.stringify(l.details_json)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>)}
        </CardContent>
      </Card>
    </div>
  );
}
