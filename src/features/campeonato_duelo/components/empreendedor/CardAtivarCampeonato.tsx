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
import { useDueloCampeonatoHabilitado } from "@/compartilhados/hooks/hook_duelo_campeonato_habilitado";
import { useAlterarAtivacaoCampeonato } from "../../hooks/hook_ativar_campeonato";

interface Props {
  brandId: string;
}

/**
 * Card de ativação por marca do Campeonato Duelo Motorista.
 *
 * - Quando desativado: mostra apresentação completa + CTA "Ativar Campeonato".
 * - Quando ativado: mostra estado compacto com link para desativar.
 * - Confirmação obrigatória ao desativar (não cancela temporadas em curso).
 */
export default function CardAtivarCampeonato({ brandId }: Props) {
  const { campeonatoHabilitado, isLoading } =
    useDueloCampeonatoHabilitado(brandId);
  const { mutate, isPending } = useAlterarAtivacaoCampeonato();
  const [confirmarDesativar, setConfirmarDesativar] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 p-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Verificando status do campeonato...
          </span>
        </CardContent>
      </Card>
    );
  }

  if (campeonatoHabilitado) {
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
              onClick={() => setConfirmarDesativar(true)}
              disabled={isPending}
            >
              <PowerOff className="mr-1.5 h-3.5 w-3.5" />
              Desativar
            </Button>
          </CardContent>
        </Card>

        <AlertDialog
          open={confirmarDesativar}
          onOpenChange={(v) => !v && setConfirmarDesativar(false)}
        >
          <AlertDialogContent>
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
              <AlertDialogCancel disabled={isPending}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  mutate(
                    { brandId, habilitado: false },
                    { onSettled: () => setConfirmarDesativar(false) },
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

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold">
              Campeonato Duelo Motorista
            </h3>
            <p className="text-sm text-muted-foreground">
              Sistema de temporadas mensais com séries hierárquicas (A, B, C…),
              fase de classificação, mata-mata, hall da fama público e
              distribuição automática de prêmios.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-muted-foreground/60" />
            <span className="text-sm">
              Status:{" "}
              <strong className="text-muted-foreground">
                Desativado para esta marca
              </strong>
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => mutate({ brandId, habilitado: true })}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Power className="mr-2 h-3.5 w-3.5" />
            )}
            Ativar Campeonato
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}