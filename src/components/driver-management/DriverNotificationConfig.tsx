import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, CheckCircle, Clock, Hash, Zap, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type FrequencyType = "EVERY_RIDE" | "DAILY" | "EVERY_X_HOURS" | "EVERY_X_RIDES" | "EVERY_X_POINTS";

const FREQUENCY_OPTIONS: { value: FrequencyType; label: string; description: string; icon: typeof Zap }[] = [
  { value: "EVERY_RIDE", label: "A cada corrida", description: "Envia mensagem após cada corrida finalizada", icon: Zap },
  { value: "DAILY", label: "1 vez por dia", description: "Resumo diário no horário definido", icon: Clock },
  { value: "EVERY_X_HOURS", label: "A cada X horas", description: "Agrupa corridas do intervalo e envia resumo", icon: Clock },
  { value: "EVERY_X_RIDES", label: "A cada X corridas", description: "Envia resumo ao atingir o número de corridas", icon: Hash },
  { value: "EVERY_X_POINTS", label: "A cada X pontos", description: "Envia resumo ao acumular a quantidade de pontos", icon: Hash },
];

interface Props {
  brandId: string;
  branchId?: string | null;
}

export default function DriverNotificationConfig({ brandId, branchId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: integration, isLoading } = useQuery({
    queryKey: ["driver-notification-config", brandId, branchId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("machine_integrations")
        .select("id, driver_message_enabled, driver_message_frequency, driver_message_frequency_value")
        .eq("brand_id", brandId)
        .eq("is_active", true);

      if (branchId) q = q.eq("branch_id", branchId);

      const { data, error } = await q.limit(1).maybeSingle();
      if (error) throw error;
      return data as {
        id: string;
        driver_message_enabled: boolean;
        driver_message_frequency: FrequencyType;
        driver_message_frequency_value: number | null;
      } | null;
    },
    enabled: !!brandId,
  });

  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequency] = useState<FrequencyType>("EVERY_RIDE");
  const [frequencyValue, setFrequencyValue] = useState<string>("");

  useEffect(() => {
    if (!integration) return;
    setEnabled(integration.driver_message_enabled ?? false);
    setFrequency(integration.driver_message_frequency ?? "EVERY_RIDE");
    const val = integration.driver_message_frequency_value;
    if (frequency === "DAILY" && val != null) {
      const hours = Math.floor(val / 60);
      const mins = val % 60;
      setFrequencyValue(`${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`);
    } else {
      setFrequencyValue(val != null ? String(val) : "");
    }
  }, [integration?.id, integration?.driver_message_enabled, integration?.driver_message_frequency, integration?.driver_message_frequency_value]);

  const saveField = async (fields: Record<string, any>) => {
    if (!integration?.id) return;
    const { error } = await (supabase as any)
      .from("machine_integrations")
      .update(fields)
      .eq("id", integration.id);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return false;
    }
    queryClient.invalidateQueries({ queryKey: ["driver-notification-config"] });
    queryClient.invalidateQueries({ queryKey: ["machine-integrations"] });
    return true;
  };

  const handleToggle = async (val: boolean) => {
    setEnabled(val);
    const ok = await saveField({ driver_message_enabled: val });
    if (!ok) setEnabled(!val);
    else toast({ title: val ? "Notificação ativada" : "Notificação desativada" });
  };

  const handleFrequencyChange = async (val: FrequencyType) => {
    const prev = frequency;
    setFrequency(val);
    let defaultValue: number | null = null;
    if (val === "DAILY") { defaultValue = 1080; setFrequencyValue("18:00"); }
    else if (val === "EVERY_X_HOURS") { defaultValue = 4; setFrequencyValue("4"); }
    else if (val === "EVERY_X_RIDES") { defaultValue = 5; setFrequencyValue("5"); }
    else if (val === "EVERY_X_POINTS") { defaultValue = 50; setFrequencyValue("50"); }
    else { setFrequencyValue(""); }

    const ok = await saveField({ driver_message_frequency: val, driver_message_frequency_value: defaultValue });
    if (!ok) setFrequency(prev);
  };

  const handleValueChange = async (raw: string) => {
    setFrequencyValue(raw);
  };

  const handleValueBlur = async () => {
    if (!integration?.id) return;
    let numericValue: number | null = null;

    if (frequency === "DAILY") {
      const [h, m] = frequencyValue.split(":").map(Number);
      if (!isNaN(h) && !isNaN(m)) numericValue = h * 60 + m;
    } else if (frequency === "EVERY_X_HOURS") {
      const n = parseInt(frequencyValue);
      if (!isNaN(n) && n >= 1 && n <= 24) numericValue = n;
    } else if (frequency === "EVERY_X_RIDES") {
      const n = parseInt(frequencyValue);
      if (!isNaN(n) && n >= 2 && n <= 50) numericValue = n;
    } else if (frequency === "EVERY_X_POINTS") {
      const n = parseInt(frequencyValue);
      if (!isNaN(n) && n >= 10 && n <= 500) numericValue = n;
    }

    if (numericValue != null) {
      await saveField({ driver_message_frequency_value: numericValue });
      toast({ title: "Configuração salva" });
    }
  };

  if (isLoading) return <Skeleton className="h-20 w-full rounded-lg" />;
  if (!integration) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-medium">Notificação ao motorista no app</p>
            <p className="text-xs text-muted-foreground">
              Mensagem automática via TaxiMachine informando pontos ganhos.
            </p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={handleToggle} />
      </div>

      {enabled && (
        <div className="space-y-3 pl-1">
          <Label className="text-xs text-muted-foreground">Frequência de envio</Label>
          <RadioGroup value={frequency} onValueChange={(v) => handleFrequencyChange(v as FrequencyType)} className="space-y-2">
            {FREQUENCY_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                    frequency === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <RadioGroupItem value={opt.value} className="mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>

                    {/* Conditional input fields */}
                    {frequency === opt.value && opt.value === "DAILY" && (
                      <div className="pt-2">
                        <Label className="text-xs text-muted-foreground">Horário de envio</Label>
                        <Input
                          type="time"
                          value={frequencyValue}
                          onChange={(e) => handleValueChange(e.target.value)}
                          onBlur={handleValueBlur}
                          className="w-32 mt-1 h-8 text-sm"
                        />
                      </div>
                    )}
                    {frequency === opt.value && opt.value === "EVERY_X_HOURS" && (
                      <div className="pt-2">
                        <Label className="text-xs text-muted-foreground">Intervalo em horas (1–24)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={24}
                          value={frequencyValue}
                          onChange={(e) => handleValueChange(e.target.value)}
                          onBlur={handleValueBlur}
                          className="w-24 mt-1 h-8 text-sm"
                        />
                      </div>
                    )}
                    {frequency === opt.value && opt.value === "EVERY_X_RIDES" && (
                      <div className="pt-2">
                        <Label className="text-xs text-muted-foreground">Nº de corridas (2–50)</Label>
                        <Input
                          type="number"
                          min={2}
                          max={50}
                          value={frequencyValue}
                          onChange={(e) => handleValueChange(e.target.value)}
                          onBlur={handleValueBlur}
                          className="w-24 mt-1 h-8 text-sm"
                        />
                      </div>
                    )}
                    {frequency === opt.value && opt.value === "EVERY_X_POINTS" && (
                      <div className="pt-2">
                        <Label className="text-xs text-muted-foreground">Quantidade de pontos (10–500)</Label>
                        <Input
                          type="number"
                          min={10}
                          max={500}
                          value={frequencyValue}
                          onChange={(e) => handleValueChange(e.target.value)}
                          onBlur={handleValueBlur}
                          className="w-24 mt-1 h-8 text-sm"
                        />
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </RadioGroup>

          {frequency !== "EVERY_RIDE" && (
            <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 flex items-start gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Modelo do resumo: "Oi {'{'} nome{'}'}! Hoje você fez {'{'} total_corridas{'}'} corridas e acumulou +{'{'} pontos{'}'} pontos. Seu saldo agora é {'{'} saldo{'}'} pts."
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
