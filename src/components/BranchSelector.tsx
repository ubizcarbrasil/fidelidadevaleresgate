import { useBrand } from "@/contexts/BrandContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export default function BranchSelector() {
  const { brand, branches, selectedBranch, setSelectedBranch } = useBrand();

  if (!brand || branches.length <= 1 || selectedBranch) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Selecione sua filial</CardTitle>
          <p className="text-sm text-muted-foreground">{brand.name}</p>
        </CardHeader>
        <CardContent className="space-y-2">
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
