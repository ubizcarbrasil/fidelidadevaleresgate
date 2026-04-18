// Fase 4.1b - rebuild forçado em 2026-04-18 (invalidar cache de bundle do preview)
const BUILD_TAG_FASE_4_1B = "fase-4.1b-rebuild-2026-04-18-v2";
if (typeof window !== "undefined") {
  (window as unknown as { __BUILD_TAG__?: string }).__BUILD_TAG__ = BUILD_TAG_FASE_4_1B;
}
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, Package, Layers, Building2, MapPin } from "lucide-react";
import AbaCatalogo from "./components/aba_catalogo";
import AbaPlanos from "./components/aba_planos";
import AbaEmpreendedores from "./components/aba_empreendedores";
import AbaCidades from "./components/aba_cidades";

export default function PaginaCentralModulos() {
  return (
    <div className="container mx-auto p-4 space-y-4 max-w-7xl">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <LayoutGrid className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Central de Módulos</h1>
          <p className="text-sm text-muted-foreground">
            Catálogo, templates de plano, ativações por marca e overrides por cidade — tudo em um lugar.
          </p>
        </div>
      </div>

      <Tabs defaultValue="catalogo" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="catalogo"><Package className="h-4 w-4 mr-1" />Catálogo</TabsTrigger>
          <TabsTrigger value="planos"><Layers className="h-4 w-4 mr-1" />Planos</TabsTrigger>
          <TabsTrigger value="empreendedores"><Building2 className="h-4 w-4 mr-1" />Empreendedores</TabsTrigger>
          <TabsTrigger value="cidades"><MapPin className="h-4 w-4 mr-1" />Cidades</TabsTrigger>
        </TabsList>

        <TabsContent value="catalogo" className="mt-4"><AbaCatalogo /></TabsContent>
        <TabsContent value="planos" className="mt-4"><AbaPlanos /></TabsContent>
        <TabsContent value="empreendedores" className="mt-4"><AbaEmpreendedores /></TabsContent>
        <TabsContent value="cidades" className="mt-4"><AbaCidades /></TabsContent>
      </Tabs>
    </div>
  );
}
