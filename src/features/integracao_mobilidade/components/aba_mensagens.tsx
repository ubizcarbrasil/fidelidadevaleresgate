import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, GitBranch, Send, BarChart3 } from "lucide-react";
import { ListaTemplatesMensagem } from "./lista_templates_mensagem";
import { ListaFluxosMensagem } from "./lista_fluxos_mensagem";
import { EnvioManualMensagem } from "./envio_manual_mensagem";
import { RelatorioMensagens } from "./relatorio_mensagens";
import type { Branch } from "../hooks/hook_integracoes";

interface Props {
  brandId: string;
  branches: Branch[];
}

export function AbaMensagens({ brandId, branches }: Props) {
  return (
    <Tabs defaultValue="relatorio" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="relatorio" className="text-xs sm:text-sm flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" /> Relatório
        </TabsTrigger>
        <TabsTrigger value="templates" className="text-xs sm:text-sm flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" /> Templates
        </TabsTrigger>
        <TabsTrigger value="fluxos" className="text-xs sm:text-sm flex items-center gap-1.5">
          <GitBranch className="h-3.5 w-3.5" /> Fluxos
        </TabsTrigger>
        <TabsTrigger value="envio" className="text-xs sm:text-sm flex items-center gap-1.5">
          <Send className="h-3.5 w-3.5" /> Envio
        </TabsTrigger>
      </TabsList>

      <TabsContent value="relatorio" className="mt-4">
        <RelatorioMensagens brandId={brandId} />
      </TabsContent>

      <TabsContent value="templates" className="mt-4">
        <ListaTemplatesMensagem brandId={brandId} />
      </TabsContent>

      <TabsContent value="fluxos" className="mt-4">
        <ListaFluxosMensagem brandId={brandId} branches={branches} />
      </TabsContent>

      <TabsContent value="envio" className="mt-4">
        <EnvioManualMensagem brandId={brandId} branches={branches} />
      </TabsContent>
    </Tabs>
  );
}
