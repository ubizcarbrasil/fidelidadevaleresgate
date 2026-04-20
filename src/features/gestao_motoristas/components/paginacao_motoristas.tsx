import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  pagina: number;
  totalPaginas: number;
  total: number;
  porPagina: number;
  onMudarPagina: (p: number) => void;
}

export default function PaginacaoMotoristas({
  pagina,
  totalPaginas,
  total,
  porPagina,
  onMudarPagina,
}: Props) {
  if (total === 0) return null;

  const inicio = (pagina - 1) * porPagina + 1;
  const fim = Math.min(pagina * porPagina, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
      <p className="text-xs text-muted-foreground">
        Exibindo <span className="font-medium text-foreground">{inicio}-{fim}</span> de{" "}
        <span className="font-medium text-foreground">{total.toLocaleString("pt-BR")}</span> motoristas
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMudarPagina(pagina - 1)}
          disabled={pagina <= 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>
        <span className="text-xs text-muted-foreground px-2">
          Página <span className="font-medium text-foreground">{pagina}</span> de{" "}
          <span className="font-medium text-foreground">{totalPaginas}</span>
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMudarPagina(pagina + 1)}
          disabled={pagina >= totalPaginas}
        >
          Próxima
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
