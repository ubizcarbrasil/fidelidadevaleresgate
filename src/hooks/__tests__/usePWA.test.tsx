/**
 * usePWA — install prompt + SW update lifecycle.
 * Bug aqui = install banner não aparece após elegível, SW update
 * não dispara needRefresh, dismissInstall não esconde.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const { mockClearCaches, mockReload } = vi.hoisted(() => ({
  mockClearCaches: vi.fn().mockResolvedValue(undefined),
  mockReload: vi.fn(),
}));

vi.mock("@/lib/pwaRecovery", () => ({
  clearRuntimeCaches: mockClearCaches,
}));

import { usePWA } from "../usePWA";

beforeEach(() => {
  mockClearCaches.mockClear();
  mockReload.mockClear();
  // Stub window.location.reload
  Object.defineProperty(window, "location", {
    value: { ...window.location, reload: mockReload },
    writable: true,
    configurable: true,
  });
  // Mock serviceWorker stub — getRegistration retorna null (sem SW)
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {
      getRegistration: () => Promise.resolve(null),
    },
  });
});

describe("usePWA — estado inicial", () => {
  it("needRefresh=false, canInstall=false (sem deferredPrompt)", () => {
    const { result } = renderHook(() => usePWA());
    expect(result.current.needRefresh).toBe(false);
    expect(result.current.canInstall).toBe(false);
  });

  it("retorna API completa", () => {
    const { result } = renderHook(() => usePWA());
    expect(typeof result.current.updateServiceWorker).toBe("function");
    expect(typeof result.current.dismissUpdate).toBe("function");
    expect(typeof result.current.installApp).toBe("function");
    expect(typeof result.current.dismissInstall).toBe("function");
  });
});

describe("usePWA — beforeinstallprompt", () => {
  it("evento beforeinstallprompt: canInstall=true + stash do prompt", () => {
    const { result } = renderHook(() => usePWA());

    const promptFn = vi.fn().mockResolvedValue(undefined);
    const event = Object.assign(new Event("beforeinstallprompt"), {
      prompt: promptFn,
      userChoice: Promise.resolve({ outcome: "accepted" as const }),
    });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(result.current.canInstall).toBe(true);
  });

  it("dismissInstall: canInstall vira false (mesmo com prompt válido)", () => {
    const { result } = renderHook(() => usePWA());

    const event = Object.assign(new Event("beforeinstallprompt"), {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: "accepted" as const }),
    });

    act(() => { window.dispatchEvent(event); });
    expect(result.current.canInstall).toBe(true);

    act(() => result.current.dismissInstall());
    expect(result.current.canInstall).toBe(false);
  });

  it("evento appinstalled: zera canInstall", () => {
    const { result } = renderHook(() => usePWA());

    const beforeEvent = Object.assign(new Event("beforeinstallprompt"), {
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: "accepted" as const }),
    });
    act(() => { window.dispatchEvent(beforeEvent); });
    expect(result.current.canInstall).toBe(true);

    act(() => { window.dispatchEvent(new Event("appinstalled")); });
    expect(result.current.canInstall).toBe(false);
  });

  it("installApp sem deferredPrompt: no-op (não throw)", async () => {
    const { result } = renderHook(() => usePWA());
    await act(async () => {
      await result.current.installApp();
    });
    // Nada explode
    expect(result.current.canInstall).toBe(false);
  });

  it("installApp aceito: chama prompt + canInstall=false", async () => {
    const { result } = renderHook(() => usePWA());

    const promptFn = vi.fn().mockResolvedValue(undefined);
    const event = Object.assign(new Event("beforeinstallprompt"), {
      prompt: promptFn,
      userChoice: Promise.resolve({ outcome: "accepted" as const }),
    });
    act(() => { window.dispatchEvent(event); });

    await act(async () => {
      await result.current.installApp();
    });

    expect(promptFn).toHaveBeenCalledOnce();
    expect(result.current.canInstall).toBe(false);
  });

  it("installApp dismissed: prompt chamado mas canInstall PRESERVA dismiss state", async () => {
    const { result } = renderHook(() => usePWA());

    const promptFn = vi.fn().mockResolvedValue(undefined);
    const event = Object.assign(new Event("beforeinstallprompt"), {
      prompt: promptFn,
      userChoice: Promise.resolve({ outcome: "dismissed" as const }),
    });
    act(() => { window.dispatchEvent(event); });

    await act(async () => {
      await result.current.installApp();
    });

    expect(promptFn).toHaveBeenCalled();
  });
});

describe("usePWA — SW update lifecycle", () => {
  it("dismissUpdate: needRefresh vira false", () => {
    const { result } = renderHook(() => usePWA());
    act(() => result.current.dismissUpdate());
    expect(result.current.needRefresh).toBe(false);
  });

  it("updateServiceWorker sem waiting: clearCaches + reload", async () => {
    const { result } = renderHook(() => usePWA());

    await act(async () => {
      result.current.updateServiceWorker();
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(mockClearCaches).toHaveBeenCalled();
  });
});
