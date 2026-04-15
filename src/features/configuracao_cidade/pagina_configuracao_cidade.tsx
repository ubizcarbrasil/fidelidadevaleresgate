import { useState } from "react";
import { Settings2, MapPin } from "lucide-react";
import { SeletorCidadeConfig } from "./components/seletor_cidade_config";
import { PainelTogglesCidade } from "./components/painel_toggles_cidade";
import { useCidadesDisponiveis, useConfiguracaoCidade } from "./hooks/hook_configuracao_cidade";
import { Loader2 } from "lucide-react";

export default function PaginaConfiguracaoCidade() {
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string | null>(null);
  const { data: cidades, isLoading: loadingCidades } = useCidadesDisponiveis();
  const { config, isLoading: loadingConfig, toggleConfig, isSaving } = useConfiguracaoCidade(cidadeSelecionada);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Settings2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Configuração por Cidade</h1>
          <p className="text-sm text-muted-foreground">Controle quais funcionalidades cada cidade oferece ao motorista.</p>
        </div>
      </div>

      {/* City selector */}
      {loadingCidades ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Carregando cidades…</div>
      ) : (
        <SeletorCidadeConfig
          cidades={cidades ?? []}
          cidadeSelecionada={cidadeSelecionada}
          onSelecionar={setCidadeSelecionada}
        />
      )}

      {/* Toggles */}
      {cidadeSelecionada && loadingConfig && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Carregando configurações…</div>
      )}

      {cidadeSelecionada && config && (
        <PainelTogglesCidade config={config} onToggle={(key, value) => toggleConfig({ key, value })} isSaving={isSaving} />
      )}

      {!cidadeSelecionada && !loadingCidades && (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <MapPin className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">Selecione uma cidade acima para configurar as funcionalidades.</p>
        </div>
      )}
    </div>
  );
}
