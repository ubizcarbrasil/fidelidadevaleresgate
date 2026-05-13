import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Power, PowerOff } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAlterarAtivacaoCampeonato } from "../../../hooks/hook_ativar_campeonato";

interface Props {
  brandId: string;
}

export default function CardAtivacaoCompacto({ brandId }: Props) {
  const { mutate, isPending } = useAlterarAtivacaoCampeonato();
  const [confirmar, setConfirmar] = useState(false);

  return (
    <>
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
              <Trophy className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Campeonato ativo</p>
              <p className="text-xs text-muted-foreground">
                Temporadas mensais com séries hierárquicas estão liberadas
                para esta marca.
              </p>
            </div>
            <Badge
              variant="secondary"
              className="ml-2 hidden gap-1 sm:inline-flex"
            >
              <Power className="h-3 w-3" /> Ligado
            </Badge>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => setConfirmar(true)}
            disabled={isPending}
          >
            <PowerOff className="mr-1.5 h-3.5 w-3.5" />
            Desativar
          </Button>
        </CardContent>
      </Card>

      <AlertDialog
        open={confirmar}
        onOpenChange={(v) => !v && setConfirmar(false)}
      >
        <AlertDialogContent className="z-[100]">
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar campeonato?</AlertDialogTitle>
            <AlertDialogDescription>
              Os menus e dashboards do campeonato deixarão de aparecer para
              empreendedores e motoristas desta marca. Temporadas em curso
              <strong> não serão canceladas</strong> — ficam preservadas no
              banco e voltam a aparecer ao reativar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                mutate(
                  { brandId, habilitado: false },
                  { onSettled: () => setConfirmar(false) },
                )
              }
              disabled={isPending}
            >
              {isPending && (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              )}
              Confirmar desativação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}