/**
 * Structured JSON logger for Edge Functions.
 * Outputs JSON to stdout for easy parsing in production.
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface EdgeLogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  correlationId: string;
  message: string;
  data?: unknown;
}

function generateCorrelationId(): string {
  return crypto.randomUUID().slice(0, 8);
}

export function createEdgeLogger(module: string, correlationId?: string) {
  const corrId = correlationId || generateCorrelationId();

  function log(level: LogLevel, message: string, data?: unknown): void {
    const entry: EdgeLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      correlationId: corrId,
      message,
      ...(data !== undefined && { data }),
    };
    const output = JSON.stringify(entry);
    if (level === "error") {
      console.error(output);
    } else if (level === "warn") {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  return {
    info: (message: string, data?: unknown) => log("info", message, data),
    warn: (message: string, data?: unknown) => log("warn", message, data),
    error: (message: string, data?: unknown) => log("error", message, data),
    debug: (message: string, data?: unknown) => log("debug", message, data),
    correlationId: corrId,
  };
}
