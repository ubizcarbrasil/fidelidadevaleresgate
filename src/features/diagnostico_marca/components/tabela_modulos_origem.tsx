import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import type { ModuloDiagnostico, OrigemModulo } from "../types/tipos_diagnostico";
import { useHookPaginacao } from "@/compartilhados/hooks/hook_paginacao";
import PaginacaoTabela from "@/compartilhados/components/paginacao_tabela";

const ITENS_POR_PAGINA = 20;

interface Props {
  modulos: ModuloDiagnostico[];
}

const ORIGEM_LABEL: Record<OrigemModulo, { label: string; tone: string }> = {
  core: { label: "Núcleo", tone: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30" },
  produto: { label: "Produto", tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  modelo_negocio: { label: "Modelo de Negócio", tone: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30" },
  manual: { label: "Manual", tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" },
};

export default function TabelaModulosOrigem({ modulos }: Props) {
  const [busca, setBusca] = useState("");
  const [filtroOrigem, setFiltroOrigem] = useState<OrigemModulo | "all">("all");

  const filtrados = useMemo(() => {
    const term = busca.trim().toLowerCase();
    return modulos.filter((m) => {
      if (filtroOrigem !== "all" && !m.origens.includes(filtroOrigem)) return false;
      if (!term) return true;
      return (
        m.label.toLowerCase().includes(term) ||
        m.key.toLowerCase().includes(term) ||
        (m.category ?? "").toLowerCase().includes(term)
      );
    });
  }, [modulos, busca, filtroOrigem]);

  const {
    paginaAtual,
    totalPaginas,
    totalItens,
    itensVisiveis,
    irParaPagina,
  } = useHookPaginacao(filtrados, { itensPorPagina: ITENS_POR_PAGINA });

  return (
    <Card className="p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar módulo por nome, key ou categoria"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {(["all", "core", "produto", "modelo_negocio", "manual"] as const).map((o) => (
            <button
              key={o}
              onClick={() => setFiltroOrigem(o)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                filtroOrigem === o
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {o === "all" ? "Todos" : ORIGEM_LABEL[o].label}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        {totalItens} {totalItens === 1 ? "módulo" : "módulos"} no total
        {totalItens !== modulos.length && ` (de ${modulos.length} ativos)`}
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[35%]">Módulo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Chave técnica</TableHead>
              <TableHead>Origem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itensVisiveis.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-8"
                >
                  Nenhum módulo encontrado.
                </TableCell>
              </TableRow>
            ) : (
              itensVisiveis.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.label}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {m.category ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {m.key}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {m.origens.map((o) => (
                        <Badge
                          key={o}
                          variant="outline"
                          className={`text-[10px] ${ORIGEM_LABEL[o].tone}`}
                        >
                          {ORIGEM_LABEL[o].label}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginacaoTabela
        paginaAtual={paginaAtual}
        totalPaginas={totalPaginas}
        totalItens={totalItens}
        itensPorPagina={ITENS_POR_PAGINA}
        onMudarPagina={irParaPagina}
      />
    </Card>
  );
}