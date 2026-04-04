import { Clock, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export interface DayHours {
  day: string;
  open: string;
  close: string;
  is_open: boolean;
}

const DEFAULT_DAYS: DayHours[] = [
  { day: "Segunda", open: "08:00", close: "18:00", is_open: true },
  { day: "Terça", open: "08:00", close: "18:00", is_open: true },
  { day: "Quarta", open: "08:00", close: "18:00", is_open: true },
  { day: "Quinta", open: "08:00", close: "18:00", is_open: true },
  { day: "Sexta", open: "08:00", close: "18:00", is_open: true },
  { day: "Sábado", open: "09:00", close: "14:00", is_open: true },
  { day: "Domingo", open: "", close: "", is_open: false },
];

interface Props {
  value: DayHours[];
  onChange: (hours: DayHours[]) => void;
}

export default function OperatingHoursEditor({ value, onChange }: Props) {
  const hours = value.length > 0 ? value : DEFAULT_DAYS;

  const initIfEmpty = () => {
    if (value.length === 0) onChange(DEFAULT_DAYS);
  };

  const update = (idx: number, field: keyof DayHours, val: string | boolean) => {
    const next = hours.map((h, i) => (i === idx ? { ...h, [field]: val } : h));
    onChange(next);
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" /> Horário de Funcionamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {value.length === 0 && (
          <Button variant="outline" size="sm" onClick={initIfEmpty} className="w-full mb-2">
            <Plus className="h-4 w-4 mr-1" /> Configurar horários
          </Button>
        )}
        {value.length > 0 && hours.map((h, idx) => (
          <div key={h.day} className="flex items-center gap-3 rounded-xl border p-3">
            <div className="w-20">
              <p className="text-sm font-medium">{h.day}</p>
            </div>
            <Switch
              checked={h.is_open}
              onCheckedChange={(v) => update(idx, "is_open", v)}
            />
            {h.is_open ? (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  type="time"
                  value={h.open}
                  onChange={(e) => update(idx, "open", e.target.value)}
                  className="h-8 text-xs"
                />
                <span className="text-xs text-muted-foreground">às</span>
                <Input
                  type="time"
                  value={h.close}
                  onChange={(e) => update(idx, "close", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Fechado</span>
            )}
          </div>
        ))}
        {value.length > 0 && (
          <p className="text-[11px] text-muted-foreground">
            Esses horários serão exibidos no perfil público do seu estabelecimento
          </p>
        )}
      </CardContent>
    </Card>
  );
}
