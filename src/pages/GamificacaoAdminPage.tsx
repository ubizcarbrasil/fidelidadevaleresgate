import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Swords } from "lucide-react";
import EstatisticasGamificacao from "@/components/admin/gamificacao/EstatisticasGamificacao";
import ConfiguracaoModulo from "@/components/admin/gamificacao/ConfiguracaoModulo";
import ListaDuelosAdmin from "@/components/admin/gamificacao/ListaDuelosAdmin";
import RankingAdminView from "@/components/admin/gamificacao/RankingAdminView";
import CinturaoAdminView from "@/components/admin/gamificacao/CinturaoAdminView";
import ModeracaoApelidos from "@/components/admin/gamificacao/ModeracaoApelidos";

export default function GamificacaoAdminPage() {
  const { currentBranchId, currentBrandId } = useBrandGuard();

  const { data: branch, isLoading } = useQuery({
    queryKey: ["branch-detail-gamificacao", currentBranchId],
    enabled: !!currentBranchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name, brand_id, branch_settings_json")
        .eq("id", currentBranchId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="p-6 text-muted-foreground text-center">
        Nenhuma cidade selecionada.
      </div>
    );
  }

  const settings = (branch.branch_settings_json && typeof branch.branch_settings_json === "object")
    ? (branch.branch_settings_json as Record<string, any>)
    : {};

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Swords className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold">Gamificação</h1>
          <p className="text-sm text-muted-foreground">
            Duelos, Ranking e Cinturão — {branch.name}
          </p>
        </div>
      </div>

      <EstatisticasGamificacao branchId={branch.id} brandId={branch.brand_id} />

      <Tabs defaultValue="configuracao" className="w-full">
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="configuracao">Configuração</TabsTrigger>
          <TabsTrigger value="duelos">Duelos</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="cinturao">Cinturão</TabsTrigger>
          <TabsTrigger value="moderacao">Moderação</TabsTrigger>
        </TabsList>

        <TabsContent value="configuracao">
          <ConfiguracaoModulo branchId={branch.id} settings={settings} />
        </TabsContent>
        <TabsContent value="duelos">
          <ListaDuelosAdmin branchId={branch.id} />
        </TabsContent>
        <TabsContent value="ranking">
          <RankingAdminView branchId={branch.id} />
        </TabsContent>
        <TabsContent value="cinturao">
          <CinturaoAdminView branchId={branch.id} brandId={branch.brand_id} />
        </TabsContent>
        <TabsContent value="moderacao">
          <ModeracaoApelidos branchId={branch.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
