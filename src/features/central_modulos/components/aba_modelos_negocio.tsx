/**
 * AbaModelosNegocio — Sub-fase 5.3 + 5.4
 * Wrapper da aba "Modelos de Negócio" da Central de Módulos.
 * Sub-tabs:
 *  - Catálogo de Modelos
 *  - Modelos × Planos
 *  - Pricing (Ganha-Ganha)
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Layers, DollarSign, ShoppingCart } from "lucide-react";
import SecaoCatalogoModelos from "./secao_catalogo_modelos";
import SecaoModelosPlanos from "./secao_modelos_planos";
import SecaoPricingGanhaGanha from "./secao_pricing_ganha_ganha";
import SecaoAddonsVendidos from "./secao_addons_vendidos";

export default function AbaModelosNegocio() {
  return (
    <Tabs defaultValue="catalogo-modelos" className="w-full">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1 p-1">
        <TabsTrigger
          value="catalogo-modelos"
          className="text-[11px] sm:text-sm flex-col sm:flex-row gap-1 sm:gap-1.5 py-2 px-1"
        >
          <Briefcase className="h-4 w-4" />
          <span className="leading-none">Catálogo</span>
        </TabsTrigger>
        <TabsTrigger
          value="modelos-planos"
          className="text-[11px] sm:text-sm flex-col sm:flex-row gap-1 sm:gap-1.5 py-2 px-1"
        >
          <Layers className="h-4 w-4" />
          <span className="leading-none">Modelos × Planos</span>
        </TabsTrigger>
        <TabsTrigger
          value="pricing"
          className="text-[11px] sm:text-sm flex-col sm:flex-row gap-1 sm:gap-1.5 py-2 px-1"
        >
          <DollarSign className="h-4 w-4" />
          <span className="leading-none">Pricing</span>
        </TabsTrigger>
        <TabsTrigger
          value="addons"
          className="text-[11px] sm:text-sm flex-col sm:flex-row gap-1 sm:gap-1.5 py-2 px-1"
        >
          <ShoppingCart className="h-4 w-4" />
          <span className="leading-none">Add-ons Vendidos</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="catalogo-modelos" className="mt-4">
        <SecaoCatalogoModelos />
      </TabsContent>
      <TabsContent value="modelos-planos" className="mt-4">
        <SecaoModelosPlanos />
      </TabsContent>
      <TabsContent value="pricing" className="mt-4">
        <SecaoPricingGanhaGanha />
      </TabsContent>
      <TabsContent value="addons" className="mt-4">
        <SecaoAddonsVendidos />
      </TabsContent>
    </Tabs>
  );
}
