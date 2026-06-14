/**
 * sentry — initSentry só roda em PROD com DSN configurado.
 * Bug aqui = init em dev mode mata performance (replay overhead),
 * sem DSN tenta init silencioso e crasha, ignoreErrors esquece de
 * Safari quirks (ResizeObserver) e enche o quota.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockInit } = vi.hoisted(() => ({ mockInit: vi.fn() }));

vi.mock("@sentry/react", () => ({
  init: mockInit,
}));

// Stub import.meta.env via vi.stubGlobal
import { initSentry } from "../sentry";

beforeEach(() => {
  mockInit.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("initSentry — gating PROD + DSN", () => {
  it("dev mode (PROD=false): NÃO inicializa", () => {
    vi.stubEnv("PROD", false);
    initSentry();
    expect(mockInit).not.toHaveBeenCalled();
  });

  it("PROD=true sem VITE_SENTRY_DSN: NÃO inicializa + log warn", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_SENTRY_DSN", "");
    initSentry();
    expect(mockInit).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/VITE_SENTRY_DSN.*não configurado/));
    warnSpy.mockRestore();
  });

  it("PROD=true com DSN: chama Sentry.init", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_SENTRY_DSN", "https://abc@sentry.io/123");
    initSentry();
    expect(mockInit).toHaveBeenCalledTimes(1);
    const call = mockInit.mock.calls[0][0];
    expect(call.dsn).toBe("https://abc@sentry.io/123");
  });

  it("init: tracesSampleRate=0.1 (10% traces)", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_SENTRY_DSN", "https://x@y/1");
    initSentry();
    expect(mockInit.mock.calls[0][0].tracesSampleRate).toBe(0.1);
  });

  it("init: replaysOnErrorSampleRate=1.0 (100% replays em erro)", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_SENTRY_DSN", "https://x@y/1");
    initSentry();
    expect(mockInit.mock.calls[0][0].replaysOnErrorSampleRate).toBe(1.0);
  });

  it("ignoreErrors: inclui ResizeObserver, Load failed, AbortError (browser noise)", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_SENTRY_DSN", "https://x@y/1");
    initSentry();
    const ignored = mockInit.mock.calls[0][0].ignoreErrors as string[];
    expect(ignored).toEqual(expect.arrayContaining([
      "ResizeObserver loop limit exceeded",
      "Network request failed",
      "Load failed",
      "AbortError",
    ]));
  });
});
