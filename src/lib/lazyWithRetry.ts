import { lazy, type ComponentType } from "react";
import { recoverFromChunkError, canAttemptRecovery } from "@/lib/pwaRecovery";

/**
 * Wrapper around React.lazy que tenta o import() 2 vezes antes de cair em
 * recovery (que faz reload completo da página).
 *
 * Por que isso importa: no iOS Safari sob carga (rajada de fetches paralelos
 * no boot), o browser aborta arbitrariamente conexões com erro genérico
 * "Importing a module script failed" — mas o chunk EXISTE e fica disponível
 * 250-800ms depois. Antes, qualquer aborto desses disparava reload completo
 * que demorava >1min no 5G ruim. Agora 99% dos casos é absorvido pelo retry
 * silencioso e nem o usuário percebe.
 *
 * Diagnóstico do problema:
 * https://github.com/ubizcarbrasil/fidelidadevaleresgate (sessão de debug)
 *
 * Estratégia:
 * 1. Primeira tentativa: import() padrão
 * 2. Se falhou e é chunk error: aguarda 250ms, retry
 * 3. Se falhou de novo: aguarda 800ms, retry
 * 4. Se ainda assim falhou: aí sim recoverFromChunkError() (com cooldown)
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): React.LazyExoticComponent<T> {
  return lazy(() => loadWithRetry(factory));
}

function isChunkLoadError(err: unknown): boolean {
  const errMsg = err instanceof Error ? err.message : String(err);
  return (
    errMsg.includes("Failed to fetch dynamically imported module") ||
    errMsg.includes("Importing a module script failed") ||
    errMsg.includes("error loading dynamically imported module") ||
    errMsg.includes("Loading chunk") ||
    errMsg.includes("Loading CSS chunk")
  );
}

async function loadWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): Promise<{ default: T }> {
  const delays = [250, 800]; // 2 retries com backoff

  try {
    return await factory();
  } catch (err) {
    if (!isChunkLoadError(err)) throw err;

    // Retry 1 + 2
    for (const delayMs of delays) {
      await new Promise((r) => setTimeout(r, delayMs));
      try {
        const result = await factory();
        // Sucesso no retry — log discreto pra diagnóstico futuro
        console.info(
          `[lazyWithRetry] recuperou após retry de ${delayMs}ms (chunk transitório)`,
        );
        return result;
      } catch (retryErr) {
        if (!isChunkLoadError(retryErr)) throw retryErr;
        // Continua pro próximo delay (ou cai no recovery)
      }
    }

    // 3 tentativas falharam — chunk realmente sumiu. Recovery agora faz
    // sentido (cooldown protege contra loop).
    if (!canAttemptRecovery()) throw err;
    void recoverFromChunkError();

    // Promise que nunca resolve — React não tenta renderizar
    return new Promise<{ default: T }>(() => {});
  }
}
