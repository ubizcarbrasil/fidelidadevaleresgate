/**
 * haptics — feedback tátil via navigator.vibrate.
 * Bug aqui = vibrate crasha em desktop sem suporte (sem ?), pattern de
 * sucesso virá errado se mexer no array (UX confusa).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { haptics, haptic } from "../haptics";

let vibrateMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vibrateMock = vi.fn();
  Object.defineProperty(navigator, "vibrate", {
    configurable: true,
    writable: true,
    value: vibrateMock,
  });
});

describe("haptics", () => {
  it("light: 50ms", () => {
    haptics.light();
    expect(vibrateMock).toHaveBeenCalledWith(50);
  });

  it("medium: 100ms", () => {
    haptics.medium();
    expect(vibrateMock).toHaveBeenCalledWith(100);
  });

  it("heavy: pattern [100, 50, 100]", () => {
    haptics.heavy();
    expect(vibrateMock).toHaveBeenCalledWith([100, 50, 100]);
  });

  it("success: pattern crescente [50, 30, 80, 30, 120]", () => {
    haptics.success();
    expect(vibrateMock).toHaveBeenCalledWith([50, 30, 80, 30, 120]);
  });

  it("error: pattern [200, 100, 200]", () => {
    haptics.error();
    expect(vibrateMock).toHaveBeenCalledWith([200, 100, 200]);
  });

  it("sem navigator.vibrate (desktop): NÃO crasha", () => {
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      writable: true,
      value: undefined,
    });
    expect(() => haptics.light()).not.toThrow();
    expect(() => haptics.success()).not.toThrow();
  });
});

describe("haptic (legacy shortcut)", () => {
  it("light (default)", () => {
    haptic();
    expect(vibrateMock).toHaveBeenCalledWith(50);
  });

  it("medium", () => {
    haptic("medium");
    expect(vibrateMock).toHaveBeenCalledWith(100);
  });

  it("heavy", () => {
    haptic("heavy");
    expect(vibrateMock).toHaveBeenCalledWith([100, 50, 100]);
  });
});
