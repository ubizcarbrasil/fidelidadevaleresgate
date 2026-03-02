import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import BadgeConfigEditor from "@/components/BadgeConfigEditor";
import { StoreVoucherData } from "../types";

interface Props {
  data: StoreVoucherData;
  update: (partial: Partial<StoreVoucherData>) => void;
}

export default function StepBadge({ data, update }: Props) {
  const [customBadge, setCustomBadge] = useState(!!data.badge_config);

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Etiqueta do Cupom</Label>
      <p className="text-sm text-muted-foreground">
        Personalize a etiqueta que aparece sobre a imagem do cupom no app. Se desativado, será usado o padrão da marca.
      </p>

      <div className="flex items-center gap-3">
        <Switch
          checked={customBadge}
          onCheckedChange={(checked) => {
            setCustomBadge(checked);
            if (!checked) update({ badge_config: null });
            else update({ badge_config: data.badge_config || {} });
          }}
        />
        <span className="text-sm">Usar etiqueta personalizada para este cupom</span>
      </div>

      {customBadge && (
        <BadgeConfigEditor
          value={data.badge_config || {}}
          onChange={(badge_config) => update({ badge_config })}
        />
      )}
    </div>
  );
}
