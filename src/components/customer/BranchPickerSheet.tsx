import { useMemo, useState } from "react";
import { useBrand } from "@/contexts/BrandContext";
import { MapPin, ChevronRight, Navigation, Check } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

type Branch = Tables<"branches">;

interface GroupedBranches {
  [state: string]: {
    [city: string]: Branch[];
  };
}

export default function BranchPickerSheet() {
  const { branches, selectedBranch, setSelectedBranch, detectBranchByLocation, theme } = useBrand();
  const [open, setOpen] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const primaryColor = theme?.colors?.primary ? `hsl(${theme.colors.primary})` : "hsl(var(--primary))";
  const fg = theme?.colors?.foreground ? `hsl(${theme.colors.foreground})` : "hsl(var(--foreground))";

  // Group branches by state > city
  const grouped = useMemo<GroupedBranches>(() => {
    const map: GroupedBranches = {};
    for (const branch of branches) {
      const state = branch.state || "Outros";
      const city = branch.city || "Sem cidade";
      if (!map[state]) map[state] = {};
      if (!map[state][city]) map[state][city] = [];
      map[state][city].push(branch);
    }
    return map;
  }, [branches]);

  const sortedStates = useMemo(() => Object.keys(grouped).sort(), [grouped]);

  const displayLabel = selectedBranch?.city || "Selecionar cidade";

  const handleDetectLocation = async () => {
    setDetecting(true);
    const branch = await detectBranchByLocation();
    if (branch) {
      await setSelectedBranch(branch);
      setOpen(false);
    }
    setDetecting(false);
  };

  const handleSelect = (branch: Branch) => {
    setSelectedBranch(branch);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-colors active:scale-95"
          style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
        >
          <MapPin className="h-3 w-3" />
          <span className="font-medium max-w-[100px] truncate">{displayLabel}</span>
          <ChevronRight className="h-3 w-3 opacity-50" />
        </button>
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-[20px] max-h-[80vh] pb-8">
        <SheetHeader className="pb-3">
          <SheetTitle className="text-lg font-bold">Escolha sua cidade</SheetTitle>
        </SheetHeader>

        {/* Auto-detect button */}
        <button
          onClick={handleDetectLocation}
          disabled={detecting}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-4 transition-colors active:scale-[0.98]"
          style={{ backgroundColor: `${primaryColor}08` }}
        >
          <div
            className="h-9 w-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <Navigation className="h-4 w-4" style={{ color: primaryColor }} />
          </div>
          <div className="text-left flex-1">
            <span className="text-sm font-semibold block" style={{ color: fg }}>
              {detecting ? "Detectando..." : "Usar minha localização"}
            </span>
            <span className="text-[11px] opacity-50">Encontrar filial mais próxima</span>
          </div>
        </button>

        {/* Branches list grouped by state > city */}
        <div className="overflow-y-auto max-h-[50vh] space-y-4">
          {sortedStates.map((state) => {
            const cities = grouped[state];
            const sortedCities = Object.keys(cities).sort();

            return (
              <div key={state}>
                <div className="text-[10px] font-bold uppercase tracking-widest px-2 mb-2 opacity-40">
                  {state}
                </div>
                {sortedCities.map((city) => {
                  const cityBranches = cities[city];
                  return (
                    <div key={city}>
                      {cityBranches.map((branch) => {
                        const isSelected = selectedBranch?.id === branch.id;
                        return (
                          <button
                            key={branch.id}
                            onClick={() => handleSelect(branch)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all active:scale-[0.98]"
                            style={{
                              backgroundColor: isSelected ? `${primaryColor}10` : "transparent",
                            }}
                          >
                            <MapPin
                              className="h-4 w-4 flex-shrink-0"
                              style={{ color: isSelected ? primaryColor : `${fg}40` }}
                            />
                            <div className="text-left flex-1">
                              <span
                                className="text-sm font-medium block"
                                style={{ color: isSelected ? primaryColor : fg }}
                              >
                                {city}
                              </span>
                              <span className="text-[11px] opacity-40">
                                {state !== "Outros" ? state : ""}
                              </span>
                            </div>
                            {isSelected && (
                              <Check className="h-4 w-4" style={{ color: primaryColor }} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
