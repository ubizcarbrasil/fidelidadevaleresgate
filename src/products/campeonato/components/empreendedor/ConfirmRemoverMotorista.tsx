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

interface Props {
  open: boolean;
  driverName: string | null;
  onCancel: () => void;
  onConfirm: () => void;
  pendente?: boolean;
}

export default function ConfirmRemoverMotorista({
  open,
  driverName,
  onCancel,
  onConfirm,
  pendente,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover motorista da temporada?</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{driverName ?? "Este motorista"}</strong> será retirado da
            temporada e os pontos acumulados na classificação serão perdidos.
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pendente}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={pendente}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}