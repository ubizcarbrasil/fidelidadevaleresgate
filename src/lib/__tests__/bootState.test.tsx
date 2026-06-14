/**
 * bootState — re-exports do bootStateCore + hook useBootReady (useSyncExternalStore).
 *
 * IMPORTANTE: bootResolved é state SINGLETON STICKY do módulo — uma vez
 * que vira true (BRAND_READY ou FAILED), nunca mais reverte (proteção
 * contra flash de loader durante re-renders). Por isso esses testes
 * ordenam os asserts de "false" antes do "true" e não recriam o estado
 * intermediário.
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, waitFor, act } from "@testing-library/react";
import {
  setBootPhase,
  getBootPhase,
  useBootReady,
  isBootResolved,
} from "../bootState";

function Probe({ onValue }: { onValue: (v: boolean) => void }) {
  const ready = useBootReady();
  React.useEffect(() => { onValue(ready); }, [ready, onValue]);
  return null;
}

describe("bootState re-exports + useBootReady (singleton sticky)", () => {
  it("01 — initial: isBootResolved() = false e useBootReady = false", async () => {
    expect(isBootResolved()).toBe(false);
    const values: boolean[] = [];
    render(<Probe onValue={(v) => values.push(v)} />);
    await waitFor(() => expect(values.length).toBeGreaterThan(0));
    expect(values[values.length - 1]).toBe(false);
  });

  it("02 — setBootPhase + getBootPhase: round-trip (não muda resolved)", () => {
    setBootPhase("AUTH_LOADING");
    expect(getBootPhase()).toBe("AUTH_LOADING");
    setBootPhase("BRAND_LOADING");
    expect(getBootPhase()).toBe("BRAND_LOADING");
    // ainda não chegou a BRAND_READY
    expect(isBootResolved()).toBe(false);
  });

  it("03 — transição pra BRAND_READY: isBootResolved vira true + hook re-renderiza", async () => {
    const values: boolean[] = [];
    render(<Probe onValue={(v) => values.push(v)} />);
    await waitFor(() => expect(values.length).toBeGreaterThan(0));

    act(() => { setBootPhase("BRAND_READY"); });
    await waitFor(() => expect(values[values.length - 1]).toBe(true));
    expect(isBootResolved()).toBe(true);
  });

  it("04 — sticky: setBootPhase pra fase mais baixa é REJEITADO (no regression)", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    try {
      setBootPhase("AUTH_LOADING");
      // Fase atual permanece em BRAND_READY (regression rejeitada)
      expect(getBootPhase()).toBe("BRAND_READY");
      expect(isBootResolved()).toBe(true);
    } finally {
      infoSpy.mockRestore();
    }
  });

  it("05 — useBootReady após resolved: SEMPRE true (sticky)", async () => {
    const values: boolean[] = [];
    render(<Probe onValue={(v) => values.push(v)} />);
    await waitFor(() => expect(values.length).toBeGreaterThan(0));
    expect(values[values.length - 1]).toBe(true);
  });
});
