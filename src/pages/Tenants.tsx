import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTableControls } from "@/components/DataTableControls";
import { useDebounce } from "@/hooks/useDebounce";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TelaCarregamentoInline } from "@/compartilhados/components/tela_carregamento";

const PAGE_SIZE = 20;

export default function Tenants() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);
  const { state: confirmState, confirm, close: closeConfirm } = useConfirmDialog();

  const { data, isLoading } = useQuery({
    queryKey: ["tenants", debouncedSearch, page],
    queryFn: async () => {
      let query = supabase.from("tenants").select("*, brands(id)", { count: "exact" });
      if (debouncedSearch) query = query.or(`name.ilike.%${debouncedSearch}%,slug.ilike.%${debouncedSearch}%`);
      query = query.order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
      const { data, error, count } = await query;
      if (error) throw error;
      const rows = data?.map((t: any) => ({ ...t, brand_count: Array.isArray(t.brands) ? t.brands.length : 0 }));
      return { rows, count: count ?? 0 };
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("tenants").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tenants"] }); toast.success("Status atualizado!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteTenant = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tenants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tenants"] }); toast.success("Organização excluída!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleDelete = (t: any) => {
    if (t.brand_count > 0) {
      toast.error("Não é possível excluir: existem marcas vinculadas a esta organização.");
      return;
    }
    confirm({
      title: "Excluir organização",
      description: `Tem certeza que deseja excluir "${t.name}"? Esta ação não pode ser desfeita.`,
      confirmLabel: "Excluir",
      variant: "destructive",
      onConfirm: () => deleteTenant.mutate(t.id),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
           <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Organizações</h2>
           <p className="text-muted-foreground">Gerencie os clientes da plataforma</p>
         </div>
         <Button asChild className="w-full sm:w-auto"><Link to="/tenants/new"><Plus className="h-4 w-4 mr-2" />Nova Organização</Link></Button>
      </div>
      <DataTableControls search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} searchPlaceholder="Buscar por nome ou slug..." page={page} pageSize={PAGE_SIZE} totalCount={data?.count ?? 0} onPageChange={setPage} />
      <Card>
        <CardHeader><CardTitle className="text-base">Lista de Organizações</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <TelaCarregamentoInline /> : (
          <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Identificador</TableHead><TableHead>Marcas</TableHead><TableHead>Plano</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {data?.rows?.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma organização cadastrada</TableCell></TableRow>}
              {data?.rows?.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                   <TableCell className="text-muted-foreground">{t.slug}</TableCell>
                   <TableCell><Badge variant="outline">{t.brand_count}</Badge></TableCell>
                  <TableCell><Badge variant="secondary">{t.plan}</Badge></TableCell>
                  <TableCell><Badge variant={t.is_active ? "default" : "destructive"}>{t.is_active ? "Ativo" : "Inativo"}</Badge></TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" asChild><Link to={`/tenants/${t.id}`}><Pencil className="h-4 w-4" /></Link></Button>
                    <Button variant="ghost" size="icon" onClick={() => toggleActive.mutate({ id: t.id, is_active: !t.is_active })}><Power className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>)}
        </CardContent>
      </Card>
      <ConfirmDialog open={confirmState.open} title={confirmState.title} description={confirmState.description} confirmLabel={confirmState.confirmLabel} variant={confirmState.variant} onConfirm={confirmState.onConfirm} onClose={closeConfirm} />
    </div>
  );
}
