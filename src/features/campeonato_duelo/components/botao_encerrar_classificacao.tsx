import { useState } from "react";
import { Loader2, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useGerarChaveamento } from "../hooks/hook_campeonato";

interface Props {
  seasonId: string;
  branchId: string;
}

export default function BotaoEncerrarClassificacao({ seasonId, branchId }: Props) {
  const [aberto, setAberto] = useState(false);
  const { mutate, isPending } = useGerarChaveamento();

  const confirmar = () => {
    mutate(
      { seasonId, branchId },
      { onSuccess: () => setAberto(false) },
    );
  };

  return (
    <>
      <Button
        size="sm"
        onClick={() => setAberto(true)}
        disabled={isPending}
        className="gap-1.5"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Swords className="h-3.5 w-3.5" />
        )}
        Encerrar classificação
      </Button>

      <AlertDialog open={aberto} onOpenChange={setAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar classificação e gerar mata-mata?</AlertDialogTitle>
            <AlertDialogDescription>
              Os 16 melhores motoristas serão classificados pelo critério: pontos,
              avaliações 5 estrelas e horário da última corrida. O chaveamento das
              oitavas será gerado automaticamente com seed clássico (1×16, 2×15, 3×14, ...).
              <br /><br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmar} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...
                </>
              ) : (
                "Confirmar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
