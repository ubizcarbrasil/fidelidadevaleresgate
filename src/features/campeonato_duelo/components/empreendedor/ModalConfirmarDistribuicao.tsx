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
import { useConfirmarDistribuicao } from "../../hooks/hook_mutations_campeonato";

interface Props {
  open: boolean;
  onClose: () => void;
  brandId: string;
  seasonId: string;
  totalDrivers: number;
  totalPoints: number;
}

export default function ModalConfirmarDistribuicao({
  open,
  onClose,
  brandId,
  seasonId,
  totalDrivers,
  totalPoints,
}: Props) {
  const { mutate, isPending } = useConfirmarDistribuicao(brandId);

  const handleConfirm = () => {
    mutate(seasonId, { onSuccess: () => onClose() });
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar distribuição de prêmios</AlertDialogTitle>
          <AlertDialogDescription>
            Você está prestes a creditar{" "}
            <strong>{totalPoints.toLocaleString("pt-BR")} pontos</strong> para{" "}
            <strong>{totalDrivers} motoristas</strong>. Esta ação não pode ser
            desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Distribuindo..." : "Confirmar e creditar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}