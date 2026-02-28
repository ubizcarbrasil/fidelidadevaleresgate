import { StoreVoucherData, SpecificDay, WEEKDAY_LABELS } from "../types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  data: StoreVoucherData;
  update: (p: Partial<StoreVoucherData>) => void;
}

export default function StepSpecificDays({ data, update }: Props) {
  const addDay = () => {
    const usedDays = data.specific_days.map(d => d.weekday);
    const nextDay = [1, 2, 3, 4, 5, 6, 0].find(d => !usedDays.includes(d)) ?? 0;
    update({
      specific_days: [...data.specific_days, { weekday: nextDay, start_time: "09:00", end_time: "18:00" }],
    });
  };

  const removeDay = (idx: number) => {
    update({ specific_days: data.specific_days.filter((_, i) => i !== idx) });
  };

  const updateDay = (idx: number, field: keyof SpecificDay, value: any) => {
    update({
      specific_days: data.specific_days.map((d, i) => (i === idx ? { ...d, [field]: field === "weekday" ? Number(value) : value } : d)),
    });
  };

  return (
    <div className="space-y-6">
      <Label className="text-base font-semibold">Dias e Horários Específicos</Label>

      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          <p className="font-medium">Restringir a dias/horários</p>
          <p className="text-sm text-muted-foreground">O cupom só pode ser usado em dias e horários específicos</p>
        </div>
        <Switch
          checked={data.has_specific_days}
          onCheckedChange={(v) => {
            update({ has_specific_days: v });
            if (v && data.specific_days.length === 0) addDay();
          }}
        />
      </div>

      {data.has_specific_days && (
        <div className="space-y-3">
          {data.specific_days.map((day, idx) => (
            <div key={idx} className="flex items-center gap-2 p-3 border rounded-lg flex-wrap">
              <Select value={String(day.weekday)} onValueChange={(v) => updateDay(idx, "weekday", v)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAY_LABELS.map((label, i) => (
                    <SelectItem key={i} value={String(i)}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="time" value={day.start_time} onChange={(e) => updateDay(idx, "start_time", e.target.value)} className="w-[110px]" />
              <span className="text-sm text-muted-foreground">às</span>
              <Input type="time" value={day.end_time} onChange={(e) => updateDay(idx, "end_time", e.target.value)} className="w-[110px]" />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeDay(idx)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          {data.specific_days.length < 7 && (
            <Button type="button" variant="outline" size="sm" onClick={addDay}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar dia
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
