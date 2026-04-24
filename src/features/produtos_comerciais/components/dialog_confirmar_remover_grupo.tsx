import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grupoLabel: string;
  totalItens: number;
  onConfirmar: () => void;
}

export default function DialogConfirmarRemoverGrupo({
  open, onOpenChange, grupoLabel, totalItens, onConfirmar,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover grupo &quot;{grupoLabel}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            Isso vai desativar {totalItens} {totalItens === 1 ? "módulo" : "módulos"}{" "}
            do produto. Você pode reativar individualmente no passo de
            Funcionalidades, ou usar &quot;Restaurar ordem padrão&quot; para
            voltar ao layout original.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmar}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Remover {totalItens} {totalItens === 1 ? "item" : "itens"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}