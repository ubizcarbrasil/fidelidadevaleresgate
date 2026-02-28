import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollText } from "lucide-react";
import { format } from "date-fns";

export default function PointsLedgerPage() {
  const { currentBrandId, isRootAdmin } = useBrandGuard();
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchCustomer, setSearchCustomer] = useState("");

  const { data: entries, isLoading } = useQuery({
    queryKey: ["points-ledger", currentBrandId, filterType, searchCustomer],
    queryFn: async () => {
      let q = supabase
        .from("points_ledger")
        .select("*, customers(name, phone), branches(name)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (!isRootAdmin && currentBrandId) q = q.eq("brand_id", currentBrandId);
      if (filterType === "CREDIT" || filterType === "DEBIT") q = q.eq("entry_type", filterType as "CREDIT" | "DEBIT");
      const { data, error } = await q;
      if (error) throw error;
      // client-side filter by customer name/phone
      if (searchCustomer) {
        const s = searchCustomer.toLowerCase();
        return data.filter((e: any) =>
          e.customers?.name?.toLowerCase().includes(s) || e.customers?.phone?.includes(s)
        );
      }
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2"><ScrollText className="h-6 w-6" /> Extrato de Pontos</h2>
        <p className="text-muted-foreground">Histórico de créditos e débitos</p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="CREDIT">Créditos (acúmulo)</SelectItem>
            <SelectItem value="DEBIT">Débitos (resgate)</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Buscar cliente..." value={searchCustomer} onChange={e => setSearchCustomer(e.target.value)} className="max-w-xs" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Filial</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Pontos</TableHead>
                <TableHead>R$</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Referência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>}
              {!isLoading && (!entries || entries.length === 0) && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum registro</TableCell></TableRow>}
              {entries?.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell className="text-sm whitespace-nowrap">{format(new Date(e.created_at), "dd/MM/yy HH:mm")}</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{e.customers?.name}</div>
                    <div className="text-xs text-muted-foreground">{e.customers?.phone}</div>
                  </TableCell>
                  <TableCell className="text-sm">{e.branches?.name}</TableCell>
                  <TableCell>
                    {e.entry_type === "CREDIT"
                      ? <Badge className="bg-green-600">Crédito</Badge>
                      : <Badge variant="destructive">Débito</Badge>
                    }
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    <span className={e.entry_type === "CREDIT" ? "text-green-600" : "text-destructive"}>
                      {e.entry_type === "CREDIT" ? "+" : "-"}{e.points_amount}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">R$ {Number(e.money_amount).toFixed(2)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{e.reason || "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{e.reference_type}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
