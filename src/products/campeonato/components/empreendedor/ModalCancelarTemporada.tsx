import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle } from "lucide-react";
import { useCancelarTemporada } from "../../hooks/hook_mutations_campeonato";

interface Props {
  open: boolean;
  onClose: () => void;
  seasonId: string;
  brandId?: string;
  seasonName: string;
}

export default function ModalCancelarTemporada({
  open,
  onClose,
  seasonId,
  brandId,
  seasonName,
}: Props) {
  const [motivo, setMotivo] = useState("");
  const { mutate, isPending } = useCancelarTemporada(brandId);

  function aoConfirmar() {
    if (motivo.trim().length < 5) return;
    mutate(
      { seasonId, reason: motivo.trim() },
      {
        onSuccess: () => {
          setMotivo("");
          onClose();
        },
      },
    );
  }

  const motivoValido = motivo.trim().length >= 5;

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancelar temporada?
          </AlertDialogTitle>
          <AlertDialogDescription>
            A temporada <strong>{seasonName}</strong> será marcada como cancelada.
            Histórico, classificação e brackets serão preservados, mas{" "}
            <strong>nenhuma promoção, rebaixamento ou prêmio será aplicado</strong>.
            Essa ação é irreversível.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="motivo-cancel">
            Motivo do cancelamento <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="motivo-cancel"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Mínimo 5 caracteres. Ex: Pausa operacional por sistema."
            rows={3}
            className="resize-none"
          />
          {motivo.length > 0 && !motivoValido && (
            <p className="text-xs text-destructive">Mínimo 5 caracteres.</p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Voltar</AlertDialogCancel>
          <AlertDialogAction
            onClick={aoConfirmar}
            disabled={isPending || !motivoValido}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Cancelar temporada
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
