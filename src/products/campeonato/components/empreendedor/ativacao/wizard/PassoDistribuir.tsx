import { useState } from "react";
import { CheckCircle2, Loader2, Users, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardCampeonato } from "../../../../hooks/hook_campeonato_empreendedor";
import { useExecutarSeedingTemporada } from "../../../../hooks/hook_mutations_campeonato";
import DistribuicaoManualView from "../../DistribuicaoManualView";

interface Props {
  brandId: string;
  onConcluir: () => void;
}

export default function PassoDistribuir({ brandId, onConcluir }: Props) {
  const { data: dashboard } = useDashboardCampeonato(brandId);
  const ativa = dashboard?.active_season ?? null;
  const seedingMutation = useExecutarSeedingTemporada(brandId);
  const [distribuicaoAberta, setDistribuicaoAberta] = useState(false);

  function distribuirAgora() {
    if (!ativa) return;
    seedingMutation.mutate(ativa.id, {
      onSuccess: () => setDistribuicaoAberta(true),
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <PartyPopper className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Quase lá!</h3>
          <p className="text-sm text-muted-foreground">
            Sua temporada{" "}
            {ativa?.name && <strong>{ativa.name}</strong>} foi criada. Falta
            apenas distribuir os motoristas pelas séries.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Por que distribuir?
        </p>
        <ul className="space-y-2 text-xs">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            Sem distribuição, o app do motorista mostra "nenhum campeonato ativo".
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            Você pode ajustar manualmente quem fica em cada série depois.
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onConcluir}>
          Distribuir depois
        </Button>
        <Button onClick={distribuirAgora} disabled={!ativa || seedingMutation.isPending}>
          {seedingMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Users className="mr-2 h-4 w-4" />
          )}
          Distribuir motoristas agora
        </Button>
      </div>

      {ativa && (
        <DistribuicaoManualView
          open={distribuicaoAberta}
          onClose={() => {
            setDistribuicaoAberta(false);
            onConcluir();
          }}
          brandId={brandId}
          seasonId={ativa.id}
          fase={ativa.phase}
        />
      )}
    </div>
  );
}