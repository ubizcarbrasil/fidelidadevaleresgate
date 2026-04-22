import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PassoTour {
  alvo: string; // seletor data-tour
  titulo: string;
  descricao: string;
  posicao?: "top" | "bottom" | "left" | "right" | "auto";
}

const PASSOS: PassoTour[] = [
  {
    alvo: "[data-tour='coluna-disponiveis']",
    titulo: "1. Coluna Disponíveis",
    descricao:
      "Aqui ficam todos os motoristas que ainda não foram distribuídos. Use a busca para encontrar alguém específico.",
    posicao: "right",
  },
  {
    alvo: "[data-tour='coluna-disponiveis'] input",
    titulo: "2. Selecione motoristas",
    descricao:
      "Toque no checkbox de cada motorista que você quer mover. Você pode marcar vários ao mesmo tempo.",
    posicao: "right",
  },
  {
    alvo: "[data-tour='barra-acoes-lote']",
    titulo: "3. Escolha a série de destino",
    descricao:
      "Quando houver motoristas selecionados, esta barra aparece. Abra o seletor e escolha Série A, B, C, D ou E.",
    posicao: "bottom",
  },
  {
    alvo: "[data-tour='colunas-series']",
    titulo: "4. Veja o resultado nas séries",
    descricao:
      "Os motoristas movidos aparecem imediatamente na coluna da série escolhida. Repita o processo até distribuir todos.",
    posicao: "top",
  },
  {
    alvo: "[data-tour='colunas-series']",
    titulo: "5. Ajustes finos",
    descricao:
      "Em cada cartão dentro de uma série, use 'Mover para…' para trocar de série, ou 'Remover' para devolver à coluna Disponíveis.",
    posicao: "top",
  },
];

interface Props {
  ativo: boolean;
  aoEncerrar: () => void;
}

const PADDING_HALO = 6;

export default function TourGuiadoDistribuicao({ ativo, aoEncerrar }: Props) {
  const [passoIndex, setPassoIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [tick, setTick] = useState(0);

  const passo = PASSOS[passoIndex];

  // Recalcula a posição do alvo a cada passo, scroll, resize
  useLayoutEffect(() => {
    if (!ativo || !passo) return;
    function atualizar() {
      const el = document.querySelector(passo.alvo) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return;
      }
      el.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
      // pequeno delay para o scroll suave
      requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        setRect(r);
      });
    }
    atualizar();
    window.addEventListener("resize", atualizar);
    window.addEventListener("scroll", atualizar, true);
    const id = window.setInterval(atualizar, 500);
    return () => {
      window.removeEventListener("resize", atualizar);
      window.removeEventListener("scroll", atualizar, true);
      window.clearInterval(id);
    };
  }, [ativo, passoIndex, passo, tick]);

  // Reset ao reativar
  useEffect(() => {
    if (ativo) {
      setPassoIndex(0);
      setTick((t) => t + 1);
    }
  }, [ativo]);

  if (!ativo || !passo) return null;

  const total = PASSOS.length;
  const isPrimeiro = passoIndex === 0;
  const isUltimo = passoIndex === total - 1;

  function avancar() {
    if (isUltimo) {
      aoEncerrar();
    } else {
      setPassoIndex((i) => i + 1);
    }
  }

  function voltar() {
    if (!isPrimeiro) setPassoIndex((i) => i - 1);
  }

  // Posicionamento do tooltip
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const TOOLTIP_W = Math.min(320, viewportW - 24);
  const TOOLTIP_H_EST = 200;

  let top = viewportH / 2 - TOOLTIP_H_EST / 2;
  let left = viewportW / 2 - TOOLTIP_W / 2;

  if (rect) {
    const posicao = passo.posicao ?? "auto";
    const espacoBaixo = viewportH - rect.bottom;
    const espacoCima = rect.top;
    const preferirBaixo =
      posicao === "bottom" ||
      (posicao === "auto" && espacoBaixo >= TOOLTIP_H_EST);

    if (preferirBaixo && espacoBaixo >= 120) {
      top = rect.bottom + 12;
    } else if (espacoCima >= 120) {
      top = rect.top - TOOLTIP_H_EST - 12;
    } else {
      top = Math.max(12, viewportH - TOOLTIP_H_EST - 12);
    }
    left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
    left = Math.max(12, Math.min(left, viewportW - TOOLTIP_W - 12));
    top = Math.max(12, Math.min(top, viewportH - TOOLTIP_H_EST - 12));
  }

  // Halo / spotlight via box-shadow gigante (escurece o resto)
  const halo = rect
    ? {
        top: rect.top - PADDING_HALO,
        left: rect.left - PADDING_HALO,
        width: rect.width + PADDING_HALO * 2,
        height: rect.height + PADDING_HALO * 2,
      }
    : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-label="Tour guiado: distribuir motoristas"
    >
      {/* Camada escura clicável (encerra ao tocar fora) */}
      <div
        className="absolute inset-0 pointer-events-auto"
        onClick={aoEncerrar}
        style={{
          background: halo ? "transparent" : "hsl(0 0% 0% / 0.55)",
        }}
      />

      {/* Spotlight: caixa transparente com sombra enorme = escurece o entorno */}
      {halo && (
        <div
          className="absolute rounded-lg pointer-events-none transition-all duration-200"
          style={{
            top: halo.top,
            left: halo.left,
            width: halo.width,
            height: halo.height,
            boxShadow:
              "0 0 0 9999px hsl(0 0% 0% / 0.65), 0 0 0 3px hsl(var(--primary)), 0 0 0 6px hsl(var(--primary) / 0.35)",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute pointer-events-auto rounded-lg border border-primary/40 bg-card shadow-2xl"
        style={{
          top,
          left,
          width: TOOLTIP_W,
        }}
      >
        <div className="flex items-start gap-2 p-3">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
            style={{ backgroundColor: "hsl(var(--primary) / 0.15)" }}
          >
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-foreground">
                {passo.titulo}
              </p>
              <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                {passoIndex + 1}/{total}
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {passo.descricao}
            </p>
          </div>
          <button
            type="button"
            onClick={aoEncerrar}
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Encerrar tour"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Barra de progresso */}
        <div className="px-3">
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${((passoIndex + 1) / total) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 p-3">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[11px]"
            onClick={voltar}
            disabled={isPrimeiro}
          >
            <ArrowLeft className="mr-1 h-3 w-3" /> Anterior
          </Button>
          <Button
            size="sm"
            className="h-7 text-[11px]"
            onClick={avancar}
          >
            {isUltimo ? "Concluir" : "Próximo"}
            {!isUltimo && <ArrowRight className="ml-1 h-3 w-3" />}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}