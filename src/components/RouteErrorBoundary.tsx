/**
 * RouteErrorBoundary — boundary com reset automático em mudança de rota.
 *
 * Problema que resolve:
 *   - `<ErrorBoundary>` puro mantém estado `hasError` até reset explícito
 *     (botão "Voltar ao início").
 *   - Se /customers falha em runtime, navegar pra /offers via NavLink
 *     ainda mostra o fallback de erro (porque o boundary não detectou
 *     que a rota mudou).
 *
 * Solução: usa `useLocation()` como key prop, forçando re-mount da
 * boundary quando o pathname muda. Cada rota recebe instância fresca.
 *
 * Quando usar:
 *   - Wrap em torno de `<Routes>` no roteador principal → boundary
 *     "por rota" que isola falhas. Erro em uma página NÃO trava as
 *     próximas navegações.
 */

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useLocation } from "react-router-dom";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function RouteErrorBoundary({ children }: Props) {
  const location = useLocation();
  // `key` força React a desmontar/montar a boundary a cada mudança de
  // pathname. Estado interno (hasError, error) é resetado naturalmente.
  return <ErrorBoundary key={location.pathname}>{children}</ErrorBoundary>;
}
