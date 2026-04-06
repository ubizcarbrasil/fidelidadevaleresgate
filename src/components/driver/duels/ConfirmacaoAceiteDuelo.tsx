/**
 * Modal de confirmação obrigatório antes de aceitar um duelo.
 * Exibe resumo visual do risco e exige confirmação explícita.
 */
import React from "react";
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
import { AlertTriangle, Coins, Calendar, User, Trophy } from "lucide-react";
import { formatPoints } from "@/lib/formatPoints";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  opponentName: string;
  startAt: string;
  endAt: string;
  pointsBet: number;
  isPending?: boolean;
}

export default function ConfirmacaoAceiteDuelo({
  open,
  onOpenChange,
  onConfirm,
  opponentName,
  startAt,
  endAt,
  pointsBet,
  isPending,
}: Props) {
  const totalDisputa = pointsBet * 2;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[360px] rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-base">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "hsl(var(--warning) / 0.15)" }}
            >
              <AlertTriangle className="h-4 w-4" style={{ color: "hsl(var(--warning))" }} />
            </div>
            Confirmar Aceite do Duelo
          </AlertDialogTitle>
          <AlertDialogDescription className="sr-only">
            Resumo e aviso de risco antes de aceitar o duelo
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-1">
          {/* Resumo visual */}
          <div
            className="rounded-xl p-3 space-y-2.5"
            style={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
          >
            <div className="flex items-center gap-2 text-sm">
              <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Adversário:</span>
              <span className="font-bold text-foreground">{opponentName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Período:</span>
              <span className="font-medium text-foreground">
                {format(new Date(startAt), "dd/MM HH:mm", { locale: ptBR })} — {format(new Date(endAt), "dd/MM HH:mm", { locale: ptBR })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Coins className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--warning))" }} />
              <span className="text-muted-foreground">Seus pontos comprometidos:</span>
              <span className="font-bold" style={{ color: "hsl(var(--warning))" }}>
                {formatPoints(pointsBet)} pts
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--primary))" }} />
              <span className="text-muted-foreground">Total em disputa:</span>
              <span className="font-extrabold" style={{ color: "hsl(var(--primary))" }}>
                {formatPoints(totalDisputa)} pts
              </span>
            </div>
            <div className="text-xs text-muted-foreground pt-1 border-t border-border/50">
              🏁 Regra: quem fizer mais corridas no período vence
            </div>
          </div>

          {/* Aviso de risco */}
          <div
            className="rounded-xl p-3 text-xs leading-relaxed"
            style={{
              backgroundColor: "hsl(var(--warning) / 0.1)",
              border: "1px solid hsl(var(--warning) / 0.3)",
              color: "hsl(var(--warning))",
            }}
          >
            <strong>⚠️ Atenção:</strong> Ao aceitar este duelo, seus pontos ficarão reservados até
            o encerramento da disputa. Se você vencer, receberá os pontos totais em jogo. Se perder,
            perderá os pontos reservados neste duelo. Deseja continuar?
          </div>
        </div>

        <AlertDialogFooter className="flex-row gap-2">
          <AlertDialogCancel className="flex-1 mt-0">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1"
          >
            {isPending ? "Confirmando…" : "Aceitar Duelo"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
