/**
 * Módulo de logging centralizado.
 * Cada módulo cria um logger nomeado para facilitar a identificação de erros.
 *
 * Uso:
 *   import { createLogger } from "@/lib/logger";
 *   const log = createLogger("crm");
 *   log.info("Contato criado", { id: "..." });
 *   log.error("Falha ao buscar contatos", error);
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

// Ring buffer for recent log inspection
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

// Expose globally for browser console debugging
if (typeof window !== "undefined") {
  (window as any).__getLogs = getRecentLogs;
}

export interface Logger {
  debug: (message: string, data?: unknown) => void;
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
}

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

    const prefix = `[${module}]`;
    const consoleFn = level === "error" ? console.error
      : level === "warn" ? console.warn
      : level === "debug" ? console.debug
      : console.info;

    consoleFn(prefix, message, data !== undefined ? data : "");
  }

  return {
    debug: (msg, data) => log("debug", msg, data),
    info: (msg, data) => log("info", msg, data),
    warn: (msg, data) => log("warn", msg, data),
    error: (msg, data) => log("error", msg, data),
  };
}
