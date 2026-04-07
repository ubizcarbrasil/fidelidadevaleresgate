import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket } from "lucide-react";
import { SeletorCidade } from "./components/seletor_cidade";
import { IndicadorProgresso } from "./components/indicador_progresso";
import { EtapaOnboardingCard } from "./components/etapa_onboarding";
import { PainelTesteFinal } from "./components/painel_teste_final";
import { AcoesCidade } from "./components/acoes_cidade";
import { useValidacaoCidade } from "./hooks/hook_validacao_cidade";
import { ETAPAS_ONBOARDING } from "./constants/constantes_etapas";

export default function PaginaOnboardingCidade() {
  const { currentBrandId } = useBrandGuard();
  const [branchId, setBranchId] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const { data: validacao, isLoading } = useValidacaoCidade(branchId);

  const { data: branches = [] } = useQuery({
    queryKey: ["onboarding-branches", currentBrandId],
    enabled: !!currentBrandId,
    queryFn: async () => {
      const { data } = await supabase
        .from("branches")
        .select("id, name")
        .eq("brand_id", currentBrandId!)
        .order("name");
      return data ?? [];
    },
  });

  const selectedBranch = branches.find((b) => b.id === branchId);

  const toggleStep = (id: string) =>
    setExpandedStep(expandedStep === id ? null : id);

  // Filter steps by scoring model
  const etapasVisiveis = ETAPAS_ONBOARDING.filter((etapa) => {
    if (!etapa.condicional || !validacao) return true;
    const modelo = validacao.modeloNegocio.mensagem;
    if (etapa.condicional === "DRIVER") {
      return modelo.includes("DRIVER") || modelo.includes("BOTH");
    }
    if (etapa.condicional === "PASSENGER") {
      return modelo.includes("PASSENGER") || modelo.includes("BOTH");
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Onboarding de Cidade"
        description="Valide todas as configurações antes de ativar uma nova cidade."
      />

      {/* Banner */}
      <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Rocket className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-sm mb-1">Ativar Nova Cidade</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Selecione a cidade e acompanhe em tempo real o status de cada
                configuração. O sistema valida automaticamente cada etapa.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary" className="text-xs">Validação automática</Badge>
                <Badge variant="secondary" className="text-xs">7 Etapas</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* City selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Selecione a cidade para validar:</label>
        <div className="flex items-center gap-2">
          <SeletorCidade value={branchId} onChange={setBranchId} />
          {branchId && (
            <AcoesCidade
              branchId={branchId}
              branchName={selectedBranch?.name}
              onDeleted={() => setBranchId(null)}
            />
          )}
        </div>
      </div>

      {branchId && (
        <>
          {/* Progress */}
          <IndicadorProgresso validacao={validacao} />

          {/* Steps timeline */}
          <div className="relative space-y-3">
            <div className="absolute left-[22px] top-4 bottom-4 w-0.5 bg-border" />
            {etapasVisiveis.map((etapa) => (
              <EtapaOnboardingCard
                key={etapa.id}
                etapa={etapa}
                validacao={validacao?.[etapa.chaveValidacao]}
                expandida={expandedStep === etapa.id}
                onToggle={() => toggleStep(etapa.id)}
              />
            ))}
          </div>

          {/* Final test panel */}
          <PainelTesteFinal validacao={validacao} isLoading={isLoading} />
        </>
      )}
    </div>
  );
}
