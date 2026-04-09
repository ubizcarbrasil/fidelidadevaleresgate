import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, Package, ShoppingCart, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { usePacotesDisponiveis, useMeusPedidos, useComprarPacote } from "./hooks/hook_loja_pacotes";
import { formatarPreco, formatarPontos, statusLabel, statusVariant } from "./utils/utilitarios_pacotes";

function VitrinePacotes() {
  const { packages, isLoading } = usePacotesDisponiveis();
  const comprar = useComprarPacote();

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (packages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Package className="h-12 w-12 mb-4 opacity-40" />
        <p className="text-lg font-medium">Nenhum pacote disponível</p>
        <p className="text-sm">O empreendedor ainda não criou pacotes de pontos.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {packages.map((pkg: any) => (
        <Card key={pkg.id} className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{pkg.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                <span className="text-lg font-bold">{formatarPontos(pkg.points_amount)}</span>
              </div>
              <div className="text-2xl font-bold text-primary">{formatarPreco(pkg.price_cents)}</div>
              {pkg.description && <p className="text-sm text-muted-foreground">{pkg.description}</p>}
            </div>
            <Button
              className="w-full"
              onClick={() => comprar.mutate({ id: pkg.id, points_amount: pkg.points_amount, price_cents: pkg.price_cents })}
              disabled={comprar.isPending}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {comprar.isPending ? "Enviando..." : "Comprar"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MeusPedidos() {
  const { orders, isLoading } = useMeusPedidos();

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Nenhum pedido realizado.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pacote</TableHead>
          <TableHead>Pontos</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Data</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((o: any) => (
          <TableRow key={o.id}>
            <TableCell className="font-medium">{o.points_packages?.name || "—"}</TableCell>
            <TableCell>{formatarPontos(o.points_amount)}</TableCell>
            <TableCell>{formatarPreco(o.price_cents)}</TableCell>
            <TableCell><Badge variant={statusVariant(o.status)}>{statusLabel(o.status)}</Badge></TableCell>
            <TableCell>{format(new Date(o.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function PaginaLojaPacotes() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Comprar Pontos</h1>
        <p className="text-sm text-muted-foreground">Adquira pacotes de pontos para sua cidade</p>
      </div>

      <Tabs defaultValue="vitrine">
        <TabsList>
          <TabsTrigger value="vitrine" className="gap-2"><Package className="h-4 w-4" />Pacotes Disponíveis</TabsTrigger>
          <TabsTrigger value="pedidos" className="gap-2"><ShoppingCart className="h-4 w-4" />Meus Pedidos</TabsTrigger>
        </TabsList>
        <TabsContent value="vitrine" className="mt-4"><VitrinePacotes /></TabsContent>
        <TabsContent value="pedidos" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Histórico de Pedidos</CardTitle></CardHeader>
            <CardContent><MeusPedidos /></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
