import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, FileText, Calendar } from "lucide-react";

interface RedemptionRow {
  id: string;
  token: string;
  status: string;
  purchase_value: number | null;
  used_at: string | null;
  created_at: string;
  offer_title: string;
  customer_name: string;
}

export default function StoreExtratoTab({ store }: { store: any }) {
  const [rows, setRows] = useState<RedemptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);

      // Get store offer IDs first
      const { data: offers } = await supabase
        .from("offers")
        .select("id")
        .eq("store_id", store.id);

      const offerIds = (offers || []).map(o => o.id);
      if (offerIds.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from("redemptions")
        .select("id, token, status, purchase_value, used_at, created_at, offers(title), customers(name)")
        .in("offer_id", offerIds)
        .eq("status", "USED")
        .order("used_at", { ascending: false })
        .limit(200);

      if (dateFrom) query = query.gte("used_at", new Date(dateFrom).toISOString());
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        query = query.lte("used_at", to.toISOString());
      }

      const { data } = await query;

      setRows((data || []).map(r => ({
        id: r.id,
        token: r.token,
        status: r.status,
        purchase_value: r.purchase_value,
        used_at: r.used_at,
        created_at: r.created_at,
        offer_title: (r.offers as any)?.title || "",
        customer_name: (r.customers as any)?.name || "",
      })));
      setLoading(false);
    };
    fetch();
  }, [store.id, dateFrom, dateTo]);

  const totalGanhos = rows.reduce((sum, r) => sum + (r.purchase_value || 0), 0);
  const totalResgates = rows.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Extrato</h1>
        <p className="text-sm text-muted-foreground">Histórico de resgates confirmados</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 items-end">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">De</Label>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Até</Label>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center mb-3 text-emerald-600 bg-emerald-50">
              <TrendingUp className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold">R$ {totalGanhos.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total em compras</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center mb-3 text-blue-600 bg-blue-50">
              <FileText className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold">{totalResgates}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Resgates confirmados</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Nenhum resgate no período</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map(r => (
            <Card key={r.id} className="rounded-xl">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{r.offer_title}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.customer_name} • PIN {r.token}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">R$ {(r.purchase_value || 0).toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {r.used_at ? new Date(r.used_at).toLocaleDateString("pt-BR") : "—"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
