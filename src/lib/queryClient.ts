/**
 * QueryClient centralizado com configuração otimizada para escalabilidade.
 * - staleTime global de 30s para dados operacionais
 * - gcTime de 10min para liberar memória
 * - Retry com backoff exponencial (max 2 retries)
 * - refetchOnWindowFocus desabilitado
 */
import { QueryClient } from "@tanstack/react-query";

function retryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 10_000);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30s — dados operacionais
      gcTime: 10 * 60_000,      // 10min — libera memória
      retry: 2,
      retryDelay,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      retryDelay,
    },
  },
});
