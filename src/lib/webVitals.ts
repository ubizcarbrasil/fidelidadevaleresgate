/**
 * Web Vitals monitoring — captura métricas de performance e envia ao Sentry como breadcrumbs.
 * Métricas: LCP, FID, FCP, CLS, TTFB, INP
 */

import * as Sentry from "@sentry/react";
import { onCLS, onFCP, onLCP, onTTFB, onINP } from "web-vitals";

type Rating = "good" | "needs-improvement" | "poor";

function sentryLevel(rating: Rating): "info" | "warning" | "error" {
  if (rating === "good") return "info";
  if (rating === "needs-improvement") return "warning";
  return "error";
}

export function reportWebVitals(): void {
  const send = ({ name, value, rating }: { name: string; value: number; rating?: Rating }) => {
    const r = rating ?? "good";
    Sentry.addBreadcrumb({
      category: "web-vitals",
      message: name,
      data: { value: Math.round(value), rating: r },
      level: sentryLevel(r as Rating),
    });
  };

  onCLS(send);
  onFID(send);
  onFCP(send);
  onLCP(send);
  onTTFB(send);
  onINP(send);
}
