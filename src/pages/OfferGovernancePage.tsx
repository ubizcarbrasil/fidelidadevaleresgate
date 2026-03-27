import { useState } from "react";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ORIGENS, type SourceSystem } from "@/lib/api/offerGovernance";
import GovernanceKpis from "@/components/offer-governance/GovernanceKpis";
import GovernanceDealsTable from "@/components/offer-governance/GovernanceDealsTable";
import GovernanceReportsTable from "@/components/offer-governance/GovernanceReportsTable";
import GovernanceGroupsTable from "@/components/offer-governance/GovernanceGroupsTable";
import GovernanceSyncLogs from "@/components/offer-governance/GovernanceSyncLogs";
import GovernanceCleanup from "@/components/offer-governance/GovernanceCleanup";
import PageHeader from "@/components/PageHeader";
import { Shield } from "lucide-react";

export default function OfferGovernancePage() {
  const { currentBrandId } = useBrandGuard();
  const [origemAtiva, setOrigemAtiva] = useState<SourceSystem>("dvlinks");
  const [subTab, setSubTab] = useState("ofertas");

  if (!currentBrandId) return null;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Governança de Ofertas"
        subtitle="Controle completo de ofertas espelhadas por origem"
        icon={Shield}
      />

      {/* Tabs de origem */}
      <Tabs value={origemAtiva} onValueChange={(v) => setOrigemAtiva(v as SourceSystem)}>
        <TabsList className="mb-4">
          {ORIGENS.map((o) => (
            <TabsTrigger key={o.value} value={o.value} className="min-w-[160px]">
              {o.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {ORIGENS.map((o) => (
          <TabsContent key={o.value} value={o.value} className="space-y-6">
            <GovernanceKpis brandId={currentBrandId} origin={o.value} />

            {/* Sub-tabs */}
            <Tabs value={subTab} onValueChange={setSubTab}>
              <TabsList>
                <TabsTrigger value="ofertas">Ofertas</TabsTrigger>
                <TabsTrigger value="grupos">Grupos</TabsTrigger>
                <TabsTrigger value="denuncias">Denúncias</TabsTrigger>
                <TabsTrigger value="limpeza">Limpeza</TabsTrigger>
                <TabsTrigger value="logs">Logs</TabsTrigger>
              </TabsList>

              <TabsContent value="ofertas" className="pt-4">
                <GovernanceDealsTable brandId={currentBrandId} origin={o.value} />
              </TabsContent>

              <TabsContent value="grupos" className="pt-4">
                <GovernanceGroupsTable brandId={currentBrandId} origin={o.value} />
              </TabsContent>

              <TabsContent value="denuncias" className="pt-4">
                <GovernanceReportsTable brandId={currentBrandId} />
              </TabsContent>

              <TabsContent value="limpeza" className="pt-4">
                <GovernanceCleanup brandId={currentBrandId} origin={o.value} />
              </TabsContent>

              <TabsContent value="logs" className="pt-4">
                <GovernanceSyncLogs brandId={currentBrandId} />
              </TabsContent>
            </Tabs>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
