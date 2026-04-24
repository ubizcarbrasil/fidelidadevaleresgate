import { useEffect, useMemo, useState } from "react";

interface OpcoesPaginacao {
  itensPorPagina?: number;
}

/**
 * Hook puro de paginação client-side.
 * Reseta automaticamente para a página 1 quando a quantidade total de itens
 * muda (ex.: após aplicar busca/filtro), evitando o bug clássico de "página
 * vazia depois de filtrar".
 */
export function useHookPaginacao<T>(
  itens: T[],
  { itensPorPagina = 20 }: OpcoesPaginacao = {},
) {
  const totalItens = itens.length;
  const totalPaginas = Math.max(1, Math.ceil(totalItens / itensPorPagina));

  const [paginaAtual, setPaginaAtual] = useState(1);

  // Quando o total muda (filtro, busca, troca de marca), volta à primeira página.
  useEffect(() => {
    setPaginaAtual(1);
  }, [totalItens]);

  // Garante que a página atual nunca fique fora do range (defensivo).
  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  const itensVisiveis = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return itens.slice(inicio, inicio + itensPorPagina);
  }, [itens, paginaAtual, itensPorPagina]);

  const irParaPagina = (pagina: number) => {
    const alvo = Math.min(Math.max(1, pagina), totalPaginas);
    setPaginaAtual(alvo);
  };

  const resetar = () => setPaginaAtual(1);

  return {
    paginaAtual,
    totalPaginas,
    totalItens,
    itensPorPagina,
    itensVisiveis,
    irParaPagina,
    resetar,
  };
}