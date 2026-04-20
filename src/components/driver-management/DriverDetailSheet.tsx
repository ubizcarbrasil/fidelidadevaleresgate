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
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              {driver ? cleanName(driver.name) : "Motorista"}
            </SheetTitle>
          </SheetHeader>

          {driver && (
            <Tabs defaultValue="dados" className="mt-4">
              <TabsList className="grid w-full grid-cols-6 h-auto">
                <TabsTrigger value="dados" className="text-xs px-2">Dados</TabsTrigger>
                <TabsTrigger value="veiculos" className="text-xs px-2">Veículos</TabsTrigger>
                <TabsTrigger value="documentacao" className="text-xs px-2">Docs</TabsTrigger>
                <TabsTrigger value="pontuacao" className="text-xs px-2">Pontos</TabsTrigger>
                <TabsTrigger value="regras" className="text-xs px-2">Regras</TabsTrigger>
                <TabsTrigger value="extrato" className="text-xs px-2">Extrato</TabsTrigger>
              </TabsList>

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
