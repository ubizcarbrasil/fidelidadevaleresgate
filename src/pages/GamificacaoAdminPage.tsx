import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Swords, MapPin, Trophy } from "lucide-react";
import EstatisticasGamificacao from "@/components/admin/gamificacao/EstatisticasGamificacao";
import PaginaConfiguracoesDuelo from "@/features/duelo_configuracoes/pagina_configuracoes_duelo";
import ListaDuelosAdmin from "@/components/admin/gamificacao/ListaDuelosAdmin";
import PaginaDuelosMatching from "@/features/duelos_matching/pagina_duelos_matching";
import RankingAdminView from "@/components/admin/gamificacao/RankingAdminView";
import CinturaoAdminView from "@/components/admin/gamificacao/CinturaoAdminView";
import ModeracaoApelidos from "@/components/admin/gamificacao/ModeracaoApelidos";
import DuelosAoVivoAdmin from "@/components/admin/gamificacao/DuelosAoVivoAdmin";
import ModalCriarDueloAdmin from "@/components/admin/gamificacao/ModalCriarDueloAdmin";
import ApostasAdminView from "@/components/admin/gamificacao/ApostasAdminView";
import PaginaCampeonatoEmpreendedor from "@/features/campeonato_duelo/pagina_campeonato_empreendedor";
import { useFormatoEngajamento } from "@/features/campeonato_duelo/hooks/hook_formato_engajamento";
import AlertaModoCampeonato from "@/features/campeonato_duelo/components/alerta_modo_campeonato";

export default function GamificacaoAdminPage() {
  const { currentBranchId, currentBrandId, consoleScope } = useBrandGuard();
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [criarDueloOpen, setCriarDueloOpen] = useState(false);

  const isBrandScope = consoleScope === "BRAND" || consoleScope === "ROOT";
  const effectiveBranchId = isBrandScope ? selectedBranchId : currentBranchId;

  const { isCampeonato } = useFormatoEngajamento(currentBrandId);

  const [searchParams, setSearchParams] = useSearchParams();
  const ABAS_LEGADAS = ["duelos", "apostas", "ranking", "cinturao"] as const;
  const ABAS_CAMPEONATO = ["configuracao", "campeonato", "moderacao"] as const;
  const ABAS_DUELO = ["configuracao", "duelos", "apostas", "campeonato", "ranking", "cinturao", "moderacao"] as const;

  const abasPermitidas = (isCampeonato ? ABAS_CAMPEONATO : ABAS_DUELO) as readonly string[];
  const abaPadrao = isCampeonato ? "campeonato" : "configuracao";
  const abaUrl = searchParams.get("tab");
  const abaAtiva = abaUrl && abasPermitidas.includes(abaUrl) ? abaUrl : abaPadrao;

  // Bloqueio por rota: se a aba na URL não é permitida (ex.: ?tab=duelos em
  // marca campeonato), reescreve a querystring para a aba padrão.
  useEffect(() => {
    if (abaUrl && !abasPermitidas.includes(abaUrl)) {
      const next = new URLSearchParams(searchParams);
      next.set("tab", abaPadrao);
      setSearchParams(next, { replace: true });
    }
  }, [abaUrl, abasPermitidas, abaPadrao, searchParams, setSearchParams]);

  const handleTabChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", value);
    setSearchParams(next, { replace: true });
  };

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
          {isCampeonato ? <Trophy className="h-6 w-6 text-primary" /> : <Swords className="h-6 w-6 text-primary" />}
          <div>
            <h1 className="text-xl font-bold">{isCampeonato ? "Campeonato" : "Gamificação"}</h1>
            <p className="text-sm text-muted-foreground">
              {isCampeonato ? "Temporadas, séries e prêmios" : "Duelos, Ranking e Cinturão"}
            </p>
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
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          {isCampeonato ? <Trophy className="h-6 w-6 text-primary" /> : <Swords className="h-6 w-6 text-primary" />}
          <div>
            <h1 className="text-xl font-bold">{isCampeonato ? "Campeonato" : "Gamificação"}</h1>
            <p className="text-sm text-muted-foreground">
              {isCampeonato
                ? `Temporadas, séries e prêmios — ${branch.name}`
                : `Duelos, Ranking e Cinturão — ${branch.name}`}
            </p>
          </div>
        </div>
        {isBrandScope && (
          <Select value={effectiveBranchId ?? undefined} onValueChange={(val) => setSelectedBranchId(val)}>
            <SelectTrigger className="w-full md:w-auto md:min-w-[160px] md:ml-auto">
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

      {!isCampeonato && (
        <>
          <EstatisticasGamificacao branchId={branch.id} brandId={branch.brand_id} />
          <DuelosAoVivoAdmin branchId={branch.id} brandId={branch.brand_id} onCriarDuelo={() => setCriarDueloOpen(true)} />
        </>
      )}

      <Tabs value={abaAtiva} onValueChange={handleTabChange} className="w-full">
        <TabsList
          className={`w-full flex overflow-x-auto scrollbar-none pr-4 ${
            isCampeonato ? "md:grid md:grid-cols-3" : "md:grid md:grid-cols-7"
          }`}
        >
          <TabsTrigger value="configuracao" className="flex-1 whitespace-nowrap text-xs md:text-sm">Configuração</TabsTrigger>
          {!isCampeonato && (
            <>
              <TabsTrigger value="duelos" className="flex-1 whitespace-nowrap text-xs md:text-sm">Duelos</TabsTrigger>
              <TabsTrigger value="apostas" className="flex-1 whitespace-nowrap text-xs md:text-sm">Apostas</TabsTrigger>
            </>
          )}
          <TabsTrigger value="campeonato" className="flex-1 whitespace-nowrap text-xs md:text-sm flex items-center gap-1">
            <Trophy className="h-3 w-3" /> Campeonato
          </TabsTrigger>
          {!isCampeonato && (
            <>
              <TabsTrigger value="ranking" className="flex-1 whitespace-nowrap text-xs md:text-sm">Ranking</TabsTrigger>
              <TabsTrigger value="cinturao" className="flex-1 whitespace-nowrap text-xs md:text-sm">Cinturão</TabsTrigger>
            </>
          )}
          <TabsTrigger value="moderacao" className="flex-1 whitespace-nowrap text-xs md:text-sm">Moderação</TabsTrigger>
        </TabsList>

        <TabsContent value="configuracao">
          <PaginaConfiguracoesDuelo branchId={branch.id} brandId={branch.brand_id} settings={settings} />
        </TabsContent>
        {!isCampeonato && (
          <>
            <TabsContent value="duelos">
              <div className="space-y-4">
                <PaginaDuelosMatching branchId={branch.id} brandId={branch.brand_id} />
                <ListaDuelosAdmin branchId={branch.id} onCriarDuelo={() => setCriarDueloOpen(true)} />
              </div>
            </TabsContent>
            <TabsContent value="apostas">
              <ApostasAdminView branchId={branch.id} brandId={branch.brand_id} />
            </TabsContent>
          </>
        )}
        <TabsContent value="campeonato">
          <div className="space-y-4">
            {isCampeonato && <AlertaModoCampeonato />}
            <PaginaCampeonatoEmpreendedor brandId={branch.brand_id} branchId={branch.id} />
          </div>
        </TabsContent>
        {!isCampeonato && (
          <>
            <TabsContent value="ranking">
              <RankingAdminView branchId={branch.id} />
            </TabsContent>
            <TabsContent value="cinturao">
              <CinturaoAdminView branchId={branch.id} brandId={branch.brand_id} />
            </TabsContent>
          </>
        )}
        <TabsContent value="moderacao">
          <ModeracaoApelidos branchId={branch.id} />
        </TabsContent>
      </Tabs>

      {!isCampeonato && (
        <ModalCriarDueloAdmin
          branchId={branch.id}
          brandId={branch.brand_id}
          open={criarDueloOpen}
          onClose={() => setCriarDueloOpen(false)}
          onSuccess={() => setCriarDueloOpen(false)}
        />
      )}
    </div>
  );
}
