import { describe, it, expect, vi } from "vitest";
import { isWebviewLitePath, startMonitoring } from "@/lib/bootMonitoring";

function makeLoaders() {
  const initSentry = vi.fn();
  const reportWebVitals = vi.fn();
  const loadSentry = vi.fn(() => Promise.resolve({ initSentry }));
  const loadWebVitals = vi.fn(() => Promise.resolve({ reportWebVitals }));
  return { initSentry, reportWebVitals, loadSentry, loadWebVitals };
}

describe("isWebviewLitePath", () => {
  it("matches /webview and subpaths", () => {
    expect(isWebviewLitePath("/webview")).toBe(true);
    expect(isWebviewLitePath("/webview/")).toBe(true);
    expect(isWebviewLitePath("/webview/abc")).toBe(true);
  });

  it("does not match other paths", () => {
    expect(isWebviewLitePath("/")).toBe(false);
    expect(isWebviewLitePath("/ofertas")).toBe(false);
    expect(isWebviewLitePath("/dashboard")).toBe(false);
    expect(isWebviewLitePath("/web")).toBe(false);
    expect(isWebviewLitePath("/webviewer")).toBe(false);
  });
});

describe("startMonitoring", () => {
  it("does NOT load Sentry or web-vitals on /webview", async () => {
    const l = makeLoaders();
    const started = startMonitoring("/webview", l);
    await Promise.resolve();
    expect(started).toBe(false);
    expect(l.loadSentry).not.toHaveBeenCalled();
    expect(l.loadWebVitals).not.toHaveBeenCalled();
    expect(l.initSentry).not.toHaveBeenCalled();
    expect(l.reportWebVitals).not.toHaveBeenCalled();
  });

  it("does NOT load on nested /webview/* paths", async () => {
    const l = makeLoaders();
    const started = startMonitoring("/webview/foo", l);
    await Promise.resolve();
    expect(started).toBe(false);
    expect(l.loadSentry).not.toHaveBeenCalled();
    expect(l.loadWebVitals).not.toHaveBeenCalled();
  });

  it("loads Sentry and web-vitals on regular routes", async () => {
    const l = makeLoaders();
    const started = startMonitoring("/dashboard", l);
    expect(started).toBe(true);
    // aguarda micro-tasks das promises internas
    await Promise.resolve();
    await Promise.resolve();
    expect(l.loadSentry).toHaveBeenCalledTimes(1);
    expect(l.loadWebVitals).toHaveBeenCalledTimes(1);
    expect(l.initSentry).toHaveBeenCalledTimes(1);
    expect(l.reportWebVitals).toHaveBeenCalledTimes(1);
  });

  it("loads on /ofertas (público mas não webview-lite)", async () => {
    const l = makeLoaders();
    const started = startMonitoring("/ofertas", l);
    await Promise.resolve();
    await Promise.resolve();
    expect(started).toBe(true);
    expect(l.loadSentry).toHaveBeenCalledTimes(1);
    expect(l.loadWebVitals).toHaveBeenCalledTimes(1);
  });
});