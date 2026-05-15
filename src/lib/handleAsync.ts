import { createLogger } from "@/lib/logger";

const log = createLogger("handleAsync");

interface HandleAsyncOptions {
  /** Mensagem opcional para o log em caso de falha (default: nome da função / "operação assíncrona"). */
  context?: string;
  /** Callback executado em caso de erro. Receba a instância de Error já normalizada. */
  onError?: (error: Error) => void;
  /** Se `true`, propaga a exceção em vez de retornar `null`. Útil para await em fluxos críticos. */
  rethrow?: boolean;
}

/**
 * Executa uma função assíncrona com tratamento de erro consistente.
 *
 * Substitui o padrão repetido:
 *   try { return await fn(); } catch (e) { toast.error(...); return null; }
 *
 * @example
 *   const data = await handleAsync(
 *     () => supabase.from("x").select(),
 *     { context: "fetchX", onError: (e) => toast.error(e.message) }
 *   );
 */
export async function handleAsync<T>(
  fn: () => Promise<T>,
  options: HandleAsyncOptions = {},
): Promise<T | null> {
  try {
    return await fn();
  } catch (raw) {
    const error = raw instanceof Error ? raw : new Error(String(raw));
    log.error(options.context ?? "operação assíncrona", error);
    options.onError?.(error);
    if (options.rethrow) throw error;
    return null;
  }
}
