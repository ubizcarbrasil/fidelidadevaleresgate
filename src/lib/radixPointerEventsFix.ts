/**
 * Fix global para um bug conhecido do Radix UI (Dialog, Popover, AlertDialog,
 * DropdownMenu) onde, ao fechar dois overlays em sequência rápida, o
 * `pointer-events: none` aplicado ao <body> não é removido — travando todo o
 * app (cliques deixam de funcionar; tela parece "congelada").
 *
 * Estratégia: observar mudanças no atributo `style` do <body>. Se detectarmos
 * `pointer-events: none` mas NÃO houver mais nenhum overlay Radix aberto no
 * DOM, removemos a propriedade.
 *
 * Idempotente: pode ser chamado múltiplas vezes; só instala uma vez.
 */
let installed = false;

const RADIX_OPEN_SELECTORS = [
  "[data-radix-popper-content-wrapper]",
  "[role='dialog'][data-state='open']",
  "[role='alertdialog'][data-state='open']",
  "[data-state='open'][data-radix-dialog-content]",
  "[data-state='open'][data-radix-popover-content]",
  "[data-state='open'][data-radix-dropdown-menu-content]",
].join(",");

function hasOpenRadixOverlay(): boolean {
  try {
    return document.querySelector(RADIX_OPEN_SELECTORS) !== null;
  } catch {
    return false;
  }
}

function clearStuckPointerEvents() {
  const body = document.body;
  if (!body) return;
  const pe = body.style.pointerEvents;
  if (pe === "none" && !hasOpenRadixOverlay()) {
    body.style.removeProperty("pointer-events");
  }
}

export function installRadixPointerEventsFix() {
  if (installed || typeof document === "undefined") return;
  installed = true;

  // Observa mudanças no atributo style do <body>
  const observer = new MutationObserver(() => {
    // Defer p/ dar tempo do Radix terminar a transição/cleanup antes de checar.
    requestAnimationFrame(clearStuckPointerEvents);
  });

  const start = () => {
    if (!document.body) return;
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
    });
    // Sweep inicial — caso já esteja travado no boot.
    clearStuckPointerEvents();
  };

  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start, { once: true });

  // Safety net: a cada 2s, garante que não ficou travado.
  setInterval(clearStuckPointerEvents, 2000);
}