import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useConquistasMotorista } from "./hook_conquistas";
import { CATALOGO_CONQUISTAS } from "./constantes_conquistas";
import { Loader2, Trophy, Swords, Flame, Crown, Medal, RotateCcw, Target, Zap, Lock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Trophy, Swords, Flame, Crown, Medal, RotateCcw, Target, Zap,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | undefined;
  fontHeading?: string;
}

export default function ConquistasMotoristaSheet({ open, onOpenChange, customerId, fontHeading }: Props) {
  const { data: conquistas, isLoading } = useConquistasMotorista(customerId);

  const unlockedKeys = new Set(conquistas?.map((c) => c.achievementKey) ?? []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl px-4 pb-8">
        <SheetHeader className="pb-3">
          <SheetTitle className="flex items-center gap-2 text-base" style={{ fontFamily: fontHeading || "inherit" }}>
            <Trophy className="h-5 w-5 text-amber-500" />
            Conquistas
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[calc(85vh-80px)]">
            {CATALOGO_CONQUISTAS.map((def) => {
              const unlocked = unlockedKeys.has(def.key);
              const achievement = conquistas?.find((c) => c.achievementKey === def.key);
              const IconComp = ICON_MAP[def.iconName] ?? Trophy;

              return (
                <div
                  key={def.key}
                  className={`relative rounded-2xl border p-4 flex flex-col items-center text-center gap-2 transition-all ${
                    unlocked
                      ? "border-amber-500/40 bg-amber-500/5"
                      : "border-border bg-muted/30 opacity-50"
                  }`}
                >
                  <div
                    className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      unlocked
                        ? "bg-amber-500/20 text-amber-500"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {unlocked ? (
                      <IconComp className="h-6 w-6" />
                    ) : (
                      <Lock className="h-5 w-5" />
                    )}
                  </div>

                  <p className="text-xs font-bold text-foreground leading-tight">{def.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{def.description}</p>

                  {unlocked && achievement?.achievedAt && (
                    <p className="text-[9px] text-amber-600 font-medium mt-auto">
                      {format(new Date(achievement.achievedAt), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
