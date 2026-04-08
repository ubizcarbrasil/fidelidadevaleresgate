import { useState } from "react";
import { useCinturaoCidade } from "@/components/driver/duels/hook_cinturao_cidade";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, RefreshCw, Loader2, Trophy, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import ModalAtribuirCinturao from "./ModalAtribuirCinturao";

interface Props {
  branchId: string;
  brandId: string;
}

export default function CinturaoAdminView({ branchId, brandId }: Props) {
  const { data: campeoes, isLoading } = useCinturaoCidade(branchId);
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

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
        toast.success(
          res.prize_awarded > 0
            ? `Cinturão atualizado! ${res.prize_awarded} pts distribuídos.`
            : "Cinturão atualizado!"
        );
      } else {
        toast.info("Nenhuma mudança no cinturão.");
      }
      qc.invalidateQueries({ queryKey: ["city-belt-champion", branchId] });
    },
    onError: () => toast.error("Erro ao atualizar cinturão"),
  });

  const monthly = campeoes?.find((c) => c.record_type === "monthly");
  const allTime = campeoes?.find((c) => c.record_type === "all_time");

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-400" />
            Cinturão da Cidade
          </CardTitle>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="default"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={() => setModalOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Atribuir
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={() => atualizar.mutate()}
              disabled={atualizar.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${atualizar.isPending ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !monthly && !allTime ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum campeão registrado ainda.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {monthly && <ChampionCard champion={monthly} tipo="Mensal" />}
              {allTime && <ChampionCard champion={allTime} tipo="Histórico" />}
            </div>
          )}
        </CardContent>
      </Card>

      <ModalAtribuirCinturao
        branchId={branchId}
        brandId={brandId}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

function ChampionCard({ champion, tipo }: { champion: any; tipo: string }) {
  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{tipo}</Badge>
          {champion.assigned_manually && (
            <Badge variant="secondary" className="text-[10px]">Manual</Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {format(new Date(champion.achieved_at), "dd/MM/yyyy")}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {champion.champion_avatar_url ? (
          <img
            src={champion.champion_avatar_url}
            alt=""
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Crown className="h-5 w-5 text-amber-400" />
          </div>
        )}
        <div>
          <p className="text-sm font-semibold">
            {champion.champion_nickname || champion.champion_name}
          </p>
          <p className="text-xs text-muted-foreground">
            {champion.record_value} corridas
          </p>
        </div>
      </div>
      {champion.belt_prize_points > 0 && tipo === "Mensal" && (
        <div className="flex items-center gap-1.5 pt-1 text-xs font-medium text-amber-500">
          <Trophy className="h-3.5 w-3.5" />
          {champion.belt_prize_points} pts para quem tomar
        </div>
      )}
    </div>
  );
}
