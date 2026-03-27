import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useDebounce } from "@/hooks/useDebounce";
import PageHeader from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Truck, Eye, Gift, Download, Loader2, Users } from "lucide-react";
import DriverDetailSheet from "@/components/driver-management/DriverDetailSheet";
import ManualDriverScoringDialog from "@/components/machine-integration/ManualDriverScoringDialog";

export type DriverRow = {
  id: string;
  name: string | null;
  cpf: string | null;
  phone: string | null;
  email: string | null;
  points_balance: number;
  user_id: string | null;
  branch_id: string | null;
  customer_tier: string | null;
  scoring_disabled: boolean;
  total_ride_points: number;
  total_rides: number;
  branch_name: string | null;
};

export default function DriverManagementPage() {
  const { currentBrandId } = useBrandGuard();
  const [search, setSearch] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<DriverRow | null>(null);
  const [bonusDriver, setBonusDriver] = useState<DriverRow | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const { data: drivers, isLoading } = useQuery({
    queryKey: ["driver-management", currentBrandId, debouncedSearch],
    queryFn: async () => {
      let q = (supabase as any)
        .from("customers")
        .select("id, name, cpf, phone, email, points_balance, user_id, branch_id, customer_tier, scoring_disabled")
        .eq("brand_id", currentBrandId)
        .ilike("name", "%[MOTORISTA]%")
        .order("updated_at", { ascending: false })
        .limit(100);

      if (debouncedSearch.trim()) {
        const s = debouncedSearch.trim();
        q = q.or(`name.ilike.%${s}%,cpf.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      if (!data || data.length === 0) return [] as DriverRow[];

      const custIds = data.map((c: any) => c.id);
      const { data: ridesData } = await (supabase as any)
        .from("machine_rides")
        .select("driver_customer_id, driver_points_credited")
        .eq("brand_id", currentBrandId)
        .in("driver_customer_id", custIds);

      const ridePointsById: Record<string, number> = {};
      (ridesData || []).forEach((r: any) => {
        if (r.driver_customer_id) {
          ridePointsById[r.driver_customer_id] = (ridePointsById[r.driver_customer_id] || 0) + (r.driver_points_credited || 0);
        }
      });

      // Fetch emails from profiles for drivers with user_id
      const userIds = data.filter((c: any) => c.user_id).map((c: any) => c.user_id);
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

      return data.map((c: any): DriverRow => ({
        id: c.id,
        name: c.name,
        cpf: c.cpf,
        phone: c.phone,
        email: c.email || (c.user_id ? emailMap[c.user_id] || null : null),
        points_balance: Number(c.points_balance || 0),
        user_id: c.user_id,
        branch_id: c.branch_id,
        customer_tier: c.customer_tier,
        scoring_disabled: c.scoring_disabled ?? false,
        total_ride_points: ridePointsById[c.id] || 0,
      }));
    },
    enabled: !!currentBrandId,
  });

  const cleanName = (name: string | null) =>
    name?.replace(/\[MOTORISTA\]\s*/i, "").trim() || "Sem nome";

  const maskCpf = (cpf: string | null) => {
    if (!cpf) return "—";
    if (cpf.length >= 11) return `•••.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
    return cpf;
  };

  const handleExportCsv = () => {
    if (!drivers || drivers.length === 0) return;
    const header = "Nome,CPF,Telefone,Email,Saldo Pontos,Pontos Corridas,Tier,Pontuação Ativa";
    const rows = drivers.map((c: DriverRow) =>
      [
        `"${cleanName(c.name).replace(/"/g, '""')}"`,
        c.cpf || "",
        c.phone || "",
        c.email || "",
        c.points_balance,
        c.total_ride_points,
        c.customer_tier || "",
        c.scoring_disabled ? "Não" : "Sim",
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `motoristas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Motoristas"
        description="Gerencie dados, pontuação e regras de todos os motoristas da marca."
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome, CPF, telefone ou e-mail..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            {drivers?.length ?? 0} motoristas
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={!drivers || drivers.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : !drivers || drivers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Truck className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">
            {debouncedSearch ? "Nenhum motorista encontrado" : "Nenhum motorista cadastrado ainda"}
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-260px)]">
          <div className="space-y-2">
            {drivers.map((driver: DriverRow) => (
              <div
                key={driver.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-lg border border-border bg-card px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                {/* Linha 1: ícone + nome + badges */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Truck className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{cleanName(driver.name)}</span>
                      {driver.scoring_disabled && (
                        <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">
                          Pontuação desativada
                        </Badge>
                      )}
                      {driver.customer_tier && driver.customer_tier !== "INICIANTE" && (
                        <Badge variant="secondary" className="text-[10px]">
                          {driver.customer_tier}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {driver.cpf && <span>CPF: {maskCpf(driver.cpf)}</span>}
                      {driver.phone && <span>Tel: {driver.phone}</span>}
                      {driver.email && <span className="hidden sm:inline">{driver.email}</span>}
                    </div>
                  </div>
                </div>

                {/* Linha 2 (mobile) / inline (desktop): saldo + corridas + ações */}
                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 pl-12 sm:pl-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-mono">
                      {driver.points_balance} pts
                    </Badge>
                    <Badge className="bg-primary/10 text-primary border-primary/30 text-xs font-mono">
                      +{driver.total_ride_points}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-primary"
                      title="Bonificar"
                      onClick={() => setBonusDriver(driver)}
                    >
                      <Gift className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      title="Abrir detalhes"
                      onClick={() => setSelectedDriver(driver)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      <DriverDetailSheet
        driver={selectedDriver}
        brandId={currentBrandId || ""}
        onClose={() => setSelectedDriver(null)}
      />

      <ManualDriverScoringDialog
        open={!!bonusDriver}
        onOpenChange={(open) => { if (!open) setBonusDriver(null); }}
        driver={bonusDriver ? { id: bonusDriver.id, name: bonusDriver.name, branch_id: bonusDriver.branch_id ?? undefined } : null}
        brandId={currentBrandId || ""}
      />
    </div>
  );
}
