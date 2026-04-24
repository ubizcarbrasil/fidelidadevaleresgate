import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Props {
  paginaAtual: number;
  totalPaginas: number;
  totalItens: number;
  itensPorPagina: number;
  onMudarPagina: (pagina: number) => void;
}

/**
 * Calcula a janela de páginas a mostrar (até 5), com elipses quando necessário.
 */
function calcularJanela(paginaAtual: number, totalPaginas: number): (number | "...")[] {
  if (totalPaginas <= 7) {
    return Array.from({ length: totalPaginas }, (_, i) => i + 1);
  }

  const janela: (number | "...")[] = [1];
  const inicio = Math.max(2, paginaAtual - 1);
  const fim = Math.min(totalPaginas - 1, paginaAtual + 1);

  if (inicio > 2) janela.push("...");
  for (let p = inicio; p <= fim; p++) janela.push(p);
  if (fim < totalPaginas - 1) janela.push("...");

  janela.push(totalPaginas);
  return janela;
}

export default function PaginacaoTabela({
  paginaAtual,
  totalPaginas,
  totalItens,
  itensPorPagina,
  onMudarPagina,
}: Props) {
  if (totalPaginas <= 1) {
    return (
      <div className="text-xs text-muted-foreground text-center pt-2">
        {totalItens === 0
          ? "Nenhum item"
          : `Mostrando ${totalItens} ${totalItens === 1 ? "item" : "itens"}`}
      </div>
    );
  }

  const inicio = (paginaAtual - 1) * itensPorPagina + 1;
  const fim = Math.min(paginaAtual * itensPorPagina, totalItens);
  const janela = calcularJanela(paginaAtual, totalPaginas);

  const podeVoltar = paginaAtual > 1;
  const podeAvancar = paginaAtual < totalPaginas;

  return (
    <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-2 pt-2">
      <span className="text-xs text-muted-foreground">
        Mostrando {inicio}–{fim} de {totalItens}
      </span>

      <Pagination className="md:mx-0 md:w-auto md:justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              aria-disabled={!podeVoltar}
              className={!podeVoltar ? "pointer-events-none opacity-40" : ""}
              onClick={(e) => {
                e.preventDefault();
                if (podeVoltar) onMudarPagina(paginaAtual - 1);
              }}
            />
          </PaginationItem>

          {janela.map((item, idx) =>
            item === "..." ? (
              <PaginationItem key={`ellipsis-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationLink
                  href="#"
                  isActive={item === paginaAtual}
                  onClick={(e) => {
                    e.preventDefault();
                    onMudarPagina(item);
                  }}
                >
                  {item}
                </PaginationLink>
              </PaginationItem>
            ),
          )}

          <PaginationItem>
            <PaginationNext
              href="#"
              aria-disabled={!podeAvancar}
              className={!podeAvancar ? "pointer-events-none opacity-40" : ""}
              onClick={(e) => {
                e.preventDefault();
                if (podeAvancar) onMudarPagina(paginaAtual + 1);
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}