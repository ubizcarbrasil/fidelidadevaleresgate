import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import BlocoCabecalhoLead from "./components/bloco_cabecalho_lead";
import BlocoInfoLead from "./components/bloco_info_lead";
import BlocoStatusLead from "./components/bloco_status_lead";
import BlocoHistoricoLead from "./components/bloco_historico_lead";
import { useDetalhesLead } from "./hooks/hook_detalhes_lead";

export default function PaginaDetalhesLead() {
  const { id } = useParams<{ id: string }>();
  const { data: lead, isLoading, error } = useDetalhesLead(id);

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <Card>
        <CardContent className="py-16 text-center space-y-2">
          <p className="font-medium">Lead não encontrado</p>
          <p className="text-sm text-muted-foreground">
            O lead pode ter sido removido ou o link está incorreto.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <BlocoCabecalhoLead lead={lead} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6 min-w-0">
          <BlocoInfoLead lead={lead} />
          <BlocoHistoricoLead leadId={lead.id} />
        </div>

        <div className="space-y-6">
          <BlocoStatusLead leadId={lead.id} statusAtual={lead.status} />
        </div>
      </div>
    </div>
  );
}