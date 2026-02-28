import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Power, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const statusLabels: Record<string, string> = {
  active: "Ativo",
  expired: "Expirado",
  depleted: "Esgotado",
  cancelled: "Cancelado",
};

const statusVariant: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  active: "default",
  expired: "secondary",
  depleted: "outline",
  cancelled: "destructive",
};

export default function Vouchers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: vouchers, isLoading } = useQuery({
    queryKey: ["vouchers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vouchers")
        .select("*, branches(name, brands(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === "active" ? "cancelled" : "active";
      const { error } = await supabase.from("vouchers").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      toast.success("Status atualizado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = vouchers?.filter((v) =>
    !search ||
    v.code.toLowerCase().includes(search.toLowerCase()) ||
    v.title.toLowerCase().includes(search.toLowerCase()) ||
    v.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vouchers</h2>
          <p className="text-muted-foreground">Gerencie os vales de desconto</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/vouchers/redeem"><Search className="h-4 w-4 mr-2" />Resgatar</Link>
          </Button>
          <Button asChild>
            <Link to="/vouchers/new"><Plus className="h-4 w-4 mr-2" />Novo Voucher</Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar por código, título ou cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lista de Vouchers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum voucher cadastrado</TableCell></TableRow>
              )}
              {filtered?.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono font-medium">{v.code}</TableCell>
                  <TableCell>{v.title}</TableCell>
                  <TableCell>{v.discount_percent}%</TableCell>
                  <TableCell className="text-muted-foreground">{(v.branches as any)?.name || "—"}</TableCell>
                  <TableCell>{v.current_uses}/{v.max_uses}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {v.expires_at ? new Date(v.expires_at).toLocaleDateString("pt-BR") : "Sem validade"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[v.status] || "secondary"}>
                      {statusLabels[v.status] || v.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/vouchers/${v.id}`}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => toggleStatus.mutate({ id: v.id, status: v.status })}>
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
