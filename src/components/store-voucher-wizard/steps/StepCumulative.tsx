import { StoreVoucherData } from "../types";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Props {
  data: StoreVoucherData;
  update: (p: Partial<StoreVoucherData>) => void;
}

export default function StepCumulative({ data, update }: Props) {
  return (
    <div className="space-y-6">
      <Label className="text-base font-semibold">Cupom Cumulativo</Label>
      <p className="text-sm text-muted-foreground">Este cupom pode ser usado junto com outras promoções?</p>

      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          <p className="font-medium">Cumulativo com outras promoções</p>
          <p className="text-sm text-muted-foreground">
            {data.is_cumulative
              ? "O cliente pode usar junto com outros cupons"
              : "Não pode ser combinado com outras promoções"}
          </p>
        </div>
        <Switch
          checked={data.is_cumulative}
          onCheckedChange={(v) => update({ is_cumulative: v })}
        />
      </div>
    </div>
  );
}
