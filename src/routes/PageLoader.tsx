import { forwardRef } from "react";
import { TelaCarregamentoInline } from "@/compartilhados/components/tela_carregamento";

/**
 * Fallback de Suspense reutilizado em todo o roteamento.
 * Usa `forwardRef` para permitir que React DevTools/route diagnostics
 * inspecionem a árvore enquanto chunks carregam.
 */
export const PageLoader = forwardRef<HTMLDivElement>(function PageLoader(_props, ref) {
  return (
    <div ref={ref}>
      <TelaCarregamentoInline />
    </div>
  );
});
