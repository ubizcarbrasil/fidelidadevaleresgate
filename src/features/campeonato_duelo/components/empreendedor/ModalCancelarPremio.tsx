import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCancelarPremio } from "../../hooks/hook_mutations_campeonato";
import type { DistribuicaoPremio } from "../../types/tipos_empreendedor";

interface Props {
  distribuicao: DistribuicaoPremio | null;
  onClose: () => void;
  brandId: string;
}

export default function ModalCancelarPremio({
  distribuicao,
  onClose,
  brandId,
}: Props) {
  const [reason, setReason] = useState("");
  const { mutate, isPending } = useCancelarPremio(brandId);

  if (!distribuicao) return null;

  const podeEnviar = reason.trim().length >= 5;

  const submit = () => {
    mutate(
      { distributionId: distribuicao.id, reason: reason.trim() },
      {
        onSuccess: () => {
          setReason("");
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open={!!distribuicao} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar prêmio</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            <strong>{distribuicao.driver_name ?? "Motorista"}</strong> —{" "}
            {distribuicao.tier_name} ({distribuicao.points_awarded} pts)
          </p>
          <div className="space-y-1">
            <Label htmlFor="cancel-reason">Motivo (mínimo 5 caracteres)</Label>
            <Textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Descreva o motivo do cancelamento"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Voltar
          </Button>
          <Button
            variant="destructive"
            onClick={submit}
            disabled={!podeEnviar || isPending}
          >
            {isPending ? "Cancelando..." : "Cancelar prêmio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}