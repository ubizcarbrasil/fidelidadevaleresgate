import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AbaGeral from "./components/aba_geral";
import AbaLimitesAposta from "./components/aba_limites_aposta";
import AbaCicloReset from "./components/aba_ciclo_reset";
import AbaCampanhasPremio from "./components/aba_campanhas_premio";
import AbaIntegracaoCorridas from "./components/aba_integracao_corridas";

interface Props {
  branchId: string;
  brandId: string;
  settings: Record<string, any>;
}

export default function PaginaConfiguracoesDuelo({ branchId, brandId, settings }: Props) {
  return (
    <Tabs defaultValue="geral" className="w-full">
      <TabsList className="w-full flex overflow-x-auto scrollbar-none md:grid md:grid-cols-5 pr-4">
        <TabsTrigger value="geral" className="flex-1 whitespace-nowrap text-xs md:text-sm">Geral</TabsTrigger>
        <TabsTrigger value="limites" className="flex-1 whitespace-nowrap text-xs md:text-sm">Limites</TabsTrigger>
        <TabsTrigger value="ciclo" className="flex-1 whitespace-nowrap text-xs md:text-sm">Ciclo & Reset</TabsTrigger>
        <TabsTrigger value="campanhas" className="flex-1 whitespace-nowrap text-xs md:text-sm">Prêmios</TabsTrigger>
        <TabsTrigger value="corridas" className="flex-1 whitespace-nowrap text-xs md:text-sm">Corridas</TabsTrigger>
      </TabsList>

      <TabsContent value="geral" className="mt-4">
        <AbaGeral branchId={branchId} settings={settings} />
      </TabsContent>
      <TabsContent value="limites" className="mt-4">
        <AbaLimitesAposta branchId={branchId} settings={settings} />
      </TabsContent>
      <TabsContent value="ciclo" className="mt-4">
        <AbaCicloReset branchId={branchId} brandId={brandId} settings={settings} />
      </TabsContent>
      <TabsContent value="campanhas" className="mt-4">
        <AbaCampanhasPremio branchId={branchId} brandId={brandId} />
      </TabsContent>
      <TabsContent value="corridas" className="mt-4">
        <AbaIntegracaoCorridas branchId={branchId} settings={settings} />
      </TabsContent>
    </Tabs>
  );
}