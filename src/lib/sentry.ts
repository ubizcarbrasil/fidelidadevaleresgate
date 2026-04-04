import * as Sentry from "@sentry/react";

export function initSentry() {
  if (!import.meta.env.PROD) return;

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    console.warn("[sentry] VITE_SENTRY_DSN não configurado — Sentry desativado.");
    return;
  }

  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "Network request failed",
      "Load failed",
      "AbortError",
    ],
  });
}
