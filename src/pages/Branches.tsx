import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Power } from "lucide-react";
import { toast } from "sonner";
import { DataTableControls } from "@/components/DataTableControls";
import { useDebounce } from "@/hooks/useDebounce";
import { useBrandGuard } from "@/hooks/useBrandGuard";

const PAGE_SIZE = 20;

export default function Branches() {
  const queryClient = useQueryClient();
  const { currentBrandId, isRootAdmin } = useBrandGuard();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ["branches", debouncedSearch, page, currentBrandId],
    queryFn: async () => {
      let query = supabase.from("branches").select("*, brands(name, tenants(name))", { count: "exact" });
      if (!isRootAdmin && currentBrandId) query = query.eq("brand_id", currentBrandId);
      if (debouncedSearch) query = query.or(`name.ilike.%${debouncedSearch}%,slug.ilike.%${debouncedSearch}%,city.ilike.%${debouncedSearch}%`);
      query = query.order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: data, count: count ?? 0 };
    },
  });

  const toggleActive = useMutationWithFeedback<void, Error, { id: string; is_active: boolean }>(
    async ({ id, is_active }) => {
      const { error } = await supabase.from("branches").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    {
      successMessage: "Status atualizado!",
      onSuccessCallback: () => queryClient.invalidateQueries({ queryKey: queryKeys.branches.all }),
    },
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
           <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Cidades</h2>
           <p className="text-muted-foreground">Gerencie as filiais/unidades</p>
         </div>
         <Button asChild className="w-full sm:w-auto"><Link to="/branches/new"><Plus className="h-4 w-4 mr-2" />Nova Cidade</Link></Button>
      </div>
      <DataTableControls search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} searchPlaceholder="Buscar por nome, slug ou cidade..." page={page} pageSize={PAGE_SIZE} totalCount={data?.count ?? 0} onPageChange={setPage} />
      <Card>
        <CardHeader><CardTitle className="text-base">Lista de Cidades</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Marca</TableHead><TableHead>Cidade/UF</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {data?.rows?.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma cidade cadastrada</TableCell></TableRow>}
              {data?.rows?.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="text-muted-foreground">{(b.brands as any)?.name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{[b.city, b.state].filter(Boolean).join(" / ") || "—"}</TableCell>
                  <TableCell><Badge variant={b.is_active ? "default" : "destructive"}>{b.is_active ? "Ativo" : "Inativo"}</Badge></TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" asChild><Link to={`/branches/${b.id}`}><Pencil className="h-4 w-4" /></Link></Button>
                    <Button variant="ghost" size="icon" onClick={() => toggleActive.mutate({ id: b.id, is_active: !b.is_active })}><Power className="h-4 w-4" /></Button>
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
