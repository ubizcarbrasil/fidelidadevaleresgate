import { Trophy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFormatoEngajamento } from "../../../../hooks/hook_formato_engajamento";

interface Props {
  brandId: string;
  onContinuar: () => void;
}

export default function PassoFormato({ brandId, onContinuar }: Props) {
  const { formato } = useFormatoEngajamento(brandId);
  const ehCampeonato = formato === "campeonato";

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Formato de engajamento</h3>
        <p className="text-sm text-muted-foreground">
          Confirmamos que o formato desta marca é{" "}
          <strong>Campeonato</strong>. Você pode trocar depois nas configurações.
        </p>
      </div>

      <div className="rounded-lg border border-primary bg-primary/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/15">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Campeonato</p>
            <p className="text-xs text-muted-foreground">
              Temporadas mensais com séries hierárquicas e mata-mata.
            </p>
          </div>
          {ehCampeonato && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
              <Check className="h-3 w-3" /> Selecionado
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onContinuar}>Continuar</Button>
      </div>
    </div>
  );
}