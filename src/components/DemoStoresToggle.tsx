import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Store, Coins, Rocket, ShoppingBag } from "lucide-react";

interface DemoStoresToggleProps {
  brandId: string;
  branchId: string;
  /** Compact mode for trial success page */
  compact?: boolean;
}

export default function DemoStoresToggle({ brandId, branchId, compact = false }: DemoStoresToggleProps) {
  const queryClient = useQueryClient();
  const [seeding, setSeeding] = useState(false);

  // Count demo stores (slug ends with brand slug pattern)
  const { data: demoInfo, isLoading } = useQuery({
    queryKey: ["demo-stores-info", brandId],
    queryFn: async () => {
      const { data: brand } = await supabase
        .from("brands")
        .select("slug")
        .eq("id", brandId)
        .single();

      if (!brand) return { total: 0, active: 0, slug: "" };

      const suffix = brand.slug.replace(/[^a-z0-9]/g, "");

      const { data: stores } = await supabase
        .from("stores")
        .select("id, is_active, slug")
        .eq("brand_id", brandId)
        .like("slug", `%-${suffix}`);

      const demoStores = stores || [];
      return {
        total: demoStores.length,
        active: demoStores.filter((s) => s.is_active).length,
        slug: suffix,
      };
    },
    enabled: !!brandId,
  });

  // Count demo affiliate deals
  const { data: dealsInfo, isLoading: dealsLoading } = useQuery({
    queryKey: ["demo-deals-info", brandId],
    queryFn: async () => {
      const { data: deals } = await supabase
        .from("affiliate_deals")
        .select("id, is_active")
        .eq("brand_id", brandId)
        .eq("store_name", "Mercado Livre");

      const demoDeals = deals || [];
      return {
        total: demoDeals.length,
        active: demoDeals.filter((d) => d.is_active).length,
      };
    },
    enabled: !!brandId,
  });

  const hasDemoStores = (demoInfo?.total ?? 0) > 0;
  const demoActive = (demoInfo?.active ?? 0) > 0;
  const hasDemoDeals = (dealsInfo?.total ?? 0) > 0;
  const dealsActive = (dealsInfo?.active ?? 0) > 0;

  // Seed demo stores
  const handleSeed = async () => {
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke("seed-demo-stores", {
        body: { brand_id: brandId, branch_id: branchId },
      });
      if (error) throw error;
      toast.success(`${data.created} parceiros demo criados!`, {
        description: data.skipped > 0 ? `${data.skipped} já existiam.` : undefined,
      });
      if (data.creditedCustomers > 0) {
        toast.success(`${data.creditedCustomers} cliente(s) teste receberam 1000 pontos!`);
      }
      queryClient.invalidateQueries({ queryKey: ["demo-stores-info"] });
      queryClient.invalidateQueries({ queryKey: ["demo-deals-info"] });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    } catch (err: any) {
      toast.error("Erro ao criar parceiros demo", { description: err.message });
    } finally {
      setSeeding(false);
    }
  };

  // Toggle demo stores active/inactive
  const toggleMutation = useMutation({
    mutationFn: async (activate: boolean) => {
      if (!demoInfo?.slug) return;

      const { data: stores } = await supabase
        .from("stores")
        .select("id")
        .eq("brand_id", brandId)
        .like("slug", `%-${demoInfo.slug}`);

      if (!stores?.length) return;

      const ids = stores.map((s) => s.id);

      for (let i = 0; i < ids.length; i += 50) {
        const batch = ids.slice(i, i + 50);
        const { error } = await supabase
          .from("stores")
          .update({ is_active: activate })
          .in("id", batch);
        if (error) throw error;
      }
    },
    onSuccess: (_, activate) => {
      toast.success(activate ? "Parceiros demo ativados!" : "Parceiros demo desativados!");
      queryClient.invalidateQueries({ queryKey: ["demo-stores-info"] });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["stores-count"] });
    },
    onError: (err: any) => {
      toast.error("Erro ao alterar parceiros demo", { description: err.message });
    },
  });

  // Toggle demo affiliate deals active/inactive
  const toggleDealsMutation = useMutation({
    mutationFn: async (activate: boolean) => {
      const { error } = await supabase
        .from("affiliate_deals")
        .update({ is_active: activate })
        .eq("brand_id", brandId)
        .eq("store_name", "Mercado Livre");
      if (error) throw error;
    },
    onSuccess: (_, activate) => {
      toast.success(activate ? "Achadinhos demo ativados!" : "Achadinhos demo desativados!");
      queryClient.invalidateQueries({ queryKey: ["demo-deals-info"] });
      queryClient.invalidateQueries({ queryKey: ["affiliate-deals"] });
    },
    onError: (err: any) => {
      toast.error("Erro ao alterar achadinhos demo", { description: err.message });
    },
  });

  // Credit test customer
  const creditMutation = useMutation({
    mutationFn: async () => {
      const { data: customers } = await supabase
        .from("customers")
        .select("id, points_balance")
        .eq("brand_id", brandId)
        .eq("branch_id", branchId);

      if (!customers?.length) throw new Error("Nenhum cliente teste encontrado");

      let credited = 0;
      for (const cust of customers) {
        const { data: existing } = await supabase
          .from("points_ledger")
          .select("id")
          .eq("customer_id", cust.id)
          .eq("reason", "DEMO_SEED_BONUS")
          .maybeSingle();

        if (!existing) {
          await supabase.from("points_ledger").insert({
            brand_id: brandId,
            branch_id: branchId,
            customer_id: cust.id,
            entry_type: "CREDIT",
            points_amount: 1000,
            money_amount: 0,
            reason: "DEMO_SEED_BONUS",
            reference_type: "MANUAL_ADJUSTMENT",
            created_by_user_id: "00000000-0000-0000-0000-000000000000",
          });
          await supabase
            .from("customers")
            .update({ points_balance: (cust.points_balance || 0) + 1000 })
            .eq("id", cust.id);
          credited++;
        }
      }
      return credited;
    },
    onSuccess: (credited) => {
      if (credited > 0) {
        toast.success(`${credited} cliente(s) receberam 1000 pontos!`);
      } else {
        toast.info("Todos os clientes já possuem crédito demo.");
      }
    },
    onError: (err: any) => {
      toast.error("Erro ao creditar pontos", { description: err.message });
    },
  });

  if (isLoading || dealsLoading) {
    return (
      <Card className={compact ? "border-primary/20" : ""}>
        <CardContent className="py-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className={compact ? "pb-2" : "pb-3"}>
        <CardTitle className="flex items-center gap-2 text-base">
          <Rocket className="h-4 w-4 text-primary" />
          Dados de Teste
          {hasDemoStores && (
            <Badge variant={demoActive ? "default" : "secondary"} className="text-[10px] ml-auto">
              {demoInfo!.active}/{demoInfo!.total} lojas
            </Badge>
          )}
        </CardTitle>
        {!compact && (
          <CardDescription className="text-xs">
            Ative lojas fictícias e achadinhos de diversos segmentos para demonstrar sua plataforma.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasDemoStores && !hasDemoDeals ? (
          /* No demo data yet — show seed button */
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Crie lojas demo, ofertas e achadinhos de diversos segmentos para testar sua plataforma.
            </p>
            <Button onClick={handleSeed} disabled={seeding} className="w-full gap-2">
              {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />}
              {seeding ? "Criando dados teste..." : "Ativar Dados de Teste"}
            </Button>
          </div>
        ) : (
          /* Demo data exists — show toggles */
          <div className="space-y-3">
            {/* Demo Stores Toggle */}
            {hasDemoStores && (
              <div className="flex items-center justify-between rounded-lg border bg-background p-3">
                <div className="flex items-center gap-3">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {demoActive ? "Lojas teste ativas" : "Lojas teste desativadas"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {demoInfo!.total} parceiros · taxonomia + seções CMS
                    </p>
                  </div>
                </div>
                <Switch
                  checked={demoActive}
                  onCheckedChange={(checked) => toggleMutation.mutate(checked)}
                  disabled={toggleMutation.isPending}
                />
              </div>
            )}

            {/* Demo Achadinhos Toggle */}
            {hasDemoDeals && (
              <div className="flex items-center justify-between rounded-lg border bg-background p-3">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {dealsActive ? "Achadinhos teste ativos" : "Achadinhos teste desativados"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dealsInfo!.active}/{dealsInfo!.total} deals · Mercado Livre
                    </p>
                  </div>
                </div>
                <Switch
                  checked={dealsActive}
                  onCheckedChange={(checked) => toggleDealsMutation.mutate(checked)}
                  disabled={toggleDealsMutation.isPending}
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={() => creditMutation.mutate()}
                disabled={creditMutation.isPending}
              >
                {creditMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Coins className="h-3.5 w-3.5" />
                )}
                Creditar pontos no cliente teste
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
