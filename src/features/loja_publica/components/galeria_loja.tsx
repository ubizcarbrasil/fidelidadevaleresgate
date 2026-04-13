import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image } from "lucide-react";

interface GaleriaLojaProps {
  fotos: string[] | null;
}

export default function GaleriaLoja({ fotos }: GaleriaLojaProps) {
  if (!fotos || fotos.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Image className="h-4 w-4 text-primary" /> Fotos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {fotos.map((url, i) => (
            <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
              <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
