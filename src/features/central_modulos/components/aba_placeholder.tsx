import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface Props {
  titulo: string;
  fase: string;
}

export default function AbaPlaceholder({ titulo, fase }: Props) {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <Construction className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-1">{titulo}</h3>
        <p className="text-sm text-muted-foreground">Disponível na próxima atualização ({fase}).</p>
      </CardContent>
    </Card>
  );
}
