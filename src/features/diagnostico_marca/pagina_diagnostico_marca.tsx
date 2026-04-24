import { useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  useDiagnosticoMarca,
  useReaplicarTemplate,
} from "./hooks/hook_diagnostico_marca";
import CabecalhoDiagnostico from "./components/cabecalho_diagnostico";
import CardResumoProduto from "./components/card_resumo_produto";
import TabelaModulosOrigem from "./components/tabela_modulos_origem";
import DialogDiffTemplate from "./components/dialog_diff_template";

export default function PaginaDiagnosticoMarca() {
  const { brandId } = useParams<{ brandId: string }>();
  const { data, isLoading, isError, error } = useDiagnosticoMarca(brandId);
  const reaplicar = useReaplicarTemplate();
  const [diffOpen, setDiffOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">
          Não foi possível carregar o diagnóstico:{" "}
          {(error as Error)?.message ?? "marca não encontrada."}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-6xl mx-auto">
      <CabecalhoDiagnostico
        marca={data.marca}
        reaplicando={reaplicar.isPending}
        onReaplicar={() =>
          reaplicar.mutate({
            brandId: data.marca.id,
            planKey: data.marca.planKey,
          })
        }
        onAbrirDiff={() => setDiffOpen(true)}
      />

      <CardResumoProduto diagnostico={data} />

      <TabelaModulosOrigem modulos={data.modulos} />

      <DialogDiffTemplate
        open={diffOpen}
        onOpenChange={setDiffOpen}
        diff={data.diffTemplate}
        produtoNome={data.marca.produtoNome ?? data.marca.planKey}
      />
    </div>
  );
}