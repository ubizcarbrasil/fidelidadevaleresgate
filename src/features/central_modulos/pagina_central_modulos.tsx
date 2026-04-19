// Fase 4.1b - rebuild forçado em 2026-04-18 v3 (invalidar cache de bundle do preview)
const BUILD_TAG_FASE_4_1B = "fase-4.1b-rebuild-2026-04-18-v3";
if (typeof window !== "undefined") {
  (window as unknown as { __BUILD_TAG__?: string }).__BUILD_TAG__ = BUILD_TAG_FASE_4_1B;
}
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, Package, Layers, Building2, MapPin, History, Briefcase } from "lucide-react";
import AbaCatalogo from "./components/aba_catalogo";
import AbaModelosNegocio from "./components/aba_modelos_negocio";
import AbaPlanos from "./components/aba_planos";
import AbaEmpreendedores from "./components/aba_empreendedores";
import AbaCidades from "./components/aba_cidades";
import AbaAuditoria from "./components/aba_auditoria";

export default function PaginaCentralModulos() {
  return (
    <div className="container mx-auto p-3 sm:p-4 space-y-4 max-w-7xl">
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold leading-tight">Central de Módulos</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Catálogo, planos, ativações por marca e overrides por cidade.
          </p>
        </div>
      </div>

      <Tabs defaultValue="catalogo" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto gap-1 p-1">
          <TabsTrigger value="catalogo" className="text-[11px] sm:text-sm flex-col sm:flex-row gap-1 sm:gap-1.5 py-2 px-1">
            <Package className="h-4 w-4" />
            <span className="leading-none">Catálogo</span>
          </TabsTrigger>
          <TabsTrigger value="modelos" className="text-[11px] sm:text-sm flex-col sm:flex-row gap-1 sm:gap-1.5 py-2 px-1">
            <Briefcase className="h-4 w-4" />
            <span className="leading-none truncate max-w-full">Modelos</span>
          </TabsTrigger>
          <TabsTrigger value="planos" className="text-[11px] sm:text-sm flex-col sm:flex-row gap-1 sm:gap-1.5 py-2 px-1">
            <Layers className="h-4 w-4" />
            <span className="leading-none">Planos</span>
          </TabsTrigger>
          <TabsTrigger value="empreendedores" className="text-[11px] sm:text-sm flex-col sm:flex-row gap-1 sm:gap-1.5 py-2 px-1">
            <Building2 className="h-4 w-4" />
            <span className="leading-none truncate max-w-full">Empreend.</span>
          </TabsTrigger>
          <TabsTrigger value="cidades" className="text-[11px] sm:text-sm flex-col sm:flex-row gap-1 sm:gap-1.5 py-2 px-1">
            <MapPin className="h-4 w-4" />
            <span className="leading-none">Cidades</span>
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="text-[11px] sm:text-sm flex-col sm:flex-row gap-1 sm:gap-1.5 py-2 px-1">
            <History className="h-4 w-4" />
            <span className="leading-none">Auditoria</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalogo" className="mt-4"><AbaCatalogo /></TabsContent>
        <TabsContent value="modelos" className="mt-4"><AbaModelosNegocio /></TabsContent>
        <TabsContent value="planos" className="mt-4"><AbaPlanos /></TabsContent>
        <TabsContent value="empreendedores" className="mt-4"><AbaEmpreendedores /></TabsContent>
        <TabsContent value="cidades" className="mt-4"><AbaCidades /></TabsContent>
        <TabsContent value="auditoria" className="mt-4"><AbaAuditoria /></TabsContent>
      </Tabs>
    </div>
  );
}
