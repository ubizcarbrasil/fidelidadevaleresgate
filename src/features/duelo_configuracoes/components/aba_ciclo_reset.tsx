import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Calendar, Play, Loader2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useSalvarConfigDuelo } from "../hooks/hook_config_duelo_avancada";
import PreviewProximoReset from "./preview_proximo_reset";
import HistoricoResets from "./historico_resets";
import { ACOES_RESET, FREQUENCIAS_RESET, type AcaoReset, type FrequenciaReset } from "../constants/constantes_configuracao_duelo";
import { schemaCicloReset } from "../schemas/schema_ciclo_reset";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props { branchId: string; brandId: string; settings: Record<string, any>; }

export default function AbaCicloReset({ branchId, brandId, settings }: Props) {
  const [enabled, setEnabled] = useState<boolean>(settings.duel_cycle_reset_enabled === true);
  const [freq, setFreq] = useState<FrequenciaReset>((settings.duel_cycle_frequency as FrequenciaReset) ?? "monthly");
  const [day, setDay] = useState<number>(Number(settings.duel_cycle_day ?? 1));
  const [action, setAction] = useState<AcaoReset>((settings.duel_cycle_action as AcaoReset) ?? "no_zero");
  const [initialPoints, setInitialPoints] = useState<number>(Number(settings.duel_cycle_initial_points ?? 1000));
  const elig = settings.duel_cycle_eligibility_json ?? {};
  const [onlyActive, setOnlyActive] = useState<boolean>(elig.only_active !== false);
  const [minRides, setMinRides] = useState<number>(Number(elig.min_rides_prev_period ?? 0));
  const [confirmManual, setConfirmManual] = useState(false);
  const [executando, setExecutando] = useState(false);

  const salvar = useSalvarConfigDuelo(branchId, settings);

  const handleSalvar = () => {
    const payload = {
      duel_cycle_reset_enabled: enabled,
      duel_cycle_frequency: freq,
      duel_cycle_day: day,
      duel_cycle_action: action,
      duel_cycle_initial_points: initialPoints,
      duel_cycle_eligibility_json: { min_rides_prev_period: minRides, only_active: onlyActive },
    };
    const parsed = schemaCicloReset.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    salvar.mutate(payload);
  };

  const executarManual = async () => {
    setExecutando(true);
    try {
      const { data, error } = await supabase.functions.invoke("reset-duelo-ciclo", {
        body: { branch_id: branchId },
        headers: { "x-trigger": "manual" },
      });
      if (error) throw error;
      const summary = (data as any)?.summary?.[0];
      toast.success(`Reset executado: ${summary?.drivers ?? 0} motoristas, ${(summary?.distributed ?? 0).toLocaleString("pt-BR")} pontos`);
    } catch (err: any) {
      toast.error(err?.message ?? "Falha ao executar reset");
    } finally {
      setExecutando(false);
      setConfirmManual(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Ciclo & Reset
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Ativar reset automático</p>
              <p className="text-xs text-muted-foreground">Aplica a regra abaixo periodicamente.</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Frequência</Label>
              <Select value={freq} onValueChange={(v) => setFreq(v as FrequenciaReset)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FREQUENCIAS_RESET.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">
                {freq === "weekly" ? "Dia da semana (1=Seg, 7=Dom)" : freq === "daily" ? "(N/A para diário)" : "Dia do mês (1-28)"}
              </Label>
              <Input
                type="number"
                min={1}
                max={freq === "weekly" ? 7 : 28}
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                disabled={freq === "daily"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Ação no reset</Label>
            <RadioGroup value={action} onValueChange={(v) => setAction(v as AcaoReset)} className="grid gap-2 sm:grid-cols-2">
              {ACOES_RESET.map((a) => (
                <label key={a.value} htmlFor={`act-${a.value}`} className="flex items-start gap-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/40">
                  <RadioGroupItem id={`act-${a.value}`} value={a.value} className="mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{a.label}</p>
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Pontos iniciais creditados a cada motorista</Label>
            <Input type="number" min={0} value={initialPoints} onChange={(e) => setInitialPoints(Number(e.target.value))} />
          </div>

          <div className="space-y-3 rounded-lg border p-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Quem recebe</p>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Apenas motoristas ativos</Label>
              <Switch checked={onlyActive} onCheckedChange={setOnlyActive} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mín. corridas nos últimos 30 dias (0 = sem filtro)</Label>
              <Input type="number" min={0} value={minRides} onChange={(e) => setMinRides(Number(e.target.value))} />
            </div>
          </div>

          <PreviewProximoReset
            branchId={branchId}
            brandId={brandId}
            onlyActive={onlyActive}
            minRides={minRides}
            initialPoints={initialPoints}
            action={action}
          />

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleSalvar} disabled={salvar.isPending} className="flex-1 sm:flex-none">
              <Save className="h-4 w-4 mr-2" />
              {salvar.isPending ? "Salvando..." : "Salvar configuração"}
            </Button>
            <Button variant="outline" onClick={() => setConfirmManual(true)} disabled={executando} className="flex-1 sm:flex-none">
              {executando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Executar reset agora
            </Button>
          </div>
        </CardContent>
      </Card>

      <HistoricoResets branchId={branchId} />

      <ConfirmDialog
        open={confirmManual}
        title="Executar reset agora?"
        description={`Esta ação ${action !== "no_zero" ? "ZERARÁ saldo conforme a regra escolhida e " : ""}creditará ${initialPoints.toLocaleString("pt-BR")} pontos para os motoristas elegíveis. Não pode ser desfeita.`}
        confirmLabel="Sim, executar"
        onConfirm={executarManual}
        onClose={() => setConfirmManual(false)}
      />
    </div>
  );
}