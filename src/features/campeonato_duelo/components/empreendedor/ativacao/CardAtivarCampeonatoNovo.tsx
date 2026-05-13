import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Power } from "lucide-react";
import { useDueloCampeonatoHabilitado } from "@/compartilhados/hooks/hook_duelo_campeonato_habilitado";
import { useAlterarAtivacaoCampeonato } from "../../../hooks/hook_ativar_campeonato";
import HeroAtivacao from "./HeroAtivacao";
import ComoFuncionaCards from "./ComoFuncionaCards";
import ChecklistRecursosAtivados from "./ChecklistRecursosAtivados";
import AlertaPreRequisitos from "./AlertaPreRequisitos";
import CardAtivacaoCompacto from "./CardAtivacaoCompacto";

interface Props {
  brandId: string;
  /** Disparado após uma ativação bem-sucedida para abrir o wizard. */
  onAtivado?: () => void;
}

/**
 * Tela de ativação do Campeonato Duelo — versão educativa e premium.
 * Quando ativado, colapsa para o card compacto antigo.
 */
export default function CardAtivarCampeonatoNovo({ brandId, onAtivado }: Props) {
  const { campeonatoHabilitado, isLoading } =
    useDueloCampeonatoHabilitado(brandId);
  const { mutate, isPending } = useAlterarAtivacaoCampeonato();

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
    return <CardAtivacaoCompacto brandId={brandId} />;
  }

  function ativar() {
    mutate(
      { brandId, habilitado: true },
      {
        onSuccess: () => {
          onAtivado?.();
        },
      },
    );
  }

  return (
    <div className="space-y-4">
      <HeroAtivacao />
      <ComoFuncionaCards />
      <ChecklistRecursosAtivados />
      <AlertaPreRequisitos />

      <div className="sticky bottom-2 z-10">
        <Card className="border-primary/30 shadow-lg shadow-primary/10">
          <CardContent className="flex flex-col items-stretch gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">
                Pronto para ativar o campeonato?
              </p>
              <p className="text-xs text-muted-foreground">
                Em seguida, um assistente vai te guiar até a primeira temporada.
              </p>
            </div>
            <Button size="lg" onClick={ativar} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Power className="mr-2 h-4 w-4" />
              )}
              Ativar Campeonato
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}