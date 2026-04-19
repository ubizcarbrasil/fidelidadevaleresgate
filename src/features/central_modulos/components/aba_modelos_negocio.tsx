/**
 * AbaModelosNegocio — Sub-fase 5.3
 * Wrapper da aba "Modelos de Negócio" da Central de Módulos.
 * Contém duas sub-tabs:
 *  - Catálogo de Modelos
 *  - Modelos × Planos
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Layers } from "lucide-react";
import SecaoCatalogoModelos from "./secao_catalogo_modelos";
import SecaoModelosPlanos from "./secao_modelos_planos";

export default function AbaModelosNegocio() {
  return (
    <Tabs defaultValue="catalogo-modelos" className="w-full">
      <TabsList className="grid w-full grid-cols-2 h-auto gap-1 p-1">
        <TabsTrigger
          value="catalogo-modelos"
          className="text-[11px] sm:text-sm flex-col sm:flex-row gap-1 sm:gap-1.5 py-2 px-1"
        >
          <Briefcase className="h-4 w-4" />
          <span className="leading-none">Catálogo de Modelos</span>
        </TabsTrigger>
        <TabsTrigger
          value="modelos-planos"
          className="text-[11px] sm:text-sm flex-col sm:flex-row gap-1 sm:gap-1.5 py-2 px-1"
        >
          <Layers className="h-4 w-4" />
          <span className="leading-none">Modelos × Planos</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="catalogo-modelos" className="mt-4">
        <SecaoCatalogoModelos />
      </TabsContent>
      <TabsContent value="modelos-planos" className="mt-4">
        <SecaoModelosPlanos />
      </TabsContent>
    </Tabs>
  );
}
