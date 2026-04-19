/**
 * TabelaBrandsGanhaGanha — Sub-fase 5.4
 * Lista read-only de empreendedores com Ganha-Ganha ativo.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Handshake, Inbox } from "lucide-react";
import { useBrandsWithGanhaGanha } from "@/compartilhados/hooks/hook_ganha_ganha_pricing";
import { PLANS } from "../constants/constantes_planos";

function planLabel(key: string): string {
  return PLANS.find((p) => p.key === key)?.label ?? key;
}

export default function TabelaBrandsGanhaGanha() {
  const { data, isLoading } = useBrandsWithGanhaGanha();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Handshake className="h-4 w-4" />
          Empreendedores com Ganha-Ganha ativo
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p className="text-sm">Nenhum empreendedor contratou Ganha-Ganha ainda</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Marca</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead className="text-right">Margem</TableHead>
                <TableHead className="text-right">Modelos ativos</TableHead>
                <TableHead className="text-right">Cidades c/ override</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((b) => (
                <TableRow key={b.brand_id}>
                  <TableCell className="font-medium">{b.brand_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{planLabel(b.subscription_plan)}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {b.ganha_ganha_margin_pct != null ? `${b.ganha_ganha_margin_pct}%` : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono">{b.models_active}</TableCell>
                  <TableCell className="text-right font-mono">{b.cities_with_override}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
