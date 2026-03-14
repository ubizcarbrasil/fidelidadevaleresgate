import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Search, Users, Eye, Loader2, Coins, ArrowUpRight, ArrowDownRight,
  User, Phone, Mail, CreditCard, Hash, Download,
} from "lucide-react";

type ScoredCustomer = {
  id: string;
  name: string | null;
  cpf: string | null;
  phone: string | null;
  points_balance: number;
  user_id: string | null;
  email: string | null;
  total_ride_points: number;
};

type LedgerEntry = {
  id: string;
  entry_type: string;
  points_amount: number;
  money_amount: number | null;
  reason: string | null;
  created_at: string;
};

export default function ScoredCustomersPanel({ brandId }: { brandId: string }) {
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<ScoredCustomer | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  /* ── Query: customers who have machine_rides ── */
  const { data: customers, isLoading } = useQuery({
    queryKey: ["scored-customers", brandId, debouncedSearch],
    queryFn: async () => {
      // Get customers with ride points
      let q = (supabase as any)
        .from("customers")
        .select("id, name, cpf, phone, points_balance, user_id, email")
        .eq("brand_id", brandId)
        .order("updated_at", { ascending: false })
        .limit(50);

      if (debouncedSearch.trim()) {
        const s = debouncedSearch.trim();
        q = q.or(`name.ilike.%${s}%,cpf.ilike.%${s}%,phone.ilike.%${s}%`);
      }

      const { data: custData, error } = await q;
      if (error) throw error;
      if (!custData || custData.length === 0) return [] as ScoredCustomer[];

      const custIds = custData.map((c: any) => c.id);
      const userIds = custData.filter((c: any) => c.user_id).map((c: any) => c.user_id);

      // Fetch ride points totals
      const { data: ridesData } = await (supabase as any)
        .from("machine_rides")
        .select("passenger_cpf, points_credited")
        .eq("brand_id", brandId)
        .in("passenger_cpf", custData.filter((c: any) => c.cpf).map((c: any) => c.cpf));

      const ridePointsByCpf: Record<string, number> = {};
      (ridesData || []).forEach((r: any) => {
        ridePointsByCpf[r.passenger_cpf] = (ridePointsByCpf[r.passenger_cpf] || 0) + (r.points_credited || 0);
      });

      // Fetch emails from profiles
      let emailMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await (supabase as any)
          .from("profiles")
          .select("id, email")
          .in("id", userIds);
        (profilesData || []).forEach((p: any) => {
          if (p.email) emailMap[p.id] = p.email;
        });
      }

      return custData
        .map((c: any): ScoredCustomer => ({
          id: c.id,
          name: c.name,
          cpf: c.cpf,
          phone: c.phone,
          points_balance: Number(c.points_balance || 0),
          user_id: c.user_id,
          email: c.email || (c.user_id ? emailMap[c.user_id] || null : null),
          total_ride_points: c.cpf ? ridePointsByCpf[c.cpf] || 0 : 0,
        }))
        .filter((c: ScoredCustomer) => c.total_ride_points > 0 || debouncedSearch.trim()) as ScoredCustomer[];
    },
    enabled: !!brandId,
  });

  /* ── Query: ledger for selected customer ── */
  const { data: ledger, isLoading: ledgerLoading } = useQuery({
    queryKey: ["customer-ledger-machine", selectedCustomer?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("points_ledger")
        .select("id, entry_type, points_amount, money_amount, reason, created_at")
        .eq("customer_id", selectedCustomer!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as LedgerEntry[];
    },
    enabled: !!selectedCustomer?.id,
  });

  const maskCpf = (cpf: string | null) => {
    if (!cpf) return "—";
    if (cpf.length >= 11) return `•••.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
    return cpf;
  };

  const handleExportCsv = () => {
    if (!customers || customers.length === 0) return;
    const header = "Nome,CPF,Telefone,Email,Saldo Pontos,Pontos Corridas";
    const rows = customers.map((c) =>
      [
        `"${(c.name || "").replace(/"/g, '""')}"`,
        c.cpf || "",
        c.phone || "",
        c.email || "",
        c.points_balance,
        c.total_ride_points,
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientes-pontuados-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-primary" />
                Clientes pontuados
              </CardTitle>
              <CardDescription>
                Busque por nome, CPF ou telefone para verificar dados e saldo de pontos dos clientes pontuados por corridas.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={!customers || customers.length === 0}
              className="shrink-0"
            >
              <Download className="h-4 w-4 mr-1" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome, CPF ou telefone..."
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-80">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !customers || customers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">
                  {debouncedSearch ? "Nenhum cliente encontrado" : "Nenhum cliente pontuado ainda"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {customers.map((c: ScoredCustomer) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="font-medium truncate">{c.name || "Sem nome"}</div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        {c.cpf && <span>CPF: {maskCpf(c.cpf)}</span>}
                        {c.phone && <span>Tel: {c.phone}</span>}
                        {c.email && <span>{c.email}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <div className="text-xs text-muted-foreground">Saldo</div>
                      <Badge variant="secondary" className="text-xs font-mono">
                        {c.points_balance} pts
                      </Badge>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <div className="text-xs text-muted-foreground">Corridas</div>
                      <Badge className="bg-primary/10 text-primary border-primary/30 text-xs font-mono">
                        +{c.total_ride_points} pts
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => setSelectedCustomer(c)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* ── Customer Wallet Drawer ── */}
      <Sheet open={!!selectedCustomer} onOpenChange={(open) => { if (!open) setSelectedCustomer(null); }}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Conta do cliente
            </SheetTitle>
          </SheetHeader>

          {selectedCustomer && (
            <div className="mt-4 space-y-4">
              {/* Customer info */}
              <div className="space-y-2 rounded-lg border border-border p-3">
                <InfoRow icon={User} label="Nome" value={selectedCustomer.name || "Sem nome"} />
                <InfoRow icon={Hash} label="ID" value={selectedCustomer.id.slice(0, 8) + "..."} />
                <InfoRow icon={CreditCard} label="CPF" value={maskCpf(selectedCustomer.cpf)} />
                <InfoRow icon={Phone} label="Telefone" value={selectedCustomer.phone || "—"} />
                <InfoRow icon={Mail} label="E-mail" value={selectedCustomer.email || "—"} />
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Saldo atual</span>
                  <Badge variant="secondary" className="text-sm font-mono">
                    <Coins className="h-3.5 w-3.5 mr-1" />
                    {selectedCustomer.points_balance} pts
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pontos de corridas</span>
                  <Badge className="bg-primary/10 text-primary border-primary/30 text-sm font-mono">
                    +{selectedCustomer.total_ride_points} pts
                  </Badge>
                </div>
              </div>

              {/* Ledger */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Extrato da carteira</h4>
                <ScrollArea className="h-[calc(100vh-420px)]">
                  {ledgerLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : !ledger || ledger.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma movimentação encontrada
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {ledger.map((e) => {
                        const isCredit = e.entry_type === "CREDIT";
                        return (
                          <div
                            key={e.id}
                            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                              isCredit
                                ? "border-primary/20 bg-primary/5"
                                : "border-destructive/20 bg-destructive/5"
                            }`}
                          >
                            {isCredit ? (
                              <ArrowUpRight className="h-4 w-4 text-primary shrink-0" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-destructive shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="truncate block text-xs">
                                {e.reason || (isCredit ? "Crédito" : "Débito")}
                              </span>
                            </div>
                            <span className={`font-mono text-xs shrink-0 ${isCredit ? "text-primary" : "text-destructive"}`}>
                              {isCredit ? "+" : "−"}{Math.abs(e.points_amount)} pts
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {new Date(e.created_at).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium truncate">{value}</span>
    </div>
  );
}
