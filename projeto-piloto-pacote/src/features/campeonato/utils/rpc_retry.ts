/**
 * Helper compartilhado para retry com backoff em RPCs do campeonato.
 *
 * Por que existe: Safari iOS no 5G oscilante causa erros "Load failed" /
 * "Failed to fetch" intermitentes. Sem retry, qualquer hiccup de rede vira
 * erro permanente no UI até refetch manual.
 *
 * Estratégia: 3 tentativas total, backoff exponencial 300ms → 800ms → 1.5s.
 * Apenas retry em erro de rede transiente (não em erro de lógica/SQL).
 *
 * Uso típico:
 *   const { data } = await withCampeonatoRpcRetry(
 *     () => supabase.rpc("xyz", { ... })
 *   );
 */

function isTransientNetworkError(err: unknown): boolean {
  const msg = (err as { message?: string })?.message ?? "";
  return (
    msg.includes("Load failed") ||
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("network error")
  );
}

interface RpcResult<T> {
  data: T | null;
  error: { message: string; code?: string; details?: string; hint?: string } | null;
}

/**
 * Envolve uma chamada RPC do Supabase com retry em erros transientes.
 * Loga detalhes do erro final (não retentado) pra ajudar debug em produção.
 *
 * Aceita PromiseLike porque supabase.rpc() retorna PostgrestFilterBuilder,
 * que é PromiseLike mas não Promise puro.
 */
export async function withCampeonatoRpcRetry<T>(
  rpcCall: () => PromiseLike<RpcResult<T>>,
  label = "rpc",
): Promise<RpcResult<T>> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await rpcCall();

    if (!result.error) return result;

    // Erro de rede transiente: retry (300ms, 800ms, 1.5s)
    if (isTransientNetworkError(result.error) && attempt < 2) {
      const delayMs = 300 * Math.pow(2.5, attempt);
      console.warn(
        `[${label}] retry ${attempt + 1}/3 em ${delayMs}ms — ${result.error.message}`,
      );
      await new Promise((r) => setTimeout(r, delayMs));
      continue;
    }

    // Erro não-transiente OU esgotou retries: log detalhado pra debug
    // antes de propagar.
    console.error(`[${label}] rpc falhou definitivamente`, {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });
    return result;
  }

  // Defensivo — loop saiu sem return (não deveria acontecer)
  return { data: null, error: { message: "max retries exhausted" } };
}
