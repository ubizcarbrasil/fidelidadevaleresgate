import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, ShoppingCart } from "lucide-react";
import { usePacotesPontos, usePacotesPontosOrders } from "./hooks/hook_pacotes_pontos";
import { DialogoCriarPacote } from "./components/dialogo_criar_pacote";
import { ListaPacotes } from "./components/lista_pacotes";
import { TabelaPedidos } from "./components/tabela_pedidos";
import { Loader2 } from "lucide-react";

export default function PaginaPacotesPontos() {
  const { packages, isLoading } = usePacotesPontos();
  const { orders, isLoading: ordersLoading } = usePacotesPontosOrders();

  const pedidosPendentes = orders.filter((o: any) => o.status === "PENDING").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pacotes de Pontos</h1>
          <p className="text-sm text-muted-foreground">Gerencie pacotes para venda às cidades</p>
        </div>
        <DialogoCriarPacote />
      </div>

      <Tabs defaultValue="pacotes">
        <TabsList>
          <TabsTrigger value="pacotes" className="gap-2">
            <Package className="h-4 w-4" />Pacotes
          </TabsTrigger>
          <TabsTrigger value="pedidos" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Pedidos
            {pedidosPendentes > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {pedidosPendentes}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pacotes" className="mt-4">
          <ListaPacotes pacotes={packages as any} />
        </TabsContent>

        <TabsContent value="pedidos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Histórico de Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <TabelaPedidos pedidos={orders as any} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
