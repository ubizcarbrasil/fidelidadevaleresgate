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
import { formatPoints } from "@/lib/formatPoints";

export default function PointsLedgerPage() {
  const { currentBrandId, isRootAdmin } = useBrandGuard();
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterStoreId, setFilterStoreId] = useState<string>("ALL");
  const [searchCustomer, setSearchCustomer] = useState("");

  // Fetch stores for filter
  const { data: stores } = useQuery({
    queryKey: ["ledger-stores", currentBrandId],
    queryFn: async () => {
      if (!currentBrandId && !isRootAdmin) return [];
      let q = supabase.from("stores").select("id, name").eq("is_active", true);
      if (currentBrandId) q = q.eq("brand_id", currentBrandId);
      const { data, error } = await q.order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch earning_events to map reference_id → store name
  const { data: earningEventsMap } = useQuery({
    queryKey: ["ledger-earning-events", currentBrandId, filterStoreId],
    queryFn: async () => {
      let q = supabase.from("earning_events").select("id, store_id, stores(name)");
      if (!isRootAdmin && currentBrandId) q = q.eq("brand_id", currentBrandId);
      if (filterStoreId !== "ALL") q = q.eq("store_id", filterStoreId);
      const { data, error } = await q.limit(1000);
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach((e: any) => { map[e.id] = e.stores?.name || "—"; });
      return map;
    },
  });

  const { data: entries, isLoading } = useQuery({
    queryKey: ["points-ledger", currentBrandId, filterType, filterStoreId, searchCustomer],
    queryFn: async () => {
      let q = supabase
        .from("points_ledger")
        .select("*, customers(name, phone), branches(name)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (!isRootAdmin && currentBrandId) q = q.eq("brand_id", currentBrandId);
      if (filterType === "CREDIT" || filterType === "DEBIT") q = q.eq("entry_type", filterType as "CREDIT" | "DEBIT");

      // If filtering by store, get earning event IDs for that store first
      if (filterStoreId !== "ALL") {
        const earningIds = earningEventsMap ? Object.keys(earningEventsMap) : [];
        if (earningIds.length === 0) return [];
        q = q.eq("reference_type", "EARNING_EVENT").in("reference_id", earningIds);
      }

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
    enabled: !!earningEventsMap || filterStoreId === "ALL",
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2"><ScrollText className="h-5 w-5 sm:h-6 sm:w-6" /> Extrato de Pontos</h2>
        <p className="text-muted-foreground">Histórico de créditos e débitos</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:flex-wrap">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="CREDIT">Créditos (acúmulo)</SelectItem>
            <SelectItem value="DEBIT">Débitos (resgate)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStoreId} onValueChange={setFilterStoreId}>
          <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Todos os parceiros" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os parceiros</SelectItem>
            {stores?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="Buscar cliente..." value={searchCustomer} onChange={e => setSearchCustomer(e.target.value)} className="w-full sm:max-w-xs" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Filial</TableHead>
                <TableHead>Parceiro</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Pontos</TableHead>
                <TableHead>R$</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Referência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>}
              {!isLoading && (!entries || entries.length === 0) && <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhum registro</TableCell></TableRow>}
              {entries?.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell className="text-sm whitespace-nowrap">{format(new Date(e.created_at), "dd/MM/yy HH:mm")}</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{e.customers?.name}</div>
                    <div className="text-xs text-muted-foreground">{e.customers?.phone}</div>
                  </TableCell>
                  <TableCell className="text-sm">{e.branches?.name}</TableCell>
                  <TableCell className="text-sm">
                    {e.reference_type === "EARNING_EVENT" && earningEventsMap?.[e.reference_id]
                      ? earningEventsMap[e.reference_id]
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {e.entry_type === "CREDIT"
                      ? <Badge className="bg-green-600">Crédito</Badge>
                      : <Badge variant="destructive">Débito</Badge>
                    }
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    <span className={e.entry_type === "CREDIT" ? "text-green-600" : "text-destructive"}>
                      {e.entry_type === "CREDIT" ? "+" : "-"}{formatPoints(e.points_amount)}
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
