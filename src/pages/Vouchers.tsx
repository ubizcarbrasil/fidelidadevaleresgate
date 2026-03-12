import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Power, Search } from "lucide-react";
import { toast } from "sonner";
import { DataTableControls } from "@/components/DataTableControls";
import { useDebounce } from "@/hooks/useDebounce";
import { useBrandGuard } from "@/hooks/useBrandGuard";

const PAGE_SIZE = 20;

const statusLabels: Record<string, string> = { ACTIVE: "Ativo", EXPIRED: "Expirado", INACTIVE: "Inativo" };
const statusVariant: Record<string, "default" | "destructive" | "secondary" | "outline"> = { ACTIVE: "default", EXPIRED: "secondary", INACTIVE: "destructive" };

export default function Vouchers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ["coupons", debouncedSearch, page],
    queryFn: async () => {
      let query = supabase.from("coupons").select("*, branches:branch_id(name, brands:brand_id(name))", { count: "exact" });
      if (debouncedSearch) query = query.ilike("code", `%${debouncedSearch}%`);
      query = query.order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: data, count: count ?? 0 };
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      const { error } = await supabase.from("coupons").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["coupons"] }); toast.success("Status atualizado!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cupons</h2>
          <p className="text-muted-foreground">Gerencie os cupons de desconto</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/vouchers/redeem"><Search className="h-4 w-4 mr-2" />Resgatar</Link></Button>
          <Button asChild><Link to="/vouchers/new"><Plus className="h-4 w-4 mr-2" />Novo Cupom</Link></Button>
        </div>
      </div>
      <DataTableControls search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} searchPlaceholder="Buscar por código..." page={page} pageSize={PAGE_SIZE} totalCount={data?.count ?? 0} onPageChange={setPage} />
      <Card>
        <CardHeader><CardTitle className="text-base">Lista de Cupons</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Tipo</TableHead><TableHead>Valor</TableHead><TableHead>Branch</TableHead><TableHead>Validade</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {data?.rows?.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum cupom cadastrado</TableCell></TableRow>}
              {data?.rows?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-medium">{c.code}</TableCell>
                  <TableCell>{c.type === "FIXED" ? "Fixo" : "Percentual"}</TableCell>
                  <TableCell>
                    {c.type === "FIXED"
                      ? `R$ ${Number(c.value).toFixed(2)}`
                      : `${Number(c.value)}%`}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{(c.branches as any)?.name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.expires_at ? new Date(c.expires_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                  <TableCell><Badge variant={statusVariant[c.status] || "secondary"}>{statusLabels[c.status] || c.status}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" asChild><Link to={`/vouchers/${c.id}`}><Pencil className="h-4 w-4" /></Link></Button>
                    <Button variant="ghost" size="icon" onClick={() => toggleStatus.mutate({ id: c.id, status: c.status })}><Power className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>)}
        </CardContent>
      </Card>
    </div>
  );
}
