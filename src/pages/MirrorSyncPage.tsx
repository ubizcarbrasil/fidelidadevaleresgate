import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/PageHeader";
import MirrorSyncKpis from "@/components/mirror-sync/MirrorSyncKpis";
import MirrorSyncDealsTable from "@/components/mirror-sync/MirrorSyncDealsTable";
import MirrorSyncLogs from "@/components/mirror-sync/MirrorSyncLogs";
import MirrorSyncConfig from "@/components/mirror-sync/MirrorSyncConfig";
import MirrorSyncDebug from "@/components/mirror-sync/MirrorSyncDebug";
import { useBrandGuard } from "@/hooks/useBrandGuard";

export default function MirrorSyncPage() {
  const { currentBrandId } = useBrandGuard();
  const [refreshKey, setRefreshKey] = useState(0);

  const onSyncDone = () => setRefreshKey((k) => k + 1);

  if (!currentBrandId) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Espelhamento de Ofertas"
        description="Importação automática de ofertas do Divulgador Inteligente para o Achadinhos"
      />

      <MirrorSyncKpis brandId={currentBrandId} refreshKey={refreshKey} onSyncDone={onSyncDone} />

      <Tabs defaultValue="deals" className="w-full">
        <TabsList>
          <TabsTrigger value="deals">Ofertas Importadas</TabsTrigger>
          <TabsTrigger value="logs">Histórico</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
          <TabsTrigger value="debug">Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="deals">
          <MirrorSyncDealsTable brandId={currentBrandId} refreshKey={refreshKey} />
        </TabsContent>

        <TabsContent value="logs">
          <MirrorSyncLogs brandId={currentBrandId} refreshKey={refreshKey} />
        </TabsContent>

        <TabsContent value="config">
          <MirrorSyncConfig brandId={currentBrandId} />
        </TabsContent>

        <TabsContent value="debug">
          <MirrorSyncDebug brandId={currentBrandId} refreshKey={refreshKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
