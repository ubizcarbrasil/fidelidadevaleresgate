import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, FileText, Calendar, ArrowDownLeft, ArrowUpRight, DollarSign, ShieldCheck } from "lucide-react";

type TypeFilter = "all" | "redemptions" | "earnings";
type StatusFilter = "all" | "USED" | "PENDING" | "EXPIRED" | "CANCELED";

interface ExtratoRow {
  id: string;
  type: "redemption" | "earning";
  title: string;
  customer_name: string;
  customer_cpf?: string;
  value: number;
  credit_value_applied?: number;
  points?: number;
  date: string;
  token?: string;
  status?: string;
}

function maskCpf(cpf: string | null | undefined): string {
  if (!cpf) return "—";
  const clean = cpf.replace(/\D/g, "");
  if (clean.length < 11) return "***.***.***-**";
  return `***.${clean.slice(3, 6)}.***-${clean.slice(9, 11)}`;
}

function maskPin(pin: string | null | undefined): string {
  if (!pin) return "—";
  if (pin.length <= 2) return pin;
  return pin.slice(0, 2) + "****";
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  USED: { label: "Usado", variant: "default" },
  PENDING: { label: "Pendente", variant: "secondary" },
  EXPIRED: { label: "Expirado", variant: "destructive" },
  CANCELED: { label: "Cancelado", variant: "outline" },
};

export default function StoreExtratoTab({ store }: { store: any }) {
  const [rows, setRows] = useState<ExtratoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [couponFilter, setCouponFilter] = useState("all");
  const [offers, setOffers] = useState<{ id: string; title: string }[]>([]);

  // Load offer list for filter
  useEffect(() => {
    const loadOffers = async () => {
      const { data } = await supabase
        .from("offers")
        .select("id, title")
        .eq("store_id", store.id)
        .order("title");
      setOffers(data || []);
    };
    loadOffers();
  }, [store.id]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const results: ExtratoRow[] = [];

      // Fetch redemptions
      if (typeFilter === "all" || typeFilter === "redemptions") {
        const { data: storeOffers } = await supabase
          .from("offers")
          .select("id")
          .eq("store_id", store.id);

        let offerIds = (storeOffers || []).map(o => o.id);
        if (couponFilter !== "all") offerIds = offerIds.filter(id => id === couponFilter);

        if (offerIds.length > 0) {
          let rq = supabase
            .from("redemptions")
            .select("id, token, status, purchase_value, credit_value_applied, used_at, created_at, customer_cpf, offers(title), customers(name)")
            .in("offer_id", offerIds)
            .order("created_at", { ascending: false })
            .limit(200);

          if (statusFilter !== "all") {
            rq = rq.eq("status", statusFilter);
          }
          if (dateFrom) rq = rq.gte("created_at", new Date(dateFrom).toISOString());
          if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            rq = rq.lte("created_at", to.toISOString());
          }

          const { data } = await rq;
          (data || []).forEach(r => results.push({
            id: r.id,
            type: "redemption",
            title: (r.offers as any)?.title || "Resgate",
            customer_name: (r.customers as any)?.name || "",
            customer_cpf: (r as any).customer_cpf,
            value: r.purchase_value || 0,
            credit_value_applied: r.credit_value_applied ?? undefined,
            date: r.used_at || r.created_at,
            token: r.token,
            status: r.status,
          }));
        }
      }

      // Fetch earning events
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

      results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRows(results);
      setLoading(false);
    };
    fetchData();
  }, [store.id, dateFrom, dateTo, typeFilter, statusFilter, couponFilter]);

  // Breakdown KPIs
  const redemptionRows = rows.filter(r => r.type === "redemption");
  const usedRedemptions = redemptionRows.filter(r => r.status === "USED");
  const totalCreditApplied = usedRedemptions.reduce((s, r) => s + (r.credit_value_applied || 0), 0);
  const totalPurchaseValue = usedRedemptions.reduce((s, r) => s + r.value, 0);
  const netGain = totalPurchaseValue - totalCreditApplied;
  const totalPontuacoes = rows.filter(r => r.type === "earning").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Extrato</h1>
        <p className="text-sm text-muted-foreground">Histórico completo de resgates e pontuações</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 items-end flex-wrap">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">De</Label>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Até</Label>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Tipo</Label>
          <Select value={typeFilter} onValueChange={v => setTypeFilter(v as TypeFilter)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="redemptions">Resgates</SelectItem>
              <SelectItem value="earnings">Pontuações</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(typeFilter === "all" || typeFilter === "redemptions") && (
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Status</Label>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="USED">Usado</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="EXPIRED">Expirado</SelectItem>
                <SelectItem value="CANCELED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {offers.length > 0 && (typeFilter === "all" || typeFilter === "redemptions") && (
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Cupom</Label>
            <Select value={couponFilter} onValueChange={setCouponFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os cupons</SelectItem>
                {offers.map(o => (
                  <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* KPIs Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center mb-2 text-blue-600 bg-blue-50">
              <FileText className="h-4 w-4" />
            </div>
            <p className="text-xl font-bold">{usedRedemptions.length}</p>
            <p className="text-[11px] text-muted-foreground">Resgates USED</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center mb-2 text-rose-600 bg-rose-50">
              <DollarSign className="h-4 w-4" />
            </div>
            <p className="text-xl font-bold">R$ {totalCreditApplied.toFixed(2)}</p>
            <p className="text-[11px] text-muted-foreground">Crédito aplicado</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center mb-2 text-emerald-600 bg-emerald-50">
              <TrendingUp className="h-4 w-4" />
            </div>
            <p className="text-xl font-bold">R$ {totalPurchaseValue.toFixed(2)}</p>
            <p className="text-[11px] text-muted-foreground">Total compras</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center mb-2 text-violet-600 bg-violet-50">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <p className="text-xl font-bold text-emerald-600">R$ {netGain.toFixed(2)}</p>
            <p className="text-[11px] text-muted-foreground">Ganho líquido</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
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
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${r.type === "redemption" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}>
                  {r.type === "redemption" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{r.title}</p>
                    {r.status && (
                      <Badge variant={STATUS_LABELS[r.status]?.variant || "secondary"} className="text-[10px] h-5">
                        {STATUS_LABELS[r.status]?.label || r.status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {r.customer_name}
                    {r.customer_cpf ? ` · CPF ${maskCpf(r.customer_cpf)}` : ""}
                    {r.token ? ` · PIN ${maskPin(r.token)}` : ""}
                    {r.points ? ` · ${r.points} pts` : ""}
                  </p>
                  {r.type === "redemption" && (r.credit_value_applied !== undefined || r.value > 0) && (
                    <div className="flex gap-3 mt-1 text-[11px] text-muted-foreground">
                      {r.value > 0 && <span>Compra: <b className="text-foreground">R$ {r.value.toFixed(2)}</b></span>}
                      {r.credit_value_applied !== undefined && r.credit_value_applied > 0 && (
                        <span>Crédito: <b className="text-rose-600">R$ {r.credit_value_applied.toFixed(2)}</b></span>
                      )}
                      {r.value > 0 && r.credit_value_applied !== undefined && r.credit_value_applied > 0 && (
                        <span>Ganho: <b className="text-emerald-600">R$ {(r.value - r.credit_value_applied).toFixed(2)}</b></span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm">
                    {r.type === "redemption" && r.credit_value_applied
                      ? `R$ ${r.credit_value_applied.toFixed(2)}`
                      : r.value > 0 ? `R$ ${r.value.toFixed(2)}` : "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(r.date).toLocaleDateString("pt-BR")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(r.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
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