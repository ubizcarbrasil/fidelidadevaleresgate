import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Swords, Trophy, Users, TrendingUp } from "lucide-react";

interface Props {
  branchId: string;
  brandId: string;
}

export default function EstatisticasGamificacao({ branchId, brandId }: Props) {
  const { data: stats } = useQuery({
    queryKey: ["gamificacao-stats", branchId],
    queryFn: async () => {
      const [duelosRes, participantsRes, beltRes] = await Promise.all([
        supabase.from("driver_duels").select("id, status", { count: "exact" }).eq("branch_id", branchId),
        supabase.from("driver_duel_participants").select("id", { count: "exact" }).eq("branch_id", branchId).eq("duels_enabled", true),
        supabase.rpc("get_city_belt_champion", { p_branch_id: branchId }),
      ]);

      const duelos = duelosRes.data || [];
      const totalDuelos = duelosRes.count || 0;
      const duelosAtivos = duelos.filter(d => ["accepted", "live"].includes(d.status)).length;
      const duelosAceitos = duelos.filter(d => d.status !== "pending" && d.status !== "canceled").length;
      const taxaAceite = totalDuelos > 0 ? Math.round((duelosAceitos / totalDuelos) * 100) : 0;
      const participantes = participantsRes.count || 0;
      const campeao = Array.isArray(beltRes.data) && beltRes.data.length > 0
        ? (beltRes.data as any[])[0]
        : null;

      return { totalDuelos, duelosAtivos, participantes, taxaAceite, campeao };
    },
  });

  const kpis = [
    { label: "Duelos", value: stats?.totalDuelos ?? 0, icon: Swords, color: "text-blue-400" },
    { label: "Ativos", value: stats?.duelosAtivos ?? 0, icon: TrendingUp, color: "text-green-400" },
    { label: "Participantes", value: stats?.participantes ?? 0, icon: Users, color: "text-purple-400" },
    { label: "Taxa Aceite", value: `${stats?.taxaAceite ?? 0}%`, icon: Trophy, color: "text-amber-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {kpis.map((k) => (
        <Card key={k.label} className="min-w-0 overflow-hidden">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 min-w-0">
            <k.icon className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 ${k.color}`} />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{k.label}</p>
              <p className="text-base sm:text-lg font-bold">{k.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
