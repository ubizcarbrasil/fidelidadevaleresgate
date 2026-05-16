import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useAjustarPremio } from "../../hooks/hook_mutations_campeonato";
import {
  POSICOES_PREMIAVEIS,
  ROTULOS_POSICAO_PREMIO,
} from "../../constants/constantes_templates";
import type { PosicaoPremio } from "../../types/tipos_empreendedor";

interface Props {
  open: boolean;
  onClose: () => void;
  brandId: string;
  tiers: string[];
}

export default function ModalAjustarPremio({
  open,
  onClose,
  brandId,
  tiers,
}: Props) {
  const [tier, setTier] = useState<string>("");
  const [position, setPosition] = useState<PosicaoPremio>("champion");
  const [points, setPoints] = useState<number>(0);
  const { mutate, isPending } = useAjustarPremio();

  useEffect(() => {
    if (open && tiers.length > 0 && !tier) setTier(tiers[0]);
  }, [open, tiers, tier]);

  function aoSalvar() {
    if (!tier || points < 0) return;
    mutate(
      { brandId, tierName: tier, position, newPoints: points },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustar prêmio</DialogTitle>
          <DialogDescription>
            Atualiza o valor de pontos pago para a posição informada. Aplica-se
            a todas as temporadas futuras desta marca.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Série</Label>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha a série" />
              </SelectTrigger>
              <SelectContent>
                {tiers.map((t) => (
                  <SelectItem key={t} value={t}>
                    Série {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Posição</Label>
            <Select
              value={position}
              onValueChange={(v) => setPosition(v as PosicaoPremio)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POSICOES_PREMIAVEIS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {ROTULOS_POSICAO_PREMIO[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Novo valor (pontos)</Label>
            <Input
              type="number"
              min={0}
              max={100000}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={aoSalvar} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Salvar prêmio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
