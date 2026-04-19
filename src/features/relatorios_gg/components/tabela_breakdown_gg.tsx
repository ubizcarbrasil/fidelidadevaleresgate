import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const fmtBR = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (v: number) => v.toLocaleString("pt-BR");

type Coluna<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "right";
};

type Props<T> = {
  rows: T[];
  loading: boolean;
  colunas: Coluna<T>[];
  vazio?: string;
};

export function TabelaBreakdownGg<T>({ rows, loading, colunas, vazio }: Props<T>) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        {vazio ?? "Nenhum dado no período selecionado."}
      </div>
    );
  }
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {colunas.map((c, i) => (
              <TableHead key={i} className={c.align === "right" ? "text-right" : ""}>
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              {colunas.map((c, j) => (
                <TableCell key={j} className={c.align === "right" ? "text-right tabular-nums" : ""}>
                  {c.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export const fmtTabela = { fmtBR, fmtInt };
