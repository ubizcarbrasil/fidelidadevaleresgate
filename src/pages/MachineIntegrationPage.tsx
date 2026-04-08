import { useState } from "react";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Car, Send, MessageSquareText } from "lucide-react";
import { useIntegracoes } from "@/features/integracao_mobilidade/hooks/hook_integracoes";
import { CardCredenciaisMatriz } from "@/features/integracao_mobilidade/components/card_credenciais_matriz";
import { AbaPontuarPassageiro } from "@/features/integracao_mobilidade/components/aba_pontuar_passageiro";
import { AbaPontuarMotorista } from "@/features/integracao_mobilidade/components/aba_pontuar_motorista";
import { AbaNotificacoes } from "@/features/integracao_mobilidade/components/aba_notificacoes";
import { AbaMensagens } from "@/features/integracao_mobilidade/components/aba_mensagens";

export default function MachineIntegrationPage() {
  const { currentBrandId } = useBrandGuard();
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const {
    branches,
    integrations,
    activeIntegrations,
    availableBranches,
    brandMatrix,
    isLoading,
    getBranchName,
  } = useIntegracoes(currentBrandId);

  const selectedIntegration = selectedBranchId
    ? integrations.find((i) => i.branch_id === selectedBranchId && i.is_active)
    : null;

  if (!currentBrandId) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integração de Mobilidade"
        description="Conecte cada cidade à sua plataforma de corridas para pontuar clientes automaticamente"
      />

      <CardCredenciaisMatriz brandId={currentBrandId} brandMatrix={brandMatrix} />

      <Tabs defaultValue="passageiro" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="passageiro" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Pontuar</span> Pass.
          </TabsTrigger>
          <TabsTrigger value="motorista" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Car className="h-4 w-4" />
            <span className="hidden sm:inline">Pontuar</span> Mot.
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Notif.</span>
          </TabsTrigger>
          <TabsTrigger value="mensagens" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <MessageSquareText className="h-4 w-4" />
            <span className="hidden sm:inline">Mensagens</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="passageiro" className="mt-6">
          <AbaPontuarPassageiro
            brandId={currentBrandId}
            activeIntegrations={activeIntegrations}
            selectedIntegration={selectedIntegration ?? null}
            getBranchName={getBranchName}
          />
        </TabsContent>

        <TabsContent value="motorista" className="mt-6">
          <AbaPontuarMotorista
            brandId={currentBrandId}
            integrations={integrations}
            activeIntegrations={activeIntegrations}
            availableBranches={availableBranches}
            branches={branches}
            getBranchName={getBranchName}
          />
        </TabsContent>

        <TabsContent value="notificacoes" className="mt-6">
          <AbaNotificacoes
            brandId={currentBrandId}
            integrations={integrations}
            activeIntegrations={activeIntegrations}
            branches={branches}
            getBranchName={getBranchName}
          />
        </TabsContent>

        <TabsContent value="mensagens" className="mt-6">
          <AbaMensagens
            brandId={currentBrandId}
            branches={branches}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
