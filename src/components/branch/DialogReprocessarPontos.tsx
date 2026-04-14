import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  branchId: string;
  branchName: string;
}

export default function DialogReprocessarPontos({ open, onClose, branchId, branchName }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ processed: number; skipped: number } | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.rpc("reprocess_missing_driver_points", {
        p_branch_id: branchId,
      });

      if (error) throw error;

      const res = data as any;
      if (!res?.success) {
        toast.error(res?.error || "Erro ao reprocessar pontos");
        return;
      }

      setResult({ processed: res.processed, skipped: res.skipped });
      toast.success(`${res.processed} corrida(s) reprocessada(s)`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao reprocessar pontos");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reprocessar Pontos de Motoristas</AlertDialogTitle>
          <AlertDialogDescription>
            {result ? (
              <span className="space-y-1 block">
                <span className="block font-medium text-foreground">
                  Resultado para {branchName}:
                </span>
                <span className="block">✅ {result.processed} corrida(s) reprocessada(s)</span>
                <span className="block">⏭️ {result.skipped} corrida(s) ignorada(s)</span>
              </span>
            ) : (
              <>
                Isso vai identificar corridas finalizadas em <strong>{branchName}</strong> onde o
                motorista não recebeu pontos e creditá-los automaticamente com base na regra ativa.
                Deseja continuar?
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {result ? (
            <AlertDialogAction onClick={handleClose}>Fechar</AlertDialogAction>
          ) : (
            <>
              <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirm} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Reprocessar
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
