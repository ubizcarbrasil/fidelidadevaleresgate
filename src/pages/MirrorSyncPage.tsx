import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/PageHeader";
import MirrorSyncKpis from "@/components/mirror-sync/MirrorSyncKpis";
import MirrorSyncDealsTable from "@/components/mirror-sync/MirrorSyncDealsTable";
import MirrorSyncLogs from "@/components/mirror-sync/MirrorSyncLogs";
import MirrorSyncConfig from "@/components/mirror-sync/MirrorSyncConfig";
import MirrorSyncDebug from "@/components/mirror-sync/MirrorSyncDebug";
import MirrorSyncCategoryDiag from "@/components/mirror-sync/MirrorSyncCategoryDiag";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import ListaConectores from "@/features/conectores_origem/lista_conectores";
import { fetchSourceCatalog } from "@/lib/api/mirrorSync";

export default function MirrorSyncPage() {
  const { currentBrandId } = useBrandGuard();
  const [refreshKey, setRefreshKey] = useState(0);
  const [sourceType, setSourceType] = useState("divulgador_inteligente");

  const { data: catalog = [] } = useQuery({
    queryKey: ["source-catalog-enabled"],
    queryFn: () => fetchSourceCatalog({ onlyEnabled: true }),
  });

  const onSyncDone = () => setRefreshKey((k) => k + 1);

  if (!currentBrandId) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <PageHeader
          title="Espelhamento de Ofertas"
          description="Importação automática de ofertas de fontes externas para o Achadinhos"
        />
        <div className="space-y-1 min-w-[200px]">
          <Label className="text-xs text-muted-foreground">Fonte</Label>
          <Select value={sourceType} onValueChange={setSourceType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {catalog.map((opt) => (
                <SelectItem key={opt.source_key} value={opt.source_key}>{opt.display_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <MirrorSyncKpis brandId={currentBrandId} refreshKey={refreshKey} onSyncDone={onSyncDone} sourceType={sourceType} />

      <Tabs defaultValue="conectores" className="w-full">
        <TabsList className="w-full overflow-x-auto scrollbar-hide justify-start">
          <TabsTrigger value="conectores">Conectores</TabsTrigger>
          <TabsTrigger value="deals">Ofertas</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="logs">Histórico</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
          <TabsTrigger value="debug">Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="conectores">
          <ListaConectores brandId={currentBrandId} sourceType={sourceType} />
        </TabsContent>

        <TabsContent value="deals">
          <MirrorSyncDealsTable brandId={currentBrandId} refreshKey={refreshKey} sourceType={sourceType} />
        </TabsContent>

        <TabsContent value="categorias">
          <MirrorSyncCategoryDiag brandId={currentBrandId} refreshKey={refreshKey} sourceType={sourceType} />
        </TabsContent>

        <TabsContent value="logs">
          <MirrorSyncLogs brandId={currentBrandId} refreshKey={refreshKey} />
        </TabsContent>

        <TabsContent value="config">
          <MirrorSyncConfig brandId={currentBrandId} sourceType={sourceType} />
        </TabsContent>

        <TabsContent value="debug">
          <MirrorSyncDebug brandId={currentBrandId} refreshKey={refreshKey} sourceType={sourceType} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
