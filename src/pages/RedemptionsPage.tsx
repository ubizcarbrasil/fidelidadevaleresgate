import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";

type RedemptionStatus = Database["public"]["Enums"]["redemption_status"];
const STATUS_VARIANT: Record<RedemptionStatus, string> = { PENDING: "outline", USED: "default", EXPIRED: "secondary", CANCELED: "destructive" };

export default function RedemptionsPage() {
  const { data: redemptions, isLoading } = useQuery({
    queryKey: ["redemptions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("redemptions")
        .select("*, offers(title), customers(name), branches(name)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Resgates</h2>
        <p className="text-muted-foreground">Histórico de resgates por filial</p>
      </div>
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
              {redemptions?.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum resgate</TableCell></TableRow>}
              {redemptions?.map(r => (
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
