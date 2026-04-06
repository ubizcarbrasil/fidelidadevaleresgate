/**
 * Card de desafio recebido — permite aceitar ou "arregar".
 */
import React from "react";
import { Swords, ShieldCheck, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Duel } from "./hook_duelos";
import { cleanDriverName, useRespondDuel } from "./hook_duelos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  duel: Duel;
}

export default function DuelChallengeCard({ duel }: Props) {
  const { mutate: respond, isPending } = useRespondDuel();
  const challengerName = cleanDriverName((duel.challenger as any)?.customers?.name);

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{
        backgroundColor: "hsl(var(--card))",
        border: "1px solid hsl(var(--warning) / 0.4)",
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "hsl(var(--warning) / 0.15)" }}
        >
          <Swords className="h-4 w-4" style={{ color: "hsl(var(--warning))" }} />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Desafio de {challengerName}</p>
          <p className="text-[11px] text-muted-foreground">
            {format(new Date(duel.start_at), "dd/MM HH:mm", { locale: ptBR })} — {format(new Date(duel.end_at), "dd/MM HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Quem fizer mais corridas no período vence! Topa o desafio? 🥊
      </p>

      <div className="flex gap-2">
        <Button
          onClick={() => respond({ duelId: duel.id, accept: true })}
          disabled={isPending}
          className="flex-1 gap-1.5"
          size="sm"
        >
          <ShieldCheck className="h-4 w-4" />
          Aceitar
        </Button>
        <Button
          onClick={() => respond({ duelId: duel.id, accept: false })}
          disabled={isPending}
          variant="outline"
          className="flex-1 gap-1.5"
          size="sm"
        >
          <Flag className="h-4 w-4" />
          Arregar 😅
        </Button>
      </div>
    </div>
  );
}
