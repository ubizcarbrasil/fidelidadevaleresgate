import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Eye, RefreshCw, GitCompare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ResumoMarca } from "../types/tipos_diagnostico";

interface Props {
  marca: ResumoMarca;
  reaplicando: boolean;
  onReaplicar: () => void;
  onAbrirDiff: () => void;
}

export default function CabecalhoDiagnostico({
  marca,
  reaplicando,
  onReaplicar,
  onAbrirDiff,
}: Props) {
  const navigate = useNavigate();

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-7 text-muted-foreground"
            onClick={() => navigate("/brands")}
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Voltar para Marcas
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            Diagnóstico — {marca.nome}
          </h1>
          <p className="text-sm text-muted-foreground">
            Auditoria de origem dos módulos ativos. Use esta tela quando uma
            marca apresentar funcionalidades fora do produto contratado.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(`/?brandId=${marca.id}`, "_blank", "noopener")
            }
          >
            <Eye className="h-4 w-4 mr-2" /> Ver como esta marca
          </Button>
          <Button variant="outline" size="sm" onClick={onAbrirDiff}>
            <GitCompare className="h-4 w-4 mr-2" /> Comparar com template
          </Button>
          <Button size="sm" onClick={onReaplicar} disabled={reaplicando}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${reaplicando ? "animate-spin" : ""}`}
            />
            Reaplicar template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t">
        <InfoItem label="Slug" value={marca.slug} />
        <InfoItem
          label="Produto contratado"
          value={marca.produtoNome ?? marca.planKey}
        />
        <InfoItem
          label="Status da assinatura"
          value={<Badge variant="secondary">{marca.subscriptionStatus}</Badge>}
        />
        <InfoItem
          label="Criada em"
          value={
            marca.ultimaAplicacaoTemplate
              ? new Date(marca.ultimaAplicacaoTemplate).toLocaleDateString("pt-BR")
              : "—"
          }
        />
      </div>
    </Card>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}