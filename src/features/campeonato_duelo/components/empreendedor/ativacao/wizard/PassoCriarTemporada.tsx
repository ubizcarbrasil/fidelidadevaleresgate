import { Button } from "@/components/ui/button";
import FormCriarTemporadaAutomatico from "../../FormCriarTemporadaAutomatico";

interface Props {
  brandId: string;
  branchId: string;
  onCriado: () => void;
  onPular: () => void;
}

export default function PassoCriarTemporada({
  brandId,
  branchId,
  onCriado,
  onPular,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Criar a 1ª temporada</h3>
        <p className="text-sm text-muted-foreground">
          Defina apenas o início e a duração de cada fase. O sistema cuida do
          resto.
        </p>
      </div>

      <FormCriarTemporadaAutomatico
        brandId={brandId}
        branchId={branchId}
        onClose={onCriado}
      />

      <div className="border-t border-border pt-3">
        <Button variant="ghost" size="sm" onClick={onPular}>
          Pular por enquanto
        </Button>
      </div>
    </div>
  );
}