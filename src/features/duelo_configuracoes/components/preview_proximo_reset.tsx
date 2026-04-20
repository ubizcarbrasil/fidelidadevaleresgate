import { Loader2 } from "lucide-react";
import { usePreviewReset } from "../hooks/hook_preview_reset";

interface Props {
  branchId: string;
  brandId: string;
  onlyActive: boolean;
  minRides: number;
  initialPoints: number;
  action: string;
}

const ACAO_LABEL: Record<string, string> = {
  no_zero: "o saldo atual será preservado",
  zero_duel: "o saldo de duelos será zerado",
  zero_rides: "o saldo de corridas será zerado",
  zero_both: "o saldo total será zerado",
};

export default function PreviewProximoReset(p: Props) {
  const { data, isLoading } = usePreviewReset(p);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-muted/40 p-3 text-sm flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Calculando previsão...
      </div>
    );
  }

  const elegiveis = data?.elegiveis ?? 0;
  const total = data?.totalDistribuido ?? 0;

  return (
    <div className="rounded-lg border bg-primary/5 border-primary/20 p-3 text-sm">
      <strong className="text-foreground">Próximo reset:</strong>{" "}
      <span className="text-foreground">{elegiveis}</span> motoristas receberão{" "}
      <span className="font-semibold">{p.initialPoints.toLocaleString("pt-BR")}</span> pontos cada — total de{" "}
      <span className="font-semibold">{total.toLocaleString("pt-BR")}</span> pontos distribuídos.
      {p.action !== "no_zero" && (
        <span className="block mt-1 text-muted-foreground">Antes de creditar, {ACAO_LABEL[p.action]}.</span>
      )}
    </div>
  );
}