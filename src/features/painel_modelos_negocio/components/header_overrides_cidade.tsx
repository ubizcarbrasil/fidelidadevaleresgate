/**
 * HeaderOverridesCidade — Sub-fase 5.6
 * Cabeçalho da tela de overrides por cidade:
 *  - Título + descrição
 *  - Contadores (ativos / desligados pela cidade / inativos na marca)
 *  - Botão "Voltar tudo ao herdado" (só aparece se há ao menos 1 override)
 */
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MapPin, RotateCcw } from "lucide-react";
import { useClearAllCityBusinessModelOverrides } from "@/compartilhados/hooks/hook_city_business_model_overrides";

interface Props {
  brandId: string;
  branchId: string;
  branchLabel: string;
  inheritedOnCount: number;
  overrideOffCount: number;
  inheritedOffCount: number;
  hasAnyOverride: boolean;
}

export default function HeaderOverridesCidade({
  brandId,
  branchId,
  branchLabel,
  inheritedOnCount,
  overrideOffCount,
  inheritedOffCount,
  hasAnyOverride,
}: Props) {
  const clearAll = useClearAllCityBusinessModelOverrides();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            Modelos por Cidade
          </h2>
          <p className="text-xs text-muted-foreground">
            Configure exceções por cidade. Por padrão, cada cidade herda os
            modelos ativos da marca.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-muted p-3">
        <div className="text-sm font-medium space-y-0.5">
          <div className="text-foreground">{branchLabel}</div>
          <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
            <span>
              <strong className="text-primary">{inheritedOnCount}</strong> ativos
            </span>
            <span>
              <strong className="text-destructive">{overrideOffCount}</strong>{" "}
              desligados pela cidade
            </span>
            <span>
              <strong>{inheritedOffCount}</strong> inativos na marca
            </span>
          </div>
        </div>

        {hasAnyOverride && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <RotateCcw className="h-4 w-4" />
                Voltar tudo ao herdado
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover todos os overrides?</AlertDialogTitle>
                <AlertDialogDescription>
                  Todos os overrides desta cidade serão removidos. Os modelos
                  voltarão a herdar exatamente o que está ligado na marca.
                  Essa ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    clearAll.mutate({ brandId, branchId })
                  }
                  disabled={clearAll.isPending}
                >
                  Remover todos
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
