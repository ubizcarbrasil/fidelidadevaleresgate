/**
 * Popup/overlay fluorescente que aparece quando o motorista recebe um novo desafio.
 * Full-screen com animações neon para garantir visibilidade máxima.
 */
import React, { useEffect } from "react";
import { Swords, Coins, Calendar, ChevronRight } from "lucide-react";
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

const NEON_GREEN = "#39FF14";
const NEON_GOLD = "#FFD700";

const keyframesCSS = `
@keyframes neonPulse {
  0%, 100% { box-shadow: 0 0 15px ${NEON_GREEN}66, 0 0 30px ${NEON_GREEN}33, inset 0 0 15px ${NEON_GREEN}1a; }
  50% { box-shadow: 0 0 25px ${NEON_GREEN}aa, 0 0 50px ${NEON_GREEN}55, inset 0 0 25px ${NEON_GREEN}33; }
}
@keyframes neonBorderPulse {
  0%, 100% { border-color: ${NEON_GREEN}88; }
  50% { border-color: ${NEON_GREEN}ff; }
}
@keyframes iconGlow {
  0%, 100% { filter: drop-shadow(0 0 6px ${NEON_GREEN}66); transform: scale(1); }
  50% { filter: drop-shadow(0 0 14px ${NEON_GREEN}cc); transform: scale(1.1); }
}
@keyframes cardEntry {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
@keyframes overlayEntry {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes textGlow {
  0%, 100% { text-shadow: 0 0 8px ${NEON_GREEN}66, 0 0 16px ${NEON_GREEN}33; }
  50% { text-shadow: 0 0 14px ${NEON_GREEN}aa, 0 0 28px ${NEON_GREEN}55; }
}
`;

export default function PopupDesafioRecebido({ desafio, onFechar, onVerDesafio }: Props) {
  // Vibrar ao receber desafio
  useEffect(() => {
    if (desafio) {
      navigator.vibrate?.([200, 100, 200, 100, 200]);
    }
  }, [desafio]);

  if (!desafio) return null;

  const formatarData = (iso: string) => {
    try {
      return format(new Date(iso), "dd/MM", { locale: ptBR });
    } catch {
      return "—";
    }
  };

  return (
    <>
      <style>{keyframesCSS}</style>

      {/* Overlay full-screen */}
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center"
        style={{
          animation: "overlayEntry 0.3s ease-out forwards",
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(6px)",
        }}
        onClick={onFechar}
      >
        {/* Card central */}
        <div
          className="absolute left-1/2 top-1/2 w-[90vw] max-w-[360px] rounded-2xl p-0 overflow-hidden"
          style={{
            animation: "cardEntry 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, neonPulse 2s ease-in-out infinite",
            border: `2px solid ${NEON_GREEN}88`,
            animationName: "cardEntry, neonPulse, neonBorderPulse",
            animationDuration: "0.4s, 2s, 2s",
            animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1), ease-in-out, ease-in-out",
            animationIterationCount: "1, infinite, infinite",
            animationFillMode: "forwards, none, none",
            background: "linear-gradient(180deg, hsl(142 70% 10% / 0.95) 0%, hsl(0 0% 8% / 0.98) 40%)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header fluorescente */}
          <div className="relative flex flex-col items-center pt-8 pb-5 px-6">
            {/* Ícone animado */}
            <div
              className="h-20 w-20 rounded-full flex items-center justify-center mb-4"
              style={{
                background: `radial-gradient(circle, ${NEON_GREEN}22 0%, transparent 70%)`,
                border: `2px solid ${NEON_GREEN}55`,
              }}
            >
              <Swords
                className="h-10 w-10"
                style={{
                  color: NEON_GREEN,
                  animation: "iconGlow 1.5s ease-in-out infinite",
                }}
              />
            </div>

            {/* Título fluorescente */}
            <h2
              className="text-2xl font-black tracking-wide text-center"
              style={{
                color: NEON_GREEN,
                animation: "textGlow 2s ease-in-out infinite",
                letterSpacing: "0.05em",
              }}
            >
              VOCÊ FOI DESAFIADO!
            </h2>
            <p className="text-sm text-muted-foreground text-center mt-2 opacity-80">
              Um motorista quer competir com você
            </p>
          </div>

          {/* Info do desafiante */}
          <div className="px-6 pb-6 space-y-4">
            <div
              className="rounded-xl p-4 space-y-3"
              style={{
                background: `linear-gradient(135deg, ${NEON_GREEN}0d, transparent)`,
                border: `1px solid ${NEON_GREEN}22`,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-foreground">
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
                <div className="flex items-center gap-2 text-sm font-bold" style={{ color: NEON_GOLD }}>
                  <Coins className="h-4 w-4" />
                  <span>Aposta: {formatPoints(desafio.pointsBet)} pts</span>
                </div>
              )}
            </div>

            {/* Botões */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => { onFechar(); onVerDesafio(); }}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-transform active:scale-[0.97]"
                style={{
                  background: `linear-gradient(135deg, ${NEON_GREEN}, hsl(142 70% 35%))`,
                  color: "#000",
                  boxShadow: `0 0 20px ${NEON_GREEN}55`,
                }}
              >
                <Swords className="h-5 w-5" />
                VER DESAFIO
                <ChevronRight className="h-4 w-4" />
              </button>
              <Button
                variant="ghost"
                onClick={onFechar}
                className="w-full text-muted-foreground opacity-60 hover:opacity-100"
                size="sm"
              >
                Mais tarde
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
