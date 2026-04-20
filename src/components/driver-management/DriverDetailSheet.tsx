import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Truck } from "lucide-react";
import type { DriverRow } from "@/types/driver";
import ManualDriverScoringDialog from "@/components/machine-integration/ManualDriverScoringDialog";
import AbaDadosMotorista from "./tabs/AbaDadosMotorista";
import AbaVeiculosMotorista from "./tabs/AbaVeiculosMotorista";
import AbaDocumentacaoMotorista from "./tabs/AbaDocumentacaoMotorista";
import AbaPontuacaoMotorista from "./tabs/AbaPontuacaoMotorista";
import AbaRegrasMotorista from "./tabs/AbaRegrasMotorista";
import AbaExtratoMotorista from "./tabs/AbaExtratoMotorista";

interface Props {
  driver: DriverRow | null;
  brandId: string;
  onClose: () => void;
}

const cleanName = (name: string | null) =>
  name?.replace(/\[MOTORISTA\]\s*/i, "").trim() || "Sem nome";

export default function DriverDetailSheet({ driver, brandId, onClose }: Props) {
  const [bonusOpen, setBonusOpen] = useState(false);

  return (
    <>
      <Sheet open={!!driver} onOpenChange={(open) => { if (!open) onClose(); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-4 sm:p-6 pwa-safe-bottom">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-base sm:text-lg pr-6">
              <Truck className="h-5 w-5 text-primary" />
              <span className="truncate">{driver ? cleanName(driver.name) : "Motorista"}</span>
            </SheetTitle>
          </SheetHeader>

          {driver && (
            <Tabs defaultValue="dados" className="mt-4">
              <div className="tabs-scroll-mobile -mx-1 px-1">
                <TabsList className="inline-flex w-max sm:w-full sm:grid sm:grid-cols-6 h-auto gap-1">
                  <TabsTrigger value="dados" className="text-xs px-3 py-1.5">Dados</TabsTrigger>
                  <TabsTrigger value="veiculos" className="text-xs px-3 py-1.5">Veículos</TabsTrigger>
                  <TabsTrigger value="documentacao" className="text-xs px-3 py-1.5">Docs</TabsTrigger>
                  <TabsTrigger value="pontuacao" className="text-xs px-3 py-1.5">Pontos</TabsTrigger>
                  <TabsTrigger value="regras" className="text-xs px-3 py-1.5">Regras</TabsTrigger>
                  <TabsTrigger value="extrato" className="text-xs px-3 py-1.5">Extrato</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="dados">
                <AbaDadosMotorista driver={driver} brandId={brandId} />
              </TabsContent>

              <TabsContent value="veiculos">
                <AbaVeiculosMotorista driverId={driver.id} />
              </TabsContent>

              <TabsContent value="documentacao">
                <AbaDocumentacaoMotorista driverId={driver.id} />
              </TabsContent>

              <TabsContent value="pontuacao">
                <AbaPontuacaoMotorista driver={driver} onAddPoints={() => setBonusOpen(true)} />
              </TabsContent>

              <TabsContent value="regras">
                <AbaRegrasMotorista driverId={driver.id} brandId={brandId} />
              </TabsContent>

              <TabsContent value="extrato">
                <AbaExtratoMotorista driverId={driver.id} driverName={cleanName(driver.name)} />
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>

      {driver && (
        <ManualDriverScoringDialog
          open={bonusOpen}
          onOpenChange={setBonusOpen}
          driver={{ id: driver.id, name: driver.name, branch_id: driver.branch_id || undefined }}
          brandId={brandId}
        />
      )}
    </>
  );
}
