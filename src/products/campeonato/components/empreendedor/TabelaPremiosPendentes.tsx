import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Medal, Award, X } from "lucide-react";
import type {
  DistribuicaoPremio,
  PosicaoPremio,
} from "../../types/tipos_empreendedor";

const ICONES_POSICAO: Record<PosicaoPremio, JSX.Element> = {
  champion: <Crown className="h-4 w-4 text-primary" />,
  runner_up: <Medal className="h-4 w-4 text-muted-foreground" />,
  semifinalist: <Medal className="h-4 w-4 text-muted-foreground/70" />,
  quarterfinalist: <Award className="h-4 w-4 text-muted-foreground/60" />,
  r16: <Award className="h-4 w-4 text-muted-foreground/50" />,
};

const ROTULOS_POSICAO: Record<PosicaoPremio, string> = {
  champion: "Campeão",
  runner_up: "Vice",
  semifinalist: "Semi",
  quarterfinalist: "Quartas",
  r16: "Oitavas",
};

interface Props {
  distribuicoes: DistribuicaoPremio[];
  aoCancelar?: (dist: DistribuicaoPremio) => void;
  cancelarDesabilitado?: boolean;
}

export default function TabelaPremiosPendentes({
  distribuicoes,
  aoCancelar,
  cancelarDesabilitado,
}: Props) {
  if (distribuicoes.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Nenhum prêmio listado.
      </p>
    );
  }

  // Agrupa por tier
  const porTier = distribuicoes.reduce<Record<string, DistribuicaoPremio[]>>(
    (acc, d) => {
      acc[d.tier_name] = acc[d.tier_name] ?? [];
      acc[d.tier_name].push(d);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-3">
      {Object.entries(porTier).map(([tier, lista]) => (
        <div key={tier} className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {tier}
            </Badge>
          </div>
          <ul className="space-y-1">
            {lista.map((d) => (
              <li
                key={d.id}
                className="flex items-center gap-2 rounded-md border border-border/40 bg-card px-3 py-2"
              >
                {ICONES_POSICAO[d.position]}
                <span className="flex-1 truncate text-sm">
                  {d.driver_name ?? d.driver_id.slice(0, 8)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {ROTULOS_POSICAO[d.position]}
                </span>
                <span className="w-20 text-right text-sm font-semibold">
                  {d.points_awarded.toLocaleString("pt-BR")} pts
                </span>
                {d.status === "pending" && aoCancelar && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    disabled={cancelarDesabilitado}
                    onClick={() => aoCancelar(d)}
                    aria-label="Cancelar prêmio"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
                {d.status === "cancelled" && (
                  <Badge variant="destructive" className="text-[10px]">
                    Cancelado
                  </Badge>
                )}
                {d.status === "confirmed" && (
                  <Badge variant="secondary" className="text-[10px]">
                    Pago
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}