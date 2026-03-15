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

const FILTER_CHIPS = [
  { key: "all" as TypeFilter, label: "Todos" },
  { key: "redemptions" as TypeFilter, label: "Resgates" },
  { key: "earnings" as TypeFilter, label: "Pontuações" },
];

const STATUS_CHIPS = [
  { key: "all" as StatusFilter, label: "Todos" },
  { key: "USED" as StatusFilter, label: "Usado" },
  { key: "PENDING" as StatusFilter, label: "Pendente" },
  { key: "EXPIRED" as StatusFilter, label: "Expirado" },
  { key: "CANCELED" as StatusFilter, label: "Cancelado" },
];

export default function StoreExtratoTab({ store }: { store: any }) {
  const [rows, setRows] = useState<ExtratoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [couponFilter, setCouponFilter] = useState("all");
  const [offers, setOffers] = useState<{ id: string; title: string }[]>([]);

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

          if (statusFilter !== "all") rq = rq.eq("status", statusFilter);
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

  const redemptionRows = rows.filter(r => r.type === "redemption");
  const usedRedemptions = redemptionRows.filter(r => r.status === "USED");
  const totalCreditApplied = usedRedemptions.reduce((s, r) => s + (r.credit_value_applied || 0), 0);
  const totalPurchaseValue = usedRedemptions.reduce((s, r) => s + r.value, 0);
  const netGain = totalPurchaseValue - totalCreditApplied;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold">Extrato</h1>
        <p className="text-xs text-muted-foreground">Histórico completo de resgates e pontuações</p>
      </div>

      {/* ── Type Filter Chips ── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {FILTER_CHIPS.map(chip => (
          <button
            key={chip.key}
            onClick={() => setTypeFilter(chip.key)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              typeFilter === chip.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* ── Status Filter Chips ── */}
      {(typeFilter === "all" || typeFilter === "redemptions") && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {STATUS_CHIPS.map(chip => (
            <button
              key={chip.key}
              onClick={() => setStatusFilter(chip.key)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                statusFilter === chip.key
                  ? "bg-foreground/10 text-foreground ring-1 ring-border"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Date Filters ── */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Label className="text-[10px] text-muted-foreground mb-1 block">De</Label>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 text-xs rounded-xl" />
        </div>
        <div className="flex-1">
          <Label className="text-[10px] text-muted-foreground mb-1 block">Até</Label>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 text-xs rounded-xl" />
        </div>
        {offers.length > 0 && (typeFilter === "all" || typeFilter === "redemptions") && (
          <div className="flex-1">
            <Label className="text-[10px] text-muted-foreground mb-1 block">Cupom</Label>
            <Select value={couponFilter} onValueChange={setCouponFilter}>
              <SelectTrigger className="h-9 text-xs rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {offers.map(o => (
                  <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Resgates USED", value: usedRedemptions.length, icon: FileText, iconClass: "kpi-icon-blue" },
          { label: "Crédito aplicado", value: `R$ ${totalCreditApplied.toFixed(2)}`, icon: DollarSign, iconClass: "kpi-icon-rose" },
          { label: "Total compras", value: `R$ ${totalPurchaseValue.toFixed(2)}`, icon: TrendingUp, iconClass: "kpi-icon-emerald" },
          { label: "Ganho líquido", value: `R$ ${netGain.toFixed(2)}`, icon: ShieldCheck, iconClass: "kpi-icon-violet", highlight: true },
        ].map(kpi => (
          <Card key={kpi.label} className="rounded-2xl border-0 shadow-sm kpi-card-gradient">
            <CardContent className="p-4">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-3 ${kpi.iconClass} text-white shadow-sm`}>
                <kpi.icon className="h-4 w-4" />
              </div>
              <p className={`text-xl font-bold ${kpi.highlight ? "text-success" : ""}`}>{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Transaction List ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 opacity-30" />
          </div>
          <p className="font-semibold">Nenhum registro no período</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r, idx) => (
            <Card key={r.id} className="rounded-2xl border-0 shadow-sm kpi-card-gradient relative">
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-white shadow-sm ${
                  r.type === "redemption" ? "kpi-icon-blue" : "kpi-icon-amber"
                }`}>
                  {r.type === "redemption" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{r.title}</p>
                    {r.status && (
                      <Badge variant={STATUS_LABELS[r.status]?.variant || "secondary"} className="text-[10px] h-5 rounded-full">
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
                    <div className="flex gap-3 mt-1.5 text-[11px] text-muted-foreground">
                      {r.value > 0 && <span>Compra: <b className="text-foreground">R$ {r.value.toFixed(2)}</b></span>}
                      {r.credit_value_applied !== undefined && r.credit_value_applied > 0 && (
                        <span>Crédito: <b className="text-destructive">R$ {r.credit_value_applied.toFixed(2)}</b></span>
                      )}
                      {r.value > 0 && r.credit_value_applied !== undefined && r.credit_value_applied > 0 && (
                        <span>Ganho: <b className="text-success">R$ {(r.value - r.credit_value_applied).toFixed(2)}</b></span>
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
                  <p className="text-[10px] text-muted-foreground mt-0.5">
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
