import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Power } from "lucide-react";
import { toast } from "sonner";

export default function Branches() {
  const queryClient = useQueryClient();

  const { data: branches, isLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("*, brands(name, tenants(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("branches").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Status atualizado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Branches</h2>
          <p className="text-muted-foreground">Gerencie as filiais/unidades</p>
        </div>
        <Button asChild>
          <Link to="/branches/new"><Plus className="h-4 w-4 mr-2" />Nova Branch</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lista de Branches</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches?.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma branch cadastrada</TableCell></TableRow>
              )}
              {branches?.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="text-muted-foreground">{(b.brands as any)?.name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{[b.city, b.state].filter(Boolean).join(" / ") || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={b.is_active ? "default" : "destructive"}>
                      {b.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/branches/${b.id}`}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => toggleActive.mutate({ id: b.id, is_active: !b.is_active })}>
                      <Power className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
