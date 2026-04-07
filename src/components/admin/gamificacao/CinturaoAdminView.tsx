import { useCinturaoCidade } from "@/components/driver/duels/hook_cinturao_cidade";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Props {
  branchId: string;
  brandId: string;
}

export default function CinturaoAdminView({ branchId, brandId }: Props) {
  const { data: campeoes, isLoading } = useCinturaoCidade(branchId);
  const qc = useQueryClient();

  const atualizar = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("update_city_belt", {
        p_branch_id: branchId,
        p_brand_id: brandId,
      });
      if (error) throw error;
      return data as any;
    },
    onSuccess: (res) => {
      if (res?.changed) {
        toast.success("Cinturão atualizado!");
      } else {
        toast.info("Nenhuma mudança no cinturão.");
      }
      qc.invalidateQueries({ queryKey: ["city-belt-champion", branchId] });
    },
    onError: () => toast.error("Erro ao atualizar cinturão"),
  });

  const monthly = campeoes?.find(c => c.record_type === "monthly");
  const allTime = campeoes?.find(c => c.record_type === "all_time");

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-400" />
          Cinturão da Cidade
        </CardTitle>
        <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => atualizar.mutate()} disabled={atualizar.isPending}>
          <RefreshCw className={`h-4 w-4 mr-1 ${atualizar.isPending ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : !monthly && !allTime ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum campeão registrado ainda.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {monthly && <ChampionCard champion={monthly} tipo="Mensal" />}
            {allTime && <ChampionCard champion={allTime} tipo="Histórico" />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChampionCard({ champion, tipo }: { champion: any; tipo: string }) {
  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <Badge variant="outline">{tipo}</Badge>
        <span className="text-xs text-muted-foreground">{format(new Date(champion.achieved_at), "dd/MM/yyyy")}</span>
      </div>
      <div className="flex items-center gap-3">
        {champion.champion_avatar_url ? (
          <img src={champion.champion_avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Crown className="h-5 w-5 text-amber-400" />
          </div>
        )}
        <div>
          <p className="text-sm font-semibold">{champion.champion_nickname || champion.champion_name}</p>
          <p className="text-xs text-muted-foreground">{champion.record_value} corridas</p>
        </div>
      </div>
    </div>
  );
}
