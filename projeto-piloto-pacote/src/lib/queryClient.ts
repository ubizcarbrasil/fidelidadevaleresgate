/**
 * QueryClient centralizado com configuração otimizada para escalabilidade.
 * - staleTime global de 30s para dados operacionais
 * - gcTime de 10min para liberar memória
 * - Retry com backoff exponencial (max 2 retries)
 * - refetchOnWindowFocus desabilitado
 */
import { QueryClient } from "@tanstack/react-query";
import { CACHE } from "@/config/constants";

function retryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 10_000);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache mais longo por padrão: a maioria das telas administrativas
      // não precisa refetchar a cada navegação. Hooks específicos com
      // dados realtime (machine_rides, redemptions) sobrescrevem com
      // staleTime menor onde necessário.
      staleTime: CACHE.STALE_TIME_MEDIUM,
      gcTime: CACHE.GC_TIME,
      retry: 1,
      retryDelay,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      // refetchOnMount: padrão true → refetch ao montar APENAS se a query
      // estiver stale. Combinado com staleTime alto, mantém performance e
      // garante que mutations + invalidateQueries reflitam imediatamente
      // na UI quando o componente é remontado (ex: fechar wizard → listar).
    },
    mutations: {
      retry: 1,
      retryDelay,
    },
  },
});
