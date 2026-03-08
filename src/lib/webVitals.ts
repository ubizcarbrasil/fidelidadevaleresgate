/**
 * Web Vitals monitoring using native PerformanceObserver API.
 * Integrates with the centralized logger for unified observability.
 *
 * Metrics captured: LCP, FID, INP, CLS, TTFB
 * Access via: window.__getWebVitals()
 */

import { createLogger } from "@/lib/logger";

const log = createLogger("web-vitals");

type Rating = "good" | "needs-improvement" | "poor";

interface VitalEntry {
  value: number;
  rating: Rating;
  timestamp: string;
}

const vitals: Record<string, VitalEntry> = {};

function rate(metric: string, value: number): Rating {
  const thresholds: Record<string, [number, number]> = {
    LCP: [2500, 4000],
    FID: [100, 300],
    INP: [200, 500],
    CLS: [0.1, 0.25],
    TTFB: [800, 1800],
  };
  const [good, poor] = thresholds[metric] ?? [Infinity, Infinity];
  if (value <= good) return "good";
  if (value <= poor) return "needs-improvement";
  return "poor";
}

function record(metric: string, value: number) {
  const rounded = Math.round(value * 100) / 100;
  const rating = rate(metric, rounded);
  vitals[metric] = { value: rounded, rating, timestamp: new Date().toISOString() };

  const logFn = rating === "poor" ? log.warn : log.info;
  logFn(`${metric}: ${rounded}${metric === "CLS" ? "" : "ms"} [${rating}]`, { value: rounded, rating });
}

function observe(type: string, cb: (entries: PerformanceEntryList) => void, opts?: PerformanceObserverInit) {
  try {
    const observer = new PerformanceObserver((list) => cb(list.getEntries()));
    observer.observe({ type, buffered: true, ...opts });
  } catch {
    // Unsupported entry type — graceful degradation
  }
}

export function initWebVitals(): void {
  if (typeof window === "undefined" || !("PerformanceObserver" in window)) return;

  // LCP
  observe("largest-contentful-paint", (entries) => {
    const last = entries[entries.length - 1];
    if (last) record("LCP", last.startTime);
  });

  // FID
  observe("first-input", (entries) => {
    const first = entries[0] as PerformanceEventTiming | undefined;
    if (first) record("FID", first.processingStart - first.startTime);
  });

  // INP (long animation frames as proxy for event timing)
  observe("event", (entries) => {
    let maxDuration = 0;
    for (const e of entries) {
      const evt = e as PerformanceEventTiming;
      if (evt.duration > maxDuration) maxDuration = evt.duration;
    }
    if (maxDuration > 0) record("INP", maxDuration);
  }, { type: "event", buffered: true, durationThreshold: 16 } as any);

  // CLS
  let clsValue = 0;
  observe("layout-shift", (entries) => {
    for (const e of entries) {
      const ls = e as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
      if (!ls.hadRecentInput && ls.value) clsValue += ls.value;
    }
    record("CLS", clsValue);
  });

  // TTFB
  observe("navigation", (entries) => {
    const nav = entries[0] as PerformanceNavigationTiming | undefined;
    if (nav) record("TTFB", nav.responseStart - nav.requestStart);
  });

  // Expose for console debugging
  (window as any).__getWebVitals = () => ({ ...vitals });

  log.info("Web Vitals monitoring initialized");
}
