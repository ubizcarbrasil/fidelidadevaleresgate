import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Info } from "lucide-react";
import AbaGeral from "./components/aba_geral";
import AbaLimitesAposta from "./components/aba_limites_aposta";
import AbaCicloReset from "./components/aba_ciclo_reset";
import AbaCampanhasPremio from "./components/aba_campanhas_premio";
import AbaIntegracaoCorridas from "./components/aba_integracao_corridas";

interface Props {
  branchId: string;
  brandId: string;
  settings: Record<string, any>;
  engagementFormat?: string;
}

export default function PaginaConfiguracoesDuelo({ branchId, brandId, settings, engagementFormat }: Props) {
  const isCampeonato = engagementFormat === "campeonato";

  if (isCampeonato) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "hsl(var(--primary) / 0.15)" }}>
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">Modo Campeonato ativo</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Esta marca opera no formato <strong>Campeonato</strong>. As configurações de duelos
                1v1, apostas paralelas, ranking e cinturão estão desativadas e ocultas. Toda a
                gestão competitiva acontece pela aba <strong>Campeonato</strong>: temporadas,
                séries, prêmios e classificação.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground rounded-md bg-background/60 border px-3 py-2">
            <Info className="h-3.5 w-3.5 shrink-0" />
            <span>Para liberar outros formatos, fale com o suporte.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

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