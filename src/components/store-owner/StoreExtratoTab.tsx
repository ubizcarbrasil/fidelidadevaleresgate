import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, FileText, Calendar, ArrowDownLeft, ArrowUpRight } from "lucide-react";

type TypeFilter = "all" | "redemptions" | "earnings";

interface ExtratoRow {
  id: string;
  type: "redemption" | "earning";
  title: string;
  customer_name: string;
  value: number;
  points?: number;
  date: string;
  token?: string;
  status?: string;
}

export default function StoreExtratoTab({ store }: { store: any }) {
  const [rows, setRows] = useState<ExtratoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const results: ExtratoRow[] = [];

      // Fetch redemptions (saídas / resgates usados)
      if (typeFilter === "all" || typeFilter === "redemptions") {
        const { data: offers } = await supabase
          .from("offers")
          .select("id")
          .eq("store_id", store.id);

        const offerIds = (offers || []).map(o => o.id);
        if (offerIds.length > 0) {
          let rq = supabase
            .from("redemptions")
            .select("id, token, status, purchase_value, used_at, created_at, offers(title), customers(name)")
            .in("offer_id", offerIds)
            .eq("status", "USED")
            .order("used_at", { ascending: false })
            .limit(200);

          if (dateFrom) rq = rq.gte("used_at", new Date(dateFrom).toISOString());
          if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            rq = rq.lte("used_at", to.toISOString());
          }

          const { data } = await rq;
          (data || []).forEach(r => results.push({
            id: r.id,
            type: "redemption",
            title: (r.offers as any)?.title || "Resgate",
            customer_name: (r.customers as any)?.name || "",
            value: r.purchase_value || 0,
            date: r.used_at || r.created_at,
            token: r.token,
            status: r.status,
          }));
        }
      }

      // Fetch earning events (entradas / pontuações)
      if (typeFilter === "all" || typeFilter === "earnings") {
        let eq = supabase
          .from("earning_events")
          .select("id, purchase_value, points_earned, money_earned, created_at, customers(name)")
          .eq("store_id", store.id)
          .eq("status", "APPROVED")
          .order("created_at", { ascending: false })
          .limit(200);

        if (dateFrom) eq = eq.gte("created_at", new Date(dateFrom).toISOString());
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          eq = eq.lte("created_at", to.toISOString());
        }

        const { data } = await eq;
        (data || []).forEach(e => results.push({
          id: e.id,
          type: "earning",
          title: "Pontuação",
          customer_name: (e.customers as any)?.name || "",
          value: e.purchase_value || 0,
          points: e.points_earned,
          date: e.created_at,
        }));
      }

      // Sort by date desc
      results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRows(results);
      setLoading(false);
    };
    fetchData();
  }, [store.id, dateFrom, dateTo, typeFilter]);

  const totalCompras = rows.filter(r => r.type === "redemption").reduce((s, r) => s + r.value, 0);
  const totalResgates = rows.filter(r => r.type === "redemption").length;
  const totalPontuacoes = rows.filter(r => r.type === "earning").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Extrato</h1>
        <p className="text-sm text-muted-foreground">Histórico de resgates e pontuações</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 items-end flex-wrap">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">De</Label>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Até</Label>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Tipo</Label>
          <Select value={typeFilter} onValueChange={v => setTypeFilter(v as TypeFilter)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="redemptions">Resgates</SelectItem>
              <SelectItem value="earnings">Pontuações</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center mb-3 text-emerald-600 bg-emerald-50">
              <TrendingUp className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold">R$ {totalCompras.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total em compras</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center mb-3 text-blue-600 bg-blue-50">
              <FileText className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold">{totalResgates}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Resgates</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center mb-3 text-amber-600 bg-amber-50">
              <ArrowUpRight className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold">{totalPontuacoes}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pontuações</p>
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
          <p className="font-semibold">Nenhum registro no período</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map(r => (
            <Card key={r.id} className="rounded-xl">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${r.type === "redemption" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}>
                  {r.type === "redemption" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{r.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.customer_name}{r.token ? ` • PIN ${r.token}` : ""}{r.points ? ` • ${r.points} pts` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">R$ {r.value.toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(r.date).toLocaleDateString("pt-BR")}
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