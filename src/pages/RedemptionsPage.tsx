import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DataTableControls } from "@/components/DataTableControls";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import type { Database } from "@/integrations/supabase/types";

type RedemptionStatus = Database["public"]["Enums"]["redemption_status"];
const STATUS_VARIANT: Record<RedemptionStatus, string> = { PENDING: "outline", USED: "default", EXPIRED: "secondary", CANCELED: "destructive" };

const PAGE_SIZE = 20;

export default function RedemptionsPage() {
  const { currentBrandId, isRootAdmin } = useBrandGuard();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["redemptions", debouncedSearch, page, currentBrandId],
    queryFn: async () => {
      let query = supabase.from("redemptions")
        .select("*, offers(title), customers(name), branches(name)", { count: "exact" });
      if (!isRootAdmin && currentBrandId) query = query.eq("brand_id", currentBrandId);
      if (debouncedSearch) query = query.ilike("token", `%${debouncedSearch}%`);
      const from = (page - 1) * PAGE_SIZE;
      const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      return { items: data, total: count || 0 };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Resgates</h2>
        <p className="text-muted-foreground">Histórico de resgates por filial</p>
      </div>

      <DataTableControls search={search} onSearchChange={setSearch} searchPlaceholder="Buscar por token..." page={page} pageSize={PAGE_SIZE} totalCount={data?.total || 0} onPageChange={setPage} />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Oferta</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Filial</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Valor Compra</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>}
              {!isLoading && data?.items?.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum resgate encontrado</TableCell></TableRow>}
              {data?.items?.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs whitespace-nowrap">{format(new Date(r.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}</TableCell>
                  <TableCell className="font-medium">{(r.offers as any)?.title}</TableCell>
                  <TableCell>{(r.customers as any)?.name}</TableCell>
                  <TableCell>{(r.branches as any)?.name}</TableCell>
                  <TableCell className="font-mono text-xs">{r.token.slice(0, 8)}…</TableCell>
                  <TableCell>{r.purchase_value ? `R$ ${Number(r.purchase_value).toFixed(2)}` : "—"}</TableCell>
                  <TableCell><Badge variant={(STATUS_VARIANT[r.status as RedemptionStatus] || "secondary") as any}>{r.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
