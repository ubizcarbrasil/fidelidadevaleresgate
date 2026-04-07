import { useState } from "react";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Swords, MapPin } from "lucide-react";
import EstatisticasGamificacao from "@/components/admin/gamificacao/EstatisticasGamificacao";
import ConfiguracaoModulo from "@/components/admin/gamificacao/ConfiguracaoModulo";
import ListaDuelosAdmin from "@/components/admin/gamificacao/ListaDuelosAdmin";
import RankingAdminView from "@/components/admin/gamificacao/RankingAdminView";
import CinturaoAdminView from "@/components/admin/gamificacao/CinturaoAdminView";
import ModeracaoApelidos from "@/components/admin/gamificacao/ModeracaoApelidos";
import DuelosAoVivoAdmin from "@/components/admin/gamificacao/DuelosAoVivoAdmin";
import ModalCriarDueloAdmin from "@/components/admin/gamificacao/ModalCriarDueloAdmin";

export default function GamificacaoAdminPage() {
  const { currentBranchId, currentBrandId, consoleScope } = useBrandGuard();
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [criarDueloOpen, setCriarDueloOpen] = useState(false);

  const isBrandScope = consoleScope === "BRAND" || consoleScope === "ROOT";
  const effectiveBranchId = isBrandScope ? selectedBranchId : currentBranchId;

  // Fetch branches for brand-scoped users
  const { data: branches, isLoading: loadingBranches } = useQuery({
    queryKey: ["branches-for-gamificacao", currentBrandId],
    enabled: isBrandScope && !!currentBrandId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name")
        .eq("brand_id", currentBrandId!)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: branch, isLoading } = useQuery({
    queryKey: ["branch-detail-gamificacao", effectiveBranchId],
    enabled: !!effectiveBranchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name, brand_id, branch_settings_json")
        .eq("id", effectiveBranchId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading || loadingBranches) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Brand-scoped: show city selector
  if (isBrandScope && !effectiveBranchId) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <Swords className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Gamificação</h1>
            <p className="text-sm text-muted-foreground">Duelos, Ranking e Cinturão</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
          <MapPin className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground text-center">
            Selecione uma cidade para gerenciar a gamificação
          </p>
          <Select onValueChange={(val) => setSelectedBranchId(val)}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Escolha a cidade" />
            </SelectTrigger>
            <SelectContent>
              {branches?.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
        {isBrandScope && (
          <Select value={effectiveBranchId ?? undefined} onValueChange={(val) => setSelectedBranchId(val)}>
            <SelectTrigger className="w-auto min-w-[160px] ml-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {branches?.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <EstatisticasGamificacao branchId={branch.id} brandId={branch.brand_id} />

      <DuelosAoVivoAdmin branchId={branch.id} brandId={branch.brand_id} onCriarDuelo={() => setCriarDueloOpen(true)} />

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
          <ListaDuelosAdmin branchId={branch.id} onCriarDuelo={() => setCriarDueloOpen(true)} />
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

      <ModalCriarDueloAdmin
        branchId={branch.id}
        brandId={branch.brand_id}
        open={criarDueloOpen}
        onClose={() => setCriarDueloOpen(false)}
        onSuccess={() => setCriarDueloOpen(false)}
      />
    </div>
  );
}
