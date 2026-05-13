import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Gift } from "lucide-react";
import { useDistribuicoesPendentes } from "../../hooks/hook_campeonato_empreendedor";
import TabelaPremiosPendentes from "./TabelaPremiosPendentes";
import ModalConfirmarDistribuicao from "./ModalConfirmarDistribuicao";
import ModalCancelarPremio from "./ModalCancelarPremio";
import type { DistribuicaoPremio } from "../../types/tipos_empreendedor";

interface Props {
  brandId: string;
  seasonId: string;
  seasonName: string;
  isFinished: boolean;
}

export default function CardPremiosADistribuir({
  brandId,
  seasonId,
  seasonName,
  isFinished,
}: Props) {
  const { data, isLoading } = useDistribuicoesPendentes(seasonId);
  const [modalConfirmar, setModalConfirmar] = useState(false);
  const [premioParaCancelar, setPremioParaCancelar] =
    useState<DistribuicaoPremio | null>(null);

  const pendentes = useMemo(
    () => (data ?? []).filter((d) => d.status === "pending"),
    [data],
  );

  const totais = useMemo(() => {
    const totalDrivers = new Set(pendentes.map((d) => d.driver_id)).size;
    const totalPoints = pendentes.reduce(
      (acc, d) => acc + d.points_awarded,
      0,
    );
    return { totalDrivers, totalPoints };
  }, [pendentes]);

  if (!isFinished) return null;
  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-lg" />;
  }
  if (pendentes.length === 0) return null;

  return (
    <Card className="border-primary/40">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <h3 className="text-base font-bold">Prêmios a Distribuir</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Temporada {seasonName} · Finalizada
        </p>

        <div className="rounded-md bg-muted/40 px-3 py-2 text-sm">
          <strong>{totais.totalDrivers}</strong> motoristas ·{" "}
          <strong>{totais.totalPoints.toLocaleString("pt-BR")}</strong> pontos
        </div>

        <TabelaPremiosPendentes
          distribuicoes={pendentes}
          aoCancelar={(d) => setPremioParaCancelar(d)}
        />

        <Button
          className="w-full"
          onClick={() => setModalConfirmar(true)}
          disabled={pendentes.length === 0}
        >
          Confirmar distribuição de {totais.totalDrivers} motoristas
        </Button>
      </CardContent>

      <ModalConfirmarDistribuicao
        open={modalConfirmar}
        onClose={() => setModalConfirmar(false)}
        brandId={brandId}
        seasonId={seasonId}
        totalDrivers={totais.totalDrivers}
        totalPoints={totais.totalPoints}
      />

      <ModalCancelarPremio
        distribuicao={premioParaCancelar}
        onClose={() => setPremioParaCancelar(null)}
        brandId={brandId}
      />
    </Card>
  );
}