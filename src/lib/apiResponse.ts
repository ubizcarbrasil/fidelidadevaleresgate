/**
 * API Response — helpers client-side para parsing consistente de Edge Functions.
 *
 * Padrão esperado das Edge Functions:
 *   { ok: boolean, data?: T, error?: string, code?: string }
 */

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Invoca uma Edge Function e faz parsing padronizado da resposta.
 */
export async function callEdgeFunction<T = unknown>(
  supabaseClient: { functions: { invoke: (name: string, options?: any) => Promise<{ data: any; error: any }> } },
  functionName: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> {
  try {
    const { data, error } = await supabaseClient.functions.invoke(functionName, {
      body,
      headers,
    });

    if (error) {
      return {
        ok: false,
        error: error.message || "Edge function invocation failed",
        code: "INVOKE_ERROR",
      };
    }

    // Edge function returned a structured response
    if (data && typeof data === "object" && "ok" in data) {
      return data as ApiResponse<T>;
    }

    // Legacy format: wrap in standard envelope
    return { ok: true, data: data as T };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || "Network error",
      code: "NETWORK_ERROR",
    };
  }
}

/**
 * Helper para Edge Functions (server-side) criarem respostas padronizadas.
 * Uso em Deno Edge Functions:
 *   return apiOk({ points: 100 })
 *   return apiError("Not found", "NOT_FOUND", 404)
 */
export function apiOk<T>(data: T, status = 200, corsHeaders: Record<string, string> = {}): Response {
  return new Response(
    JSON.stringify({ ok: true, data }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

export function apiError(error: string, code: string, status = 400, corsHeaders: Record<string, string> = {}): Response {
  return new Response(
    JSON.stringify({ ok: false, error, code }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
