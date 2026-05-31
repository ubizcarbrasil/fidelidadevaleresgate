/**
 * Boot context: dispara UMA RPC `get_boot_context` no início do app,
 * antes do React montar. Os contexts (Auth, Brand) consomem o resultado
 * em vez de fazer 5-7 queries paralelas (que iOS Safari aborta em 5G).
 *
 * Estratégia:
 *   - main.tsx chama startBootPrefetch() ANTES de createRoot()
 *   - A RPC já roda em paralelo enquanto os chunks JS terminam de baixar
 *   - Contexts esperam a promise via getBootContext()
 *   - Se a RPC falhar, contexts caem em fallback (queries individuais)
 */

import { supabase } from "@/integrations/supabase/client";
import { bootMark } from "@/lib/bootMetrics";

export interface BootRole {
  id: string;
  role: string;
  tenant_id: string | null;
  brand_id: string | null;
  branch_id: string | null;
}

export interface BootBrand {
  id: string;
  name: string;
  slug: string | null;
  [key: string]: unknown;
}

export interface BootProfile {
  id: string;
  selected_branch_id: string | null;
  [key: string]: unknown;
}

export interface BootBranch {
  id: string;
  name: string;
  brand_id: string;
  [key: string]: unknown;
}

export interface BootContext {
  user_id: string | null;
  brand_id: string | null;
  brand: BootBrand | null;
  roles: BootRole[];
  profile: BootProfile | null;
  branches: BootBranch[];
  server_time: string;
}

let bootPromise: Promise<BootContext | null> | null = null;

/**
 * Dispara a RPC de boot. Idempotente — chamadas subsequentes retornam
 * a mesma promise. Falha silenciosa (retorna null) pra não quebrar
 * fallback nos contexts.
 */
export function startBootPrefetch(brandIdHint?: string): Promise<BootContext | null> {
  if (bootPromise) return bootPromise;

  bootMark("boot:rpc-start");

  bootPromise = (async () => {
    try {
      const hostname = typeof window !== "undefined" ? window.location.hostname : null;
      // Timeout 6s — em 5G/iOS ruim, RPC pode travar indefinidamente
      // (HTTP/2 abort silencioso). Sem timeout, contexts ficam esperando
      // a promise pra sempre e app trava em "Carregando seu painel...".
      // 6s é generoso pra rede ruim mas evita boot infinito.
      const rpcPromise = supabase.rpc("get_boot_context", {
        p_hostname: hostname ?? undefined,
        p_brand_id: brandIdHint ?? undefined,
      });
      const timeoutPromise = new Promise<{ data: null; error: { message: string } }>(
        (resolve) => setTimeout(
          () => resolve({ data: null, error: { message: "boot_rpc_timeout_6s" } }),
          6000,
        ),
      );

      const { data, error } = await Promise.race([rpcPromise, timeoutPromise]);

      bootMark("boot:rpc-done");

      if (error) {
        console.warn("[bootContext] RPC falhou ou timeout, contexts usarão fallback:", error.message);
        return null;
      }
      return data as unknown as BootContext;
    } catch (err) {
      console.warn("[bootContext] exceção:", err);
      return null;
    }
  })();

  return bootPromise;
}

export function getBootContext(): Promise<BootContext | null> {
  return bootPromise ?? Promise.resolve(null);
}

/** Reset usado em testes e logout completo. */
export function resetBootContext(): void {
  bootPromise = null;
}
