import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, Plus, Trash2, DoorOpen } from "lucide-react";

export type ModoRegra = "PER_REAL" | "PERCENT" | "FIXED" | "VOLUME_TIER";

export interface FaixaVolume {
  min: number;
  max: number | null;
  mode: "PER_REAL" | "FIXED" | "PERCENT";
  value: number;
}

export interface PontuacaoMotoristaState {
  rule_mode: ModoRegra;
  points_per_real: number;
  percent_of_passenger: number;
  fixed_points_per_ride: number;
  volume_tiers: FaixaVolume[];
  volume_cycle_days: number;
  is_active: boolean;
  macaneta_points_per_ride: number;
}

export const PONTUACAO_MOTORISTA_PADRAO: PontuacaoMotoristaState = {
  rule_mode: "PER_REAL",
  points_per_real: 1,
  percent_of_passenger: 50,
  fixed_points_per_ride: 10,
  volume_tiers: [
    { min: 1, max: 100, mode: "PER_REAL", value: 1 },
    { min: 101, max: 200, mode: "PER_REAL", value: 1.5 },
    { min: 201, max: null, mode: "PER_REAL", value: 2 },
  ],
  volume_cycle_days: 30,
  is_active: true,
  macaneta_points_per_ride: 0,
};

const RULE_MODES: { value: ModoRegra; label: string; desc: string }[] = [
  { value: "PER_REAL", label: "Pontos por R$ 1,00", desc: "Ex: 1.5 pts por R$" },
  { value: "PERCENT", label: "% dos pontos do passageiro", desc: "Ex: 50% do que o passageiro ganhou" },
  { value: "FIXED", label: "Pontuação fixa por corrida", desc: "Ex: 10 pts por corrida" },
  { value: "VOLUME_TIER", label: "Faixa de volume mensal", desc: "Regras por volume mensal" },
];

const TIER_MODES: { value: FaixaVolume["mode"]; label: string }[] = [
  { value: "PER_REAL", label: "Pontos/R$" },
  { value: "FIXED", label: "Fixo" },
  { value: "PERCENT", label: "%" },
];

interface Props {
  brandId: string | null;
  branchId: string | null;
  onChange: (state: PontuacaoMotoristaState | null) => void;
}

/**
 * Carrega e edita a regra de pontuação do motorista para a cidade.
 * Reutiliza a tabela existente `driver_points_rules` (chave brand_id + branch_id).
 *
 * Notifica o pai via `onChange` com o estado atual a cada alteração para que
 * o `handleSave` da tela "Editar Cidade" salve em conjunto.
 */
export default function CardPontuacaoMotorista({ brandId, branchId, onChange }: Props) {
  const [state, setState] = useState<PontuacaoMotoristaState>(PONTUACAO_MOTORISTA_PADRAO);

  const { data: regra } = useQuery({
    queryKey: ["driver-points-rule-card", brandId, branchId],
    enabled: !!brandId && !!branchId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("driver_points_rules")
        .select("*")
        .eq("brand_id", brandId!)
        .eq("branch_id", branchId!)
        .maybeSingle();
      return data as Partial<PontuacaoMotoristaState> | null;
    },
  });

  // Hydrate from DB
  useEffect(() => {
    if (!regra) return;
    setState((prev) => ({
      ...prev,
      rule_mode: (regra.rule_mode as ModoRegra) ?? prev.rule_mode,
      points_per_real: regra.points_per_real ?? prev.points_per_real,
      percent_of_passenger: regra.percent_of_passenger ?? prev.percent_of_passenger,
      fixed_points_per_ride: regra.fixed_points_per_ride ?? prev.fixed_points_per_ride,
      volume_tiers: (regra.volume_tiers as FaixaVolume[] | undefined) ?? prev.volume_tiers,
      volume_cycle_days: regra.volume_cycle_days ?? prev.volume_cycle_days,
      is_active: regra.is_active ?? prev.is_active,
      macaneta_points_per_ride: regra.macaneta_points_per_ride ?? prev.macaneta_points_per_ride,
    }));
  }, [regra]);

  // Notify parent
  useEffect(() => {
    onChange(branchId ? state : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, branchId]);

  const update = <K extends keyof PontuacaoMotoristaState>(key: K, value: PontuacaoMotoristaState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const updateTier = (i: number, field: keyof FaixaVolume, value: any) => {
    const tiers = [...state.volume_tiers];
    tiers[i] = { ...tiers[i], [field]: value };
    update("volume_tiers", tiers);
  };

  const addTier = () => {
    const tiers = [...state.volume_tiers];
    const lastMax = tiers.length > 0 ? (tiers[tiers.length - 1].max ?? 999) : 0;
    tiers.push({ min: lastMax + 1, max: null, mode: "PER_REAL", value: 1 });
    update("volume_tiers", tiers);
  };

  const removeTier = (i: number) => {
    update("volume_tiers", state.volume_tiers.filter((_, idx) => idx !== i));
  };

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-500" />
              Pontuação do Motorista
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Como o motorista desta cidade ganha pontos a cada corrida finalizada.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Label className="text-xs">{state.is_active ? "Ativa" : "Inativa"}</Label>
            <Switch checked={state.is_active} onCheckedChange={(v) => update("is_active", v)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Modo */}
        <div className="space-y-2">
          <Label className="text-xs">Modo de pontuação</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {RULE_MODES.map((mode) => (
              <button
                type="button"
                key={mode.value}
                onClick={() => update("rule_mode", mode.value)}
                className={`text-left rounded-lg border p-3 transition-all ${
                  state.rule_mode === mode.value
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <div className="text-sm font-medium">{mode.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{mode.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Config por modo */}
        {state.rule_mode === "PER_REAL" && (
          <div className="space-y-1.5 max-w-xs">
            <Label className="text-xs">Pontos por R$ 1,00</Label>
            <Input
              type="number"
              min={0}
              step={0.1}
              value={state.points_per_real}
              onChange={(e) => update("points_per_real", parseFloat(e.target.value) || 0)}
            />
          </div>
        )}

        {state.rule_mode === "PERCENT" && (
          <div className="space-y-1.5 max-w-xs">
            <Label className="text-xs">% dos pontos do passageiro</Label>
            <Input
              type="number"
              min={0}
              max={100}
              step={1}
              value={state.percent_of_passenger}
              onChange={(e) => update("percent_of_passenger", parseFloat(e.target.value) || 0)}
            />
          </div>
        )}

        {state.rule_mode === "FIXED" && (
          <div className="space-y-1.5 max-w-xs">
            <Label className="text-xs">Pontos fixos por corrida</Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={state.fixed_points_per_ride}
              onChange={(e) => update("fixed_points_per_ride", parseInt(e.target.value) || 0)}
            />
          </div>
        )}

        {state.rule_mode === "VOLUME_TIER" && (
          <div className="space-y-3">
            <div className="space-y-1.5 max-w-xs">
              <Label className="text-xs">Dias do ciclo (reset automático)</Label>
              <Input
                type="number"
                min={1}
                max={90}
                value={state.volume_cycle_days}
                onChange={(e) => update("volume_cycle_days", parseInt(e.target.value) || 30)}
              />
            </div>
            <div className="space-y-2">
              {state.volume_tiers.map((tier, i) => (
                <div key={i} className="rounded-lg border p-3 bg-muted/30 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">De</Label>
                    <Input
                      type="number"
                      min={0}
                      value={tier.min}
                      onChange={(e) => updateTier(i, "min", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Até</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="∞"
                      value={tier.max ?? ""}
                      onChange={(e) =>
                        updateTier(i, "max", e.target.value === "" ? null : parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo</Label>
                    <Select value={tier.mode} onValueChange={(v) => updateTier(i, "mode", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIER_MODES.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Valor</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        min={0}
                        step={0.1}
                        value={tier.value}
                        onChange={(e) => updateTier(i, "value", parseFloat(e.target.value) || 0)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-destructive"
                        onClick={() => removeTier(i)}
                        disabled={state.volume_tiers.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addTier}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar faixa
            </Button>
          </div>
        )}

        {/* Maçaneta */}
        <div className="space-y-1.5 max-w-xs border-t pt-4">
          <Label className="text-xs flex items-center gap-1.5">
            <DoorOpen className="h-3.5 w-3.5 text-amber-500" />
            Pontos por corrida maçaneta
          </Label>
          <Input
            type="number"
            min={0}
            step={1}
            value={state.macaneta_points_per_ride}
            onChange={(e) => update("macaneta_points_per_ride", parseInt(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground">
            {state.macaneta_points_per_ride > 0
              ? `Motorista ganhará ${state.macaneta_points_per_ride} pts por corrida maçaneta`
              : "0 = usa a regra padrão acima"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
