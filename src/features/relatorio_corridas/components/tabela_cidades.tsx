import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { RelatorioCidadeRow } from "../types/tipos_relatorio_corridas";

interface Props {
  rows: RelatorioCidadeRow[];
}

function TendenciaBadge({ atual, anterior }: { atual: number; anterior: number }) {
  if (anterior === 0 && atual === 0) return <Badge variant="secondary" className="text-[10px] gap-1"><Minus className="h-3 w-3" /> —</Badge>;
  if (anterior === 0) return <Badge variant="default" className="text-[10px] gap-1 bg-green-600"><TrendingUp className="h-3 w-3" /> Novo</Badge>;
  const pct = ((atual - anterior) / anterior) * 100;
  if (pct > 0) return <Badge variant="default" className="text-[10px] gap-1 bg-green-600"><TrendingUp className="h-3 w-3" /> +{pct.toFixed(0)}%</Badge>;
  if (pct < 0) return <Badge variant="destructive" className="text-[10px] gap-1"><TrendingDown className="h-3 w-3" /> {pct.toFixed(0)}%</Badge>;
  return <Badge variant="secondary" className="text-[10px] gap-1"><Minus className="h-3 w-3" /> 0%</Badge>;
}

export default function TabelaCidades({ rows }: Props) {
  if (rows.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-8">Nenhuma cidade encontrada.</p>;
  }

  return (
    <div className="rounded-xl border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Cidade</TableHead>
            <TableHead className="text-xs text-right">Corridas</TableHead>
            <TableHead className="text-xs text-right hidden sm:table-cell">Valor (R$)</TableHead>
            <TableHead className="text-xs text-right">Pts Motorista</TableHead>
            <TableHead className="text-xs text-right hidden md:table-cell">Pts Cliente</TableHead>
            <TableHead className="text-xs text-right hidden md:table-cell">Motoristas</TableHead>
            <TableHead className="text-xs text-center">Tendência</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.branch_id}>
              <TableCell className="text-sm font-medium">
                <div>
                  <span>{row.branch_city}</span>
                  {row.branch_state && (
                    <span className="text-xs text-muted-foreground ml-1">({row.branch_state})</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm text-right tabular-nums">{row.total_rides.toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-sm text-right tabular-nums hidden sm:table-cell">
                {row.total_ride_value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-sm text-right tabular-nums">{row.total_driver_points.toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-sm text-right tabular-nums hidden md:table-cell">{row.total_client_points.toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-sm text-right tabular-nums hidden md:table-cell">{row.total_drivers.toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-center">
                <TendenciaBadge atual={row.rides_current_month} anterior={row.rides_prev_month} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
