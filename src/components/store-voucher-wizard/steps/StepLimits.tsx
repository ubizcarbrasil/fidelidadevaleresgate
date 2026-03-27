import { StoreVoucherData } from "../types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Truck } from "lucide-react";

interface Props {
  data: StoreVoucherData;
  update: (p: Partial<StoreVoucherData>) => void;
}

export default function StepLimits({ data, update }: Props) {
  return (
    <div className="space-y-6">
      <Label className="text-base font-semibold">Restrições e Limites</Label>

      <div className="space-y-3">
        <Label>Quantidade disponível</Label>
        <div className="flex items-center gap-3">
          <Input
            type="number" min={1}
            value={data.max_total_uses ?? ""}
            onChange={(e) => update({ max_total_uses: e.target.value ? Number(e.target.value) : null })}
            disabled={data.unlimited_total}
            className="max-w-[150px]"
          />
          <div className="flex items-center gap-2">
            <Checkbox
              checked={data.unlimited_total}
              onCheckedChange={(v) => update({ unlimited_total: !!v, max_total_uses: v ? null : 100 })}
            />
            <span className="text-sm">Ilimitado</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Uso máximo por cliente</Label>
        <div className="flex items-center gap-3">
          <Input
            type="number" min={1}
            value={data.max_uses_per_customer ?? ""}
            onChange={(e) => update({ max_uses_per_customer: e.target.value ? Number(e.target.value) : null })}
            disabled={data.unlimited_per_customer}
            className="max-w-[150px]"
          />
          <div className="flex items-center gap-2">
            <Checkbox
              checked={data.unlimited_per_customer}
              onCheckedChange={(v) => update({ unlimited_per_customer: !!v, max_uses_per_customer: v ? null : 1 })}
            />
            <span className="text-sm">Ilimitado</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Intervalo entre usos (dias)</Label>
        <div className="flex items-center gap-3">
          <Input
            type="number" min={1}
            value={data.interval_between_uses_days ?? ""}
            onChange={(e) => update({ interval_between_uses_days: e.target.value ? Number(e.target.value) : null })}
            disabled={data.no_interval}
            className="max-w-[150px]"
          />
          <div className="flex items-center gap-2">
            <Checkbox
              checked={data.no_interval}
              onCheckedChange={(v) => update({ no_interval: !!v, interval_between_uses_days: v ? null : 7 })}
            />
            <span className="text-sm">Sem intervalo</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-border">
        <div className="flex items-center gap-3">
          <Switch
            checked={data.driver_only}
            onCheckedChange={(v) => update({ driver_only: !!v })}
          />
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            <div>
              <span className="text-sm font-medium">Exclusivo para motoristas</span>
              <p className="text-xs text-muted-foreground">Apenas motoristas identificados poderão ver e resgatar esta oferta</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
