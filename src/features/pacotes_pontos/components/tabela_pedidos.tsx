import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { format } from "date-fns";
import { formatarPreco, formatarPontos, statusLabel, statusVariant } from "../utils/utilitarios_pacotes";
import { useConfirmarPedido, useCancelarPedido } from "../hooks/hook_pacotes_pontos";

interface Pedido {
  id: string;
  points_amount: number;
  price_cents: number;
  status: string;
  created_at: string;
  confirmed_at: string | null;
  points_packages: { name: string } | null;
  branches: { name: string } | null;
}

export function TabelaPedidos({ pedidos }: { pedidos: Pedido[] }) {
  const confirmar = useConfirmarPedido();
  const cancelar = useCancelarPedido();

  if (pedidos.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Nenhum pedido registrado.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pacote</TableHead>
          <TableHead>Cidade</TableHead>
          <TableHead>Pontos</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pedidos.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">{p.points_packages?.name || "—"}</TableCell>
            <TableCell>{p.branches?.name || "—"}</TableCell>
            <TableCell>{formatarPontos(p.points_amount)}</TableCell>
            <TableCell>{formatarPreco(p.price_cents)}</TableCell>
            <TableCell>
              <Badge variant={statusVariant(p.status)}>{statusLabel(p.status)}</Badge>
            </TableCell>
            <TableCell>{format(new Date(p.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
            <TableCell>
              {p.status === "PENDING" && (
                <div className="flex gap-1">
                  <Button size="sm" variant="default" onClick={() => confirmar.mutate(p.id)} disabled={confirmar.isPending}>
                    <Check className="h-3 w-3 mr-1" />Confirmar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => cancelar.mutate(p.id)} disabled={cancelar.isPending}>
                    <X className="h-3 w-3 mr-1" />Cancelar
                  </Button>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
