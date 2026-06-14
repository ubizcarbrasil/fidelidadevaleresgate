/**
 * webVitals — reporta Web Vitals (LCP, FID, FCP, CLS, TTFB, INP) ao
 * Sentry como breadcrumbs. Bug aqui = rating ausente vira "error" no
 * Sentry (alerta falso), value não arredondado polui breadcrumbs com
 * decimal ruidoso.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAddBreadcrumb, mockOnCLS, mockOnFCP, mockOnLCP, mockOnTTFB, mockOnINP } = vi.hoisted(() => ({
  mockAddBreadcrumb: vi.fn(),
  mockOnCLS: vi.fn(),
  mockOnFCP: vi.fn(),
  mockOnLCP: vi.fn(),
  mockOnTTFB: vi.fn(),
  mockOnINP: vi.fn(),
}));

vi.mock("@sentry/react", () => ({
  addBreadcrumb: mockAddBreadcrumb,
}));

vi.mock("web-vitals", () => ({
  onCLS: mockOnCLS,
  onFCP: mockOnFCP,
  onLCP: mockOnLCP,
  onTTFB: mockOnTTFB,
  onINP: mockOnINP,
}));

import { reportWebVitals } from "../webVitals";

beforeEach(() => {
  mockAddBreadcrumb.mockReset();
  mockOnCLS.mockReset();
  mockOnFCP.mockReset();
  mockOnLCP.mockReset();
  mockOnTTFB.mockReset();
  mockOnINP.mockReset();
});

describe("reportWebVitals", () => {
  it("registra handler em todas as métricas (CLS/FCP/LCP/TTFB/INP)", () => {
    reportWebVitals();
    expect(mockOnCLS).toHaveBeenCalledTimes(1);
    expect(mockOnFCP).toHaveBeenCalledTimes(1);
    expect(mockOnLCP).toHaveBeenCalledTimes(1);
    expect(mockOnTTFB).toHaveBeenCalledTimes(1);
    expect(mockOnINP).toHaveBeenCalledTimes(1);
  });

  it("rating 'good' → level=info no Sentry breadcrumb", () => {
    reportWebVitals();
    const handler = mockOnLCP.mock.calls[0][0];
    handler({ name: "LCP", value: 2500.7, rating: "good" });
    expect(mockAddBreadcrumb).toHaveBeenCalledWith({
      category: "web-vitals",
      message: "LCP",
      data: { value: 2501, rating: "good" }, // value arredondado
      level: "info",
    });
  });

  it("rating 'needs-improvement' → level=warning", () => {
    reportWebVitals();
    const handler = mockOnFCP.mock.calls[0][0];
    handler({ name: "FCP", value: 3200, rating: "needs-improvement" });
    expect(mockAddBreadcrumb.mock.calls[0][0].level).toBe("warning");
  });

  it("rating 'poor' → level=error", () => {
    reportWebVitals();
    const handler = mockOnCLS.mock.calls[0][0];
    handler({ name: "CLS", value: 0.25, rating: "poor" });
    expect(mockAddBreadcrumb.mock.calls[0][0].level).toBe("error");
  });

  it("rating undefined: assume 'good' (info)", () => {
    reportWebVitals();
    const handler = mockOnINP.mock.calls[0][0];
    handler({ name: "INP", value: 100 });
    const call = mockAddBreadcrumb.mock.calls[0][0];
    expect(call.level).toBe("info");
    expect(call.data.rating).toBe("good");
  });

  it("value arredondado pra inteiro (sem decimais ruidosos)", () => {
    reportWebVitals();
    const handler = mockOnLCP.mock.calls[0][0];
    handler({ name: "LCP", value: 1234.567, rating: "good" });
    expect(mockAddBreadcrumb.mock.calls[0][0].data.value).toBe(1235);
  });
});
