/**
 * radixPointerEventsFix — fix global pro bug de Radix UI travar o app
 * com pointer-events: none no body após fechar 2 overlays rápido.
 *
 * Bug aqui = app travado (clicks param de funcionar) sem o fix, OU
 * remoção incorreta da propriedade quando overlay legítimo ainda aberto.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

beforeEach(() => {
  vi.resetModules();
  // DOM limpo
  document.body.innerHTML = "";
  document.body.style.removeProperty("pointer-events");
});

afterEach(() => {
  vi.useRealTimers();
});

describe("installRadixPointerEventsFix — idempotency", () => {
  it("primeira chamada instala observer (sem throw)", async () => {
    const { installRadixPointerEventsFix } = await import("../radixPointerEventsFix");
    expect(() => installRadixPointerEventsFix()).not.toThrow();
  });

  it("segunda chamada NO-OP (não instala duas vezes)", async () => {
    const { installRadixPointerEventsFix } = await import("../radixPointerEventsFix");
    installRadixPointerEventsFix();
    // Verifica via setInterval count — se instalasse 2x teríamos 2 intervals.
    // Spy em setInterval pra contar.
    const spy = vi.spyOn(globalThis, "setInterval");
    installRadixPointerEventsFix();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("clearStuckPointerEvents (via interval safety net)", () => {
  it("remove pointer-events:none do body quando NÃO há overlay aberto", async () => {
    vi.useFakeTimers();
    const { installRadixPointerEventsFix } = await import("../radixPointerEventsFix");
    installRadixPointerEventsFix();

    document.body.style.pointerEvents = "none";
    expect(document.body.style.pointerEvents).toBe("none");

    vi.advanceTimersByTime(2000);
    expect(document.body.style.pointerEvents).toBe("");
  });

  it("MANTÉM pointer-events:none quando overlay Radix ainda está aberto", async () => {
    vi.useFakeTimers();
    const { installRadixPointerEventsFix } = await import("../radixPointerEventsFix");
    installRadixPointerEventsFix();

    // Simula um dialog Radix aberto
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("data-state", "open");
    document.body.appendChild(dialog);

    document.body.style.pointerEvents = "none";

    vi.advanceTimersByTime(2000);
    expect(document.body.style.pointerEvents).toBe("none");
  });

  it.each([
    "[role='alertdialog'][data-state='open']",
    "[data-state='open'][data-radix-popover-content]",
    "[data-state='open'][data-radix-dropdown-menu-content]",
  ])("MANTÉM com overlay %s aberto", async (selector) => {
    vi.useFakeTimers();
    const { installRadixPointerEventsFix } = await import("../radixPointerEventsFix");
    installRadixPointerEventsFix();

    // Constrói elemento batendo o selector
    const el = document.createElement("div");
    // Aplica todos atributos do seletor de forma rude (mas funciona pros nossos seletores)
    if (selector.includes("alertdialog")) el.setAttribute("role", "alertdialog");
    if (selector.includes("popover-content")) el.setAttribute("data-radix-popover-content", "");
    if (selector.includes("dropdown-menu-content")) el.setAttribute("data-radix-dropdown-menu-content", "");
    el.setAttribute("data-state", "open");
    document.body.appendChild(el);

    document.body.style.pointerEvents = "none";
    vi.advanceTimersByTime(2000);
    expect(document.body.style.pointerEvents).toBe("none");
  });

  it("NÃO remove outras propriedades inline (preserva style do body)", async () => {
    vi.useFakeTimers();
    const { installRadixPointerEventsFix } = await import("../radixPointerEventsFix");
    installRadixPointerEventsFix();

    document.body.style.cssText = "pointer-events: none; background: red";
    vi.advanceTimersByTime(2000);

    expect(document.body.style.pointerEvents).toBe("");
    expect(document.body.style.background).toContain("red");
  });

  it("NÃO age quando pointer-events está com valor diferente de 'none'", async () => {
    vi.useFakeTimers();
    const { installRadixPointerEventsFix } = await import("../radixPointerEventsFix");
    installRadixPointerEventsFix();

    document.body.style.pointerEvents = "auto";
    vi.advanceTimersByTime(2000);
    expect(document.body.style.pointerEvents).toBe("auto");
  });
});

describe("Sweep inicial no install", () => {
  it("body já travado no boot é desbloqueado imediatamente", async () => {
    // Setup: body trava ANTES do install
    document.body.style.pointerEvents = "none";
    const { installRadixPointerEventsFix } = await import("../radixPointerEventsFix");
    installRadixPointerEventsFix();

    // O sweep inicial é síncrono
    expect(document.body.style.pointerEvents).toBe("");
  });
});
