import { useState } from "react";
import { useBrand } from "@/contexts/BrandContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Locate, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function BranchSelector() {
  const { brand, branches, selectedBranch, setSelectedBranch, detectBranchByLocation, theme } =
    useBrand();
  const [detecting, setDetecting] = useState(false);

  if (!brand || branches.length <= 1 || selectedBranch) return null;

  const handleDetect = async () => {
    setDetecting(true);
    const nearest = await detectBranchByLocation();
    if (nearest) {
      setSelectedBranch(nearest);
      toast.success(`Filial detectada: ${nearest.name}`);
    } else {
      toast.error("Não foi possível detectar sua localização. Selecione manualmente.");
    }
    setDetecting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {theme?.logo_url && (
            <img
              src={theme.logo_url}
              alt={theme.display_name || brand.name}
              className="h-12 mx-auto mb-3 object-contain"
            />
          )}
          <CardTitle className="text-xl">Selecione sua filial</CardTitle>
          <p className="text-sm text-muted-foreground">
            {theme?.display_name || brand.name}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="secondary"
            className="w-full gap-2"
            onClick={handleDetect}
            disabled={detecting}
          >
            {detecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Locate className="h-4 w-4" />
            )}
            Detectar filial mais próxima
          </Button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou escolha</span>
            </div>
          </div>

          {branches.map((branch) => (
            <Button
              key={branch.id}
              variant="outline"
              className="w-full justify-start gap-2 h-auto py-3"
              onClick={() => setSelectedBranch(branch)}
            >
              <MapPin className="h-4 w-4 shrink-0" />
              <div className="text-left">
                <div className="font-medium">{branch.name}</div>
                {(branch.city || branch.state) && (
                  <div className="text-xs text-muted-foreground">
                    {[branch.city, branch.state].filter(Boolean).join(" - ")}
                  </div>
                )}
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
