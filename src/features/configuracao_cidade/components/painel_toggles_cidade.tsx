import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { TOGGLES_CIDADE } from "../constants/constantes_toggles";
import { Loader2 } from "lucide-react";

interface Props {
  config: Record<string, boolean>;
  onToggle: (key: string, value: boolean) => void;
  isSaving: boolean;
}

export function PainelTogglesCidade({ config, onToggle, isSaving }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {TOGGLES_CIDADE.map((toggle) => {
        const ativo = config[toggle.key] ?? false;
        const Icon = toggle.icon;

        return (
          <Card key={toggle.key} className="border border-border/50 bg-card/50">
            <CardContent className="flex items-start gap-3 p-4">
              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ativo ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"} transition-colors`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">{toggle.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{toggle.descricao}</p>
              </div>
              <Switch
                checked={ativo}
                onCheckedChange={(val) => onToggle(toggle.key, val)}
                disabled={isSaving}
                className="shrink-0 mt-0.5"
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
