import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DivergenciaMotorista } from "../types/tipos_auditoria";

interface Props {
  divergencias: DivergenciaMotorista[];
  totalDivergentes: number;
}

export default function TabelaDivergencias({ divergencias, totalDivergentes }: Props) {
  if (divergencias.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">Sem amostras registradas.</p>
    );
  }
  const restante = Math.max(0, totalDivergentes - divergencias.length);

  return (
    <div className="space-y-2">
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Driver ID</TableHead>
              <TableHead className="text-right text-xs">Standings</TableHead>
              <TableHead className="text-right text-xs">Eventos</TableHead>
              <TableHead className="text-right text-xs">Diferença</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {divergencias.map((d) => {
              const diff = d.standings - d.eventos;
              return (
                <TableRow key={d.driver_id}>
                  <TableCell className="font-mono text-[11px]">
                    {d.driver_id.slice(0, 8)}…
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{d.standings}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.eventos}</TableCell>
                  <TableCell
                    className={`text-right tabular-nums font-medium ${
                      diff > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {diff > 0 ? `+${diff}` : diff}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {restante > 0 && (
        <p className="text-[11px] text-muted-foreground">
          + {restante} motorista(s) divergente(s) não exibido(s) (amostra limitada a 5).
        </p>
      )}
    </div>
  );
}
