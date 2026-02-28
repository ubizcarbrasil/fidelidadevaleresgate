import { StoreVoucherData } from "../types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface Props {
  data: StoreVoucherData;
  update: (p: Partial<StoreVoucherData>) => void;
}

export default function StepScheduling({ data, update }: Props) {
  return (
    <div className="space-y-6">
      <Label className="text-base font-semibold">Agendamento Prévio</Label>
      <p className="text-sm text-muted-foreground">O cliente precisa agendar antes de usar este cupom?</p>

      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          <p className="font-medium">Requer agendamento</p>
          <p className="text-sm text-muted-foreground">O cliente deve agendar com antecedência</p>
        </div>
        <Switch
          checked={data.requires_scheduling}
          onCheckedChange={(v) => update({ requires_scheduling: v })}
        />
      </div>

      {data.requires_scheduling && (
        <div className="space-y-2 pl-4 border-l-2 border-primary/30">
          <Label>Antecedência mínima (horas)</Label>
          <Input
            type="number" min={1}
            value={data.scheduling_advance_hours}
            onChange={(e) => update({ scheduling_advance_hours: Number(e.target.value) })}
            className="max-w-[150px]"
          />
          <p className="text-xs text-muted-foreground">O cliente precisará agendar com pelo menos {data.scheduling_advance_hours}h de antecedência</p>
        </div>
      )}
    </div>
  );
}
