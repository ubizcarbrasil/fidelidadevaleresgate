/**
 * Módulo de logging centralizado com métricas, timers e alertas.
 *
 * Uso:
 *   import { createLogger } from "@/lib/logger";
 *   const log = createLogger("crm");
 *   log.info("Contato criado", { id: "..." });
 *   log.error("Falha ao buscar contatos", error);
 *   log.time("fetchContacts");
 *   // ... operação
 *   log.timeEnd("fetchContacts"); // logs duration
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  module: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Minimum log level — can be overridden via localStorage for debugging
function getMinLevel(): LogLevel {
  try {
    const stored = localStorage.getItem("LOG_LEVEL");
    if (stored && stored in LOG_LEVEL_PRIORITY) return stored as LogLevel;
  } catch {
    // SSR-safe
  }
  return import.meta.env.DEV ? "debug" : "warn";
}

// ── Ring Buffer ──────────────────────────────────────────────────────
const LOG_BUFFER_SIZE = 200;
const logBuffer: LogEntry[] = [];

function pushToBuffer(entry: LogEntry) {
  logBuffer.push(entry);
  if (logBuffer.length > LOG_BUFFER_SIZE) logBuffer.shift();
}

/** Retrieve recent logs for debugging (call from browser console) */
export function getRecentLogs(module?: string, level?: LogLevel): LogEntry[] {
  let logs = [...logBuffer];
  if (module) logs = logs.filter((l) => l.module === module);
  if (level) logs = logs.filter((l) => LOG_LEVEL_PRIORITY[l.level] >= LOG_LEVEL_PRIORITY[level]);
  return logs;
}

// ── Metrics ──────────────────────────────────────────────────────────
interface ModuleMetrics {
  errorCount: number;
  warnCount: number;
  timers: Record<string, { totalMs: number; count: number }>;
}

const metricsMap = new Map<string, ModuleMetrics>();

function getModuleMetrics(module: string): ModuleMetrics {
  if (!metricsMap.has(module)) {
    metricsMap.set(module, { errorCount: 0, warnCount: 0, timers: {} });
  }
  return metricsMap.get(module)!;
}

/** Get all metrics for all modules */
export function getAllMetrics(): Record<string, ModuleMetrics> {
  const result: Record<string, ModuleMetrics> = {};
  metricsMap.forEach((metrics, module) => {
    result[module] = { ...metrics, timers: { ...metrics.timers } };
  });
  return result;
}

// ── Alert System ─────────────────────────────────────────────────────
type AlertCallback = (entry: LogEntry) => void;
let alertCallback: AlertCallback | null = null;

/** Set a callback for critical errors (e.g., show toast) */
export function setAlertCallback(cb: AlertCallback | null): void {
  alertCallback = cb;
}

// ── Expose globally for browser console debugging ────────────────────
if (typeof window !== "undefined") {
  (window as any).__getLogs = getRecentLogs;
  (window as any).__getMetrics = getAllMetrics;
}

// ── Logger Interface ─────────────────────────────────────────────────
export interface Logger {
  debug: (message: string, data?: unknown) => void;
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
  time: (label: string) => void;
  timeEnd: (label: string) => void;
}

// Timer storage per module
const activeTimers = new Map<string, number>();

export function createLogger(module: string): Logger {
  function log(level: LogLevel, message: string, data?: unknown) {
    const minLevel = getMinLevel();
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[minLevel]) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      module,
      level,
      message,
      data,
    };

    pushToBuffer(entry);

    // Update metrics
    const metrics = getModuleMetrics(module);
    if (level === "error") {
      metrics.errorCount++;
      // Trigger alert callback for errors
      if (alertCallback) {
        try {
          alertCallback(entry);
        } catch {
          // Prevent alert callback errors from cascading
        }
      }
    } else if (level === "warn") {
      metrics.warnCount++;
    }

    const prefix = `[${module}]`;
    const consoleFn = level === "error" ? console.error
      : level === "warn" ? console.warn
      : level === "debug" ? console.debug
      : console.info;

    consoleFn(prefix, message, data !== undefined ? data : "");
  }

  function time(label: string) {
    activeTimers.set(`${module}:${label}`, performance.now());
  }

  function timeEnd(label: string) {
    const key = `${module}:${label}`;
    const start = activeTimers.get(key);
    if (start === undefined) {
      log("warn", `Timer "${label}" not found`);
      return;
    }

    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    activeTimers.delete(key);

    // Store in metrics
    const metrics = getModuleMetrics(module);
    if (!metrics.timers[label]) {
      metrics.timers[label] = { totalMs: 0, count: 0 };
    }
    metrics.timers[label].totalMs += durationMs;
    metrics.timers[label].count++;

    log("debug", `⏱ ${label}: ${durationMs}ms`);
  }

  return {
    debug: (msg, data) => log("debug", msg, data),
    info: (msg, data) => log("info", msg, data),
    warn: (msg, data) => log("warn", msg, data),
    error: (msg, data) => log("error", msg, data),
    time,
    timeEnd,
  };
}
