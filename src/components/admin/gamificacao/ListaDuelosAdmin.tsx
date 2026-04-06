import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Props {
  branchId: string;
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  accepted: { label: "Aceito", variant: "secondary" },
  declined: { label: "Arregou 😅", variant: "destructive" },
  live: { label: "Ao Vivo 🔴", variant: "default" },
  finished: { label: "Encerrado", variant: "secondary" },
  canceled: { label: "Cancelado", variant: "destructive" },
};

const FILTER_OPTIONS = ["all", "pending", "accepted", "live", "finished", "declined", "canceled"] as const;

export default function ListaDuelosAdmin({ branchId }: Props) {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: duelos, isLoading } = useQuery({
    queryKey: ["admin-duelos", branchId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("driver_duels")
        .select(`
          id, status, start_at, end_at, challenger_rides_count, challenged_rides_count,
          winner_id, created_at,
          challenger:driver_duel_participants!driver_duels_challenger_id_fkey(public_nickname, customer:customers!driver_duel_participants_customer_id_fkey(name)),
          challenged:driver_duel_participants!driver_duels_challenged_id_fkey(public_nickname, customer:customers!driver_duel_participants_customer_id_fkey(name))
        `)
        .eq("branch_id", branchId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const getNome = (participant: any): string => {
    if (!participant) return "—";
    return participant.public_nickname || participant.customer?.name || "Motorista";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Duelos da Cidade</CardTitle>
        <select
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">Todos</option>
          {FILTER_OPTIONS.filter(o => o !== "all").map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]?.label || s}</option>
          ))}
        </select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : !duelos?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum duelo encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Desafiante</TableHead>
                  <TableHead>Desafiado</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Placar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {duelos.map((d: any) => {
                  const s = STATUS_LABELS[d.status] || { label: d.status, variant: "outline" as const };
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="text-sm">{getNome(d.challenger)}</TableCell>
                      <TableCell className="text-sm">{getNome(d.challenged)}</TableCell>
                      <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(d.start_at), "dd/MM")} — {format(new Date(d.end_at), "dd/MM")}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {d.challenger_rides_count ?? "—"} × {d.challenged_rides_count ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
