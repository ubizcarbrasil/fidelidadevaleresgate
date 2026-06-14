/**
 * useIsMobile — detecta viewport mobile (< 768px) via matchMedia + resize.
 * Bug aqui = SSR crash (sem window), breakpoint inconsistente entre SSR e
 * client (hydration mismatch), listener vaza após unmount.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "../use-mobile";

let mqlListener: (() => void) | null = null;
let mqlAddSpy: ReturnType<typeof vi.fn>;
let mqlRemoveSpy: ReturnType<typeof vi.fn>;

function setWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
}

beforeEach(() => {
  mqlListener = null;
  mqlAddSpy = vi.fn((_event: string, cb: () => void) => { mqlListener = cb; });
  mqlRemoveSpy = vi.fn();
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn(() => ({
      matches: window.innerWidth < 768,
      addEventListener: mqlAddSpy,
      removeEventListener: mqlRemoveSpy,
    })),
  });
});

describe("useIsMobile", () => {
  it("viewport 320px (mobile): true", () => {
    setWidth(320);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("viewport 1280px (desktop): false", () => {
    setWidth(1280);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("viewport 767px (just under breakpoint): true", () => {
    setWidth(767);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("viewport 768px (exato breakpoint): false (estrito <)", () => {
    setWidth(768);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("resize: state atualiza ao disparar change", () => {
    setWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    setWidth(400);
    act(() => { mqlListener?.(); });
    expect(result.current).toBe(true);
  });

  it("unmount: remove listener (sem vazamento)", () => {
    setWidth(800);
    const { unmount } = renderHook(() => useIsMobile());
    expect(mqlAddSpy).toHaveBeenCalledTimes(1);
    unmount();
    expect(mqlRemoveSpy).toHaveBeenCalledTimes(1);
  });
});
