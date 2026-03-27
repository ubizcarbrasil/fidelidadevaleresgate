import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  Search, Eye, Loader2, Coins, ArrowUpRight, ArrowDownRight,
  User, Phone, Mail, CreditCard, Hash, Download, Truck, Gift, Link2, Unlink,
} from "lucide-react";
import ManualDriverScoringDialog from "./ManualDriverScoringDialog";

type ScoredDriver = {
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

export default function ScoredDriversPanel({ brandId }: { brandId: string }) {
  const [search, setSearch] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<ScoredDriver | null>(null);
  const [bonusDriver, setBonusDriver] = useState<ScoredDriver | null>(null);
  const [linkDriver, setLinkDriver] = useState<ScoredDriver | null>(null);
  const [linkEmail, setLinkEmail] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();
  const debouncedLinkEmail = useDebounce(linkEmail, 400);

  /* ── Query: customers with [MOTORISTA] tag ── */
  const { data: drivers, isLoading } = useQuery({
    queryKey: ["scored-drivers", brandId, debouncedSearch],
    queryFn: async () => {
      let q = (supabase as any)
        .from("customers")
        .select("id, name, cpf, phone, points_balance, user_id, email")
        .eq("brand_id", brandId)
        .ilike("name", "%[MOTORISTA]%")
        .order("updated_at", { ascending: false })
        .limit(50);

      if (debouncedSearch.trim()) {
        const s = debouncedSearch.trim();
        q = q.or(`name.ilike.%${s}%,cpf.ilike.%${s}%,phone.ilike.%${s}%`);
      }

      const { data: custData, error } = await q;
      if (error) throw error;
      if (!custData || custData.length === 0) return [] as ScoredDriver[];

      // Fetch ride points from machine_rides via driver_customer_id
      const custIds = custData.map((c: any) => c.id);
      const { data: ridesData } = await (supabase as any)
        .from("machine_rides")
        .select("driver_customer_id, driver_points_credited")
        .eq("brand_id", brandId)
        .in("driver_customer_id", custIds);

      const ridePointsById: Record<string, number> = {};
      (ridesData || []).forEach((r: any) => {
        if (r.driver_customer_id) {
          ridePointsById[r.driver_customer_id] = (ridePointsById[r.driver_customer_id] || 0) + (r.driver_points_credited || 0);
        }
      });

      // Fetch emails from profiles
      const userIds = custData.filter((c: any) => c.user_id).map((c: any) => c.user_id);
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

      return custData.map((c: any): ScoredDriver => ({
        id: c.id,
        name: c.name,
        cpf: c.cpf,
        phone: c.phone,
        points_balance: Number(c.points_balance || 0),
        user_id: c.user_id,
        email: c.email || (c.user_id ? emailMap[c.user_id] || null : null),
        total_ride_points: ridePointsById[c.id] || 0,
      })) as ScoredDriver[];
    },
    enabled: !!brandId,
  });

  /* ── Query: ledger for selected driver ── */
  const { data: ledger, isLoading: ledgerLoading } = useQuery({
    queryKey: ["driver-ledger-machine", selectedDriver?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("points_ledger")
        .select("id, entry_type, points_amount, money_amount, reason, created_at")
        .eq("customer_id", selectedDriver!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as LedgerEntry[];
    },
    enabled: !!selectedDriver?.id,
  });

  /* ── Query: search users by email for linking ── */
  const { data: foundUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["link-user-search", debouncedLinkEmail],
    queryFn: async () => {
      const term = debouncedLinkEmail.trim();
      if (term.length < 3) return [];
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("id, email, full_name")
        .ilike("email", `%${term}%`)
        .limit(10);
      if (error) throw error;
      return (data || []) as { id: string; email: string; full_name: string | null }[];
    },
    enabled: !!linkDriver && debouncedLinkEmail.trim().length >= 3,
  });

  /* ── Mutation: link user_id to driver ── */
  const linkMutation = useMutation({
    mutationFn: async ({ driverId, userId }: { driverId: string; userId: string }) => {
      const { error } = await supabase
        .from("customers")
        .update({ user_id: userId } as any)
        .eq("id", driverId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Conta vinculada!", description: "O motorista agora pode acessar o app." });
      queryClient.invalidateQueries({ queryKey: ["scored-drivers"] });
      setLinkDriver(null);
      setLinkEmail("");
      setSelectedDriver(null);
    },
    onError: (err: any) => {
      toast({ title: "Erro ao vincular", description: err.message, variant: "destructive" });
    },
  });

  /* ── Mutation: unlink user_id from driver ── */
  const unlinkMutation = useMutation({
    mutationFn: async (driverId: string) => {
      const { error } = await supabase
        .from("customers")
        .update({ user_id: null } as any)
        .eq("id", driverId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Conta desvinculada" });
      queryClient.invalidateQueries({ queryKey: ["scored-drivers"] });
      setSelectedDriver(null);
    },
    onError: (err: any) => {
      toast({ title: "Erro ao desvincular", description: err.message, variant: "destructive" });
    },
  });

  const maskCpf = (cpf: string | null) => {
    if (!cpf) return "—";
    if (cpf.length >= 11) return `•••.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
    return cpf;
  };

  const cleanDriverName = (name: string | null) => {
    if (!name) return "Sem nome";
    return name.replace(/\[MOTORISTA\]\s*/i, "").trim() || name;
  };

  const handleExportCsv = () => {
    if (!drivers || drivers.length === 0) return;
    const header = "Nome,CPF,Telefone,Email,Saldo Pontos,Pontos Corridas";
    const rows = drivers.map((c) =>
      [
        `"${cleanDriverName(c.name).replace(/"/g, '""')}"`,
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
    a.download = `motoristas-pontuados-${new Date().toISOString().slice(0, 10)}.csv`;
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
                <Truck className="h-4 w-4 text-primary" />
                Motoristas pontuados
              </CardTitle>
              <CardDescription>
                Busque por nome, CPF ou telefone para verificar dados e saldo de pontos dos motoristas.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={!drivers || drivers.length === 0}
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
            ) : !drivers || drivers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Truck className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">
                  {debouncedSearch ? "Nenhum motorista encontrado" : "Nenhum motorista pontuado ainda"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {drivers.map((c: ScoredDriver) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="font-medium truncate">{cleanDriverName(c.name)}</div>
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
                      className="shrink-0 text-primary"
                      title="Bonificar"
                      onClick={() => setBonusDriver(c)}
                    >
                      <Gift className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => setSelectedDriver(c)}
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

      {/* ── Driver Wallet Drawer ── */}
      <Sheet open={!!selectedDriver} onOpenChange={(open) => { if (!open) setSelectedDriver(null); }}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Conta do motorista
            </SheetTitle>
          </SheetHeader>

          {selectedDriver && (
            <div className="mt-4 space-y-4">
              <div className="space-y-2 rounded-lg border border-border p-3">
                <InfoRow icon={User} label="Nome" value={cleanDriverName(selectedDriver.name)} />
                <InfoRow icon={Hash} label="ID" value={selectedDriver.id.slice(0, 8) + "..."} />
                <InfoRow icon={CreditCard} label="CPF" value={maskCpf(selectedDriver.cpf)} />
                <InfoRow icon={Phone} label="Telefone" value={selectedDriver.phone || "—"} />
                <InfoRow icon={Mail} label="E-mail" value={selectedDriver.email || "—"} />
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Saldo atual</span>
                  <Badge variant="secondary" className="text-sm font-mono">
                    <Coins className="h-3.5 w-3.5 mr-1" />
                    {selectedDriver.points_balance} pts
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pontos de corridas</span>
                  <Badge className="bg-primary/10 text-primary border-primary/30 text-sm font-mono">
                    +{selectedDriver.total_ride_points} pts
                  </Badge>
                </div>
              </div>

              {/* ── Link / Unlink user account ── */}
              <div className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Conta vinculada</span>
                  {selectedDriver.user_id ? (
                    <Badge variant="secondary" className="text-xs">
                      <Link2 className="h-3 w-3 mr-1" />
                      {selectedDriver.user_id.slice(0, 8)}...
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Sem vínculo
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {!selectedDriver.user_id ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => { setLinkDriver(selectedDriver); setLinkEmail(""); }}
                    >
                      <Link2 className="h-3.5 w-3.5 mr-1" />
                      Vincular conta
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full"
                      disabled={unlinkMutation.isPending}
                      onClick={() => unlinkMutation.mutate(selectedDriver.id)}
                    >
                      <Unlink className="h-3.5 w-3.5 mr-1" />
                      {unlinkMutation.isPending ? "Desvinculando..." : "Desvincular"}
                    </Button>
                  )}
                </div>
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

      <ManualDriverScoringDialog
        open={!!bonusDriver}
        onOpenChange={(open) => { if (!open) setBonusDriver(null); }}
        driver={bonusDriver}
        brandId={brandId}
      />

      {/* ── Link User Dialog ── */}
      <Dialog open={!!linkDriver} onOpenChange={(open) => { if (!open) { setLinkDriver(null); setLinkEmail(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Vincular conta ao motorista
            </DialogTitle>
            <DialogDescription>
              Busque pelo e-mail do usuário cadastrado para vincular ao motorista{" "}
              <strong>{linkDriver ? cleanDriverName(linkDriver.name) : ""}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={linkEmail}
                onChange={(e) => setLinkEmail(e.target.value)}
                placeholder="Digite o e-mail do usuário..."
                className="pl-9"
                autoFocus
              />
            </div>

            <ScrollArea className="h-48">
              {usersLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : !foundUsers || foundUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {debouncedLinkEmail.trim().length < 3
                    ? "Digite pelo menos 3 caracteres"
                    : "Nenhum usuário encontrado"}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {foundUsers.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 rounded-md border border-border px-3 py-2 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{u.full_name || "Sem nome"}</div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      </div>
                      <Button
                        size="sm"
                        disabled={linkMutation.isPending}
                        onClick={() => linkDriver && linkMutation.mutate({ driverId: linkDriver.id, userId: u.id })}
                      >
                        {linkMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Link2 className="h-3.5 w-3.5 mr-1" />
                            Vincular
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
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
