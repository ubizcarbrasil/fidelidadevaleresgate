import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Store, MapPin, Users } from "lucide-react";

export default function Dashboard() {
  const { data: tenants } = useQuery({
    queryKey: ["tenants-count"],
    queryFn: async () => {
      const { count } = await supabase.from("tenants").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: brands } = useQuery({
    queryKey: ["brands-count"],
    queryFn: async () => {
      const { count } = await supabase.from("brands").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: branches } = useQuery({
    queryKey: ["branches-count"],
    queryFn: async () => {
      const { count } = await supabase.from("branches").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: usersCount } = useQuery({
    queryKey: ["users-count"],
    queryFn: async () => {
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const stats = [
    { title: "Tenants", value: tenants ?? 0, icon: Building2, color: "text-primary" },
    { title: "Brands", value: brands ?? 0, icon: Store, color: "text-accent-foreground" },
    { title: "Branches", value: branches ?? 0, icon: MapPin, color: "text-success" },
    { title: "Usuários", value: usersCount ?? 0, icon: Users, color: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Visão geral da plataforma Vale Resgate</p>
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
