import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Store, MapPin, Users, Ticket, ShoppingBag, Tag, UserCheck, ReceiptText } from "lucide-react";
import { useBrandGuard } from "@/hooks/useBrandGuard";

export default function Dashboard() {
  const { consoleScope } = useBrandGuard();

  const { data: tenants } = useQuery({
    queryKey: ["tenants-count"],
    queryFn: async () => { const { count } = await supabase.from("tenants").select("*", { count: "exact", head: true }); return count || 0; },
    enabled: consoleScope === "ROOT",
  });

  const { data: brands } = useQuery({
    queryKey: ["brands-count"],
    queryFn: async () => { const { count } = await supabase.from("brands").select("*", { count: "exact", head: true }); return count || 0; },
    enabled: ["ROOT", "TENANT"].includes(consoleScope),
  });

  const { data: branches } = useQuery({
    queryKey: ["branches-count"],
    queryFn: async () => { const { count } = await supabase.from("branches").select("*", { count: "exact", head: true }); return count || 0; },
  });

  const { data: storesCount } = useQuery({
    queryKey: ["stores-count"],
    queryFn: async () => { const { count } = await supabase.from("stores").select("*", { count: "exact", head: true }); return count || 0; },
  });

  const { data: offersCount } = useQuery({
    queryKey: ["offers-count"],
    queryFn: async () => { const { count } = await supabase.from("offers").select("*", { count: "exact", head: true }); return count || 0; },
  });

  const { data: customersCount } = useQuery({
    queryKey: ["customers-count"],
    queryFn: async () => { const { count } = await supabase.from("customers").select("*", { count: "exact", head: true }); return count || 0; },
  });

  const { data: redemptionsCount } = useQuery({
    queryKey: ["redemptions-count"],
    queryFn: async () => { const { count } = await supabase.from("redemptions").select("*", { count: "exact", head: true }); return count || 0; },
  });

  const { data: usersCount } = useQuery({
    queryKey: ["users-count"],
    queryFn: async () => { const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true }); return count || 0; },
    enabled: ["ROOT", "TENANT", "BRAND"].includes(consoleScope),
  });

  const { data: vouchersCount } = useQuery({
    queryKey: ["vouchers-count"],
    queryFn: async () => { const { count } = await supabase.from("vouchers").select("*", { count: "exact", head: true }); return count || 0; },
  });

  const allStats = [
    { title: "Tenants", value: tenants ?? 0, icon: Building2, color: "text-primary", scopes: ["ROOT"] },
    { title: "Brands", value: brands ?? 0, icon: Store, color: "text-accent-foreground", scopes: ["ROOT", "TENANT"] },
    { title: "Branches", value: branches ?? 0, icon: MapPin, color: "text-primary", scopes: ["ROOT", "TENANT", "BRAND"] },
    { title: "Lojas", value: storesCount ?? 0, icon: ShoppingBag, color: "text-primary", scopes: ["ROOT", "TENANT", "BRAND", "BRANCH"] },
    { title: "Ofertas", value: offersCount ?? 0, icon: Tag, color: "text-accent-foreground", scopes: ["ROOT", "TENANT", "BRAND", "BRANCH"] },
    { title: "Clientes", value: customersCount ?? 0, icon: UserCheck, color: "text-primary", scopes: ["ROOT", "TENANT", "BRAND", "BRANCH"] },
    { title: "Resgates", value: redemptionsCount ?? 0, icon: ReceiptText, color: "text-accent-foreground", scopes: ["ROOT", "TENANT", "BRAND", "BRANCH"] },
    { title: "Vouchers", value: vouchersCount ?? 0, icon: Ticket, color: "text-primary", scopes: ["ROOT", "TENANT", "BRAND", "BRANCH"] },
    { title: "Usuários", value: usersCount ?? 0, icon: Users, color: "text-accent-foreground", scopes: ["ROOT", "TENANT", "BRAND"] },
  ];

  const stats = allStats.filter(s => s.scopes.includes(consoleScope));

  const scopeLabels: Record<string, string> = {
    ROOT: "Visão geral da plataforma",
    TENANT: "Visão geral do tenant",
    BRAND: "Visão geral da marca",
    BRANCH: "Visão geral da filial",
    OPERATOR: "Operador PDV",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">{scopeLabels[consoleScope]}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
