/**
 * Card premium exibindo o campeão do cinturão da cidade.
 */
import React from "react";
import { Crown, Star, Trophy } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CampeaoCinturao } from "./hook_cinturao_cidade";

interface Props {
  campeao: CampeaoCinturao;
}

export default function CardCampeao({ campeao }: Props) {
  const nome = campeao.champion_nickname || campeao.champion_name?.replace("[MOTORISTA]", "").trim() || "Campeão";
  const dataConquista = campeao.achieved_at
    ? format(new Date(campeao.achieved_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : "—";
  const tipoLabel = campeao.record_type === "all_time" ? "Recorde Histórico" : "Recorde do Mês";

  return (
    <div
      className="relative rounded-2xl p-[2px] overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(45 100% 50%), hsl(35 100% 45%), hsl(45 100% 60%))",
      }}
    >
      <div
        className="rounded-2xl p-5 flex flex-col items-center gap-4 relative overflow-hidden"
        style={{ backgroundColor: "hsl(var(--card))" }}
      >
        {/* Glow decorativo */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, hsl(45 100% 50%), transparent)" }}
        />

        {/* Coroa */}
        <div className="relative z-10">
          <Crown className="h-8 w-8" style={{ color: "hsl(45, 100%, 50%)" }} />
        </div>

        {/* Avatar */}
        <div
          className="relative z-10 h-20 w-20 rounded-full flex items-center justify-center text-2xl font-black border-4"
          style={{
            borderColor: "hsl(45, 100%, 50%)",
            backgroundColor: "hsl(var(--muted))",
            color: "hsl(var(--foreground))",
            boxShadow: "0 0 24px hsl(45 100% 50% / 0.3)",
          }}
        >
          {campeao.champion_avatar_url ? (
            <img
              src={campeao.champion_avatar_url}
              alt={nome}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            nome.charAt(0).toUpperCase()
          )}
        </div>

        {/* Nome */}
        <div className="text-center relative z-10">
          <p className="text-lg font-black text-foreground">{nome}</p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Star className="h-3.5 w-3.5" style={{ color: "hsl(45, 100%, 50%)" }} fill="hsl(45, 100%, 50%)" />
            <span className="text-xs font-bold" style={{ color: "hsl(45, 100%, 50%)" }}>
              Detentor do Cinturão
            </span>
            <Star className="h-3.5 w-3.5" style={{ color: "hsl(45, 100%, 50%)" }} fill="hsl(45, 100%, 50%)" />
          </div>
        </div>

        {/* Recorde */}
        <div
          className="relative z-10 rounded-xl px-6 py-3 text-center w-full"
          style={{
            background: "linear-gradient(135deg, hsl(45 100% 50% / 0.12), hsl(35 100% 45% / 0.08))",
            border: "1px solid hsl(45 100% 50% / 0.25)",
          }}
        >
          <p className="text-3xl font-black" style={{ color: "hsl(45, 100%, 50%)" }}>
            {campeao.record_value}
          </p>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">corridas • {tipoLabel}</p>
        </div>

        {/* Data */}
        <div className="flex items-center gap-2 relative z-10">
          <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground">Conquistado em {dataConquista}</p>
        </div>
      </div>
    </div>
  );
}
