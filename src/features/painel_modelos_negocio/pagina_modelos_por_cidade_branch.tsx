/**
 * PaginaModelosPorCidadeBranch — Sub-fase 5.6
 * Rota: /branch-business-models
 * Versão da aba "Modelos por Cidade" para branch_admin:
 *  - Cidade fixada via `useBrandGuard().currentBranchId`
 *  - Select escondido
 *
 * Visibilidade:
 *  - Só renderiza conteúdo se a flag `business_models_ui_enabled` da brand
 *    estiver true. Caso contrário mostra estado vazio educativo.
 */
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin } from "lucide-react";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useBusinessModelsUiEnabled } from "@/compartilhados/hooks/hook_business_models_ui_flag";
import AbaModelosPorCidade from "./aba_modelos_por_cidade";

export default function PaginaModelosPorCidadeBranch() {
  const navigate = useNavigate();
  const { currentBrandId, currentBranchId } = useBrandGuard();
  const flagQ = useBusinessModelsUiEnabled(currentBrandId);

  const loading = flagQ.isLoading;

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate("/")}
          className="gap-1.5 h-8 px-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full" />
            ))}
          </div>
        </div>
      )}

      {!loading && (!currentBrandId || !currentBranchId) && (
        <Card>
          <CardContent className="py-10 text-center space-y-2">
            <MapPin className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              Não foi possível identificar a cidade do seu acesso.
              Faça login novamente ou entre em contato com o administrador
              da marca.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading &&
        currentBrandId &&
        currentBranchId &&
        !flagQ.data && (
          <Card>
            <CardContent className="py-10 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                A nova experiência de Modelos por Cidade ainda não foi
                liberada para esta marca.
              </p>
            </CardContent>
          </Card>
        )}

      {!loading && currentBrandId && currentBranchId && flagQ.data && (
        <AbaModelosPorCidade
          brandId={currentBrandId}
          lockedBranchId={currentBranchId}
        />
      )}
    </div>
  );
}
