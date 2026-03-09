import { useState } from "react";
import { useBrand } from "@/contexts/BrandContext";
import { MapPin, Locate, Loader2 } from "lucide-react";
import { toast } from "sonner";

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

function withAlpha(hslColor: string, alpha: number): string {
  const inner = hslColor.match(/hsl\((.+)\)/)?.[1];
  if (!inner) return hslColor;
  return `hsl(${inner} / ${alpha})`;
}

export default function BranchSelector() {
  const { brand, branches, selectedBranch, setSelectedBranch, detectBranchByLocation, theme } =
    useBrand();
  const [detecting, setDetecting] = useState(false);

  if (!brand || branches.length <= 1 || selectedBranch) return null;

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";
  const displayName = theme?.display_name || brand.name;

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
    <div className="min-h-screen flex items-center justify-center px-5 bg-background">
      <div
        className="w-full max-w-sm rounded-[24px] p-7 bg-card"
        style={{ boxShadow: "0 4px 24px hsl(var(--foreground) / 0.06)" }}
      >
        <div className="text-center mb-6">
          {theme?.logo_url && (
            <img
              src={theme.logo_url}
              alt={displayName}
              className="h-14 mx-auto mb-4 object-contain"
            />
          )}
          <h1 className="text-xl font-bold" style={{ fontFamily: fontHeading }}>
            Selecione sua filial
          </h1>
          <p className="text-sm mt-1 text-muted-foreground">
            {displayName}
          </p>
        </div>

        <button
          onClick={handleDetect}
          disabled={detecting}
          className="w-full flex items-center justify-center gap-2 rounded-2xl h-12 font-semibold text-sm transition-all mb-5"
          style={{
            backgroundColor: withAlpha(primary, 0.1),
            color: primary,
          }}
        >
          {detecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Locate className="h-4 w-4" />
          )}
          Detectar filial mais próxima
        </button>

        <div className="relative py-2 mb-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
            <span className="bg-card px-3 text-muted-foreground">ou escolha</span>
          </div>
        </div>

        <div className="space-y-2">
          {branches.map((branch) => (
            <button
              key={branch.id}
              onClick={() => setSelectedBranch(branch)}
              className="w-full flex items-center gap-3 rounded-[14px] p-3.5 text-left transition-all bg-muted"
            >
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: withAlpha(primary, 0.12) }}
              >
                <MapPin className="h-4 w-4" style={{ color: primary }} />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm">{branch.name}</div>
                {(branch.city || branch.state) && (
                  <div className="text-xs text-muted-foreground">
                    {[branch.city, branch.state].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}