import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Package, Coins } from "lucide-react";
import { formatarPreco, formatarPontos } from "../utils/utilitarios_pacotes";
import { useAtualizarPacote } from "../hooks/hook_pacotes_pontos";

interface Pacote {
  id: string;
  name: string;
  points_amount: number;
  price_cents: number;
  description: string | null;
  is_active: boolean;
}

export function ListaPacotes({ pacotes }: { pacotes: Pacote[] }) {
  const atualizarPacote = useAtualizarPacote();

  if (pacotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Package className="h-12 w-12 mb-4 opacity-40" />
        <p className="text-lg font-medium">Nenhum pacote criado</p>
        <p className="text-sm">Crie seu primeiro pacote de pontos para começar a vender.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {pacotes.map((pkg) => (
        <Card key={pkg.id} className={`transition-opacity ${!pkg.is_active ? "opacity-50" : ""}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">{pkg.name}</CardTitle>
            <Switch
              checked={pkg.is_active}
              onCheckedChange={(checked) => atualizarPacote.mutate({ id: pkg.id, is_active: checked })}
            />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              <span className="text-lg font-bold">{formatarPontos(pkg.points_amount)}</span>
            </div>
            <div className="text-2xl font-bold text-primary">{formatarPreco(pkg.price_cents)}</div>
            {pkg.description && <p className="text-sm text-muted-foreground">{pkg.description}</p>}
            <Badge variant={pkg.is_active ? "default" : "secondary"}>
              {pkg.is_active ? "Ativo" : "Inativo"}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
