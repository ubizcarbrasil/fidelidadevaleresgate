/**
 * Popup/dialog que aparece quando o motorista recebe um novo desafio.
 */
import React from "react";
import { Swords, Coins, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatPoints } from "@/lib/formatPoints";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DesafioRecebido } from "./hook_escuta_desafios_recebidos";

interface Props {
  desafio: DesafioRecebido | null;
  onFechar: () => void;
  onVerDesafio: () => void;
}

export default function PopupDesafioRecebido({ desafio, onFechar, onVerDesafio }: Props) {
  if (!desafio) return null;

  const formatarData = (iso: string) => {
    try {
      return format(new Date(iso), "dd/MM", { locale: ptBR });
    } catch {
      return "—";
    }
  };

  return (
    <Dialog open={!!desafio} onOpenChange={(open) => { if (!open) onFechar(); }}>
      <DialogContent className="max-w-[360px] rounded-2xl border-primary/20 bg-gradient-to-b from-card to-background p-0 overflow-hidden">
        {/* Header visual */}
        <div className="relative flex flex-col items-center pt-6 pb-4 px-6 bg-gradient-to-b from-primary/10 to-transparent">
          <div className="h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center mb-3">
            <Swords className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-lg font-bold text-center text-foreground">
            Novo Desafio!
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Você foi desafiado para um duelo
          </p>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 space-y-4">
          {/* Challenger info */}
          <div className="bg-muted/50 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                ⚔️ {desafio.challengerName || "Adversário"}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {formatarData(desafio.startAt)} → {formatarData(desafio.endAt)}
              </span>
            </div>

            {desafio.pointsBet > 0 && (
              <div className="flex items-center gap-2 text-xs font-medium text-amber-500">
                <Coins className="h-3.5 w-3.5" />
                <span>Aposta: {formatPoints(desafio.pointsBet)} pts</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => { onFechar(); onVerDesafio(); }}
              className="w-full gap-2"
              size="sm"
            >
              <Swords className="h-4 w-4" />
              Ver Desafio
            </Button>
            <Button
              variant="ghost"
              onClick={onFechar}
              className="w-full text-muted-foreground"
              size="sm"
            >
              Mais tarde
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
