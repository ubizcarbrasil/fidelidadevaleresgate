import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Plus, Trash2, Truck, Info, DoorOpen } from "lucide-react";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";

type VolumeTier = {
  min: number;
  max: number | null;
  mode: "PER_REAL" | "FIXED" | "PERCENT";
  value: number;
};

type DriverRule = {
  id?: string;
  brand_id: string;
  branch_id: string | null;
  rule_mode: string;
  points_per_real: number;
  percent_of_passenger: number;
  fixed_points_per_ride: number;
  volume_tiers: VolumeTier[];
  volume_cycle_days: number;
  is_active: boolean;
  macaneta_points_per_ride: number;
};

const RULE_MODES = [
  { value: "PER_REAL", label: "Pontos por R$ 1,00", desc: "Ex: 1.5 pontos por cada real da corrida" },
  { value: "PERCENT", label: "% dos pontos do passageiro", desc: "Ex: 50% do que o passageiro ganhou" },
  { value: "FIXED", label: "Pontuação fixa por corrida", desc: "Ex: 10 pontos por cada corrida finalizada" },
  { value: "VOLUME_TIER", label: "Faixa de volume mensal", desc: "Regras mudam conforme volume de corridas no mês" },
];

const TIER_MODES = [
  { value: "PER_REAL", label: "Pontos/R$" },
  { value: "FIXED", label: "Fixo" },
  { value: "PERCENT", label: "%" },
];

const DEFAULT_TIERS: VolumeTier[] = [
  { min: 1, max: 100, mode: "PER_REAL", value: 1 },
  { min: 101, max: 200, mode: "PER_REAL", value: 1.5 },
  { min: 201, max: null, mode: "PER_REAL", value: 2 },
];

export default function DriverPointsRulesPage() {
  const qc = useQueryClient();
  const { currentBrandId, currentBranchId, consoleScope } = useBrandGuard();
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  const isBranchScope = consoleScope === "BRANCH" && !!currentBranchId;

  const { data: branches } = useQuery({
    queryKey: ["branches-driver-rules", currentBrandId],
    queryFn: async () => {
      let q = supabase.from("branches").select("id, name").eq("is_active", true).order("name");
      if (currentBrandId) q = q.eq("brand_id", currentBrandId);
      const { data } = await q;
      return data || [];
    },
    enabled: !!currentBrandId && !isBranchScope,
  });

  // branch_admin usa sua própria cidade travada
  const branchId = isBranchScope ? currentBranchId! : (selectedBranchId || branches?.[0]?.id || "");

  const { data: rule, isLoading } = useQuery({
    queryKey: ["driver-points-rules", currentBrandId, branchId],
    enabled: !!currentBrandId && !!branchId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("driver_points_rules")
        .select("*")
        .eq("brand_id", currentBrandId!)
        .eq("branch_id", branchId)
        .maybeSingle();
      return data as DriverRule | null;
    },
  });

  const [form, setForm] = useState<Partial<DriverRule>>({});

  // Merge DB rule with local form state
  const merged: DriverRule = {
    id: form.id ?? rule?.id,
    brand_id: currentBrandId!,
    branch_id: branchId,
    rule_mode: form.rule_mode ?? rule?.rule_mode ?? "PER_REAL",
    points_per_real: form.points_per_real ?? rule?.points_per_real ?? 1,
    percent_of_passenger: form.percent_of_passenger ?? rule?.percent_of_passenger ?? 50,
    fixed_points_per_ride: form.fixed_points_per_ride ?? rule?.fixed_points_per_ride ?? 10,
    volume_tiers: form.volume_tiers ?? (rule?.volume_tiers as VolumeTier[] | undefined) ?? DEFAULT_TIERS,
    volume_cycle_days: form.volume_cycle_days ?? rule?.volume_cycle_days ?? 30,
    is_active: form.is_active ?? rule?.is_active ?? true,
    macaneta_points_per_ride: form.macaneta_points_per_ride ?? rule?.macaneta_points_per_ride ?? 0,
  };

  const updateForm = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateTier = (index: number, field: keyof VolumeTier, value: any) => {
    const tiers = [...merged.volume_tiers];
    tiers[index] = { ...tiers[index], [field]: value };
    updateForm("volume_tiers", tiers);
  };

  const addTier = () => {
    const tiers = [...merged.volume_tiers];
    const lastMax = tiers.length > 0 ? (tiers[tiers.length - 1].max ?? 999) : 0;
    tiers.push({ min: lastMax + 1, max: null, mode: "PER_REAL", value: 1 });
    updateForm("volume_tiers", tiers);
  };

  const removeTier = (index: number) => {
    const tiers = merged.volume_tiers.filter((_, i) => i !== index);
    updateForm("volume_tiers", tiers);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!currentBrandId || !branchId) throw new Error("Selecione uma filial");
      const payload = {
        brand_id: currentBrandId,
        branch_id: branchId,
        rule_mode: merged.rule_mode,
        points_per_real: merged.points_per_real,
        percent_of_passenger: merged.percent_of_passenger,
        fixed_points_per_ride: merged.fixed_points_per_ride,
        volume_tiers: merged.volume_tiers,
        volume_cycle_days: merged.volume_cycle_days,
        is_active: merged.is_active,
        macaneta_points_per_ride: merged.macaneta_points_per_ride,
      };
      const { error } = await (supabase as any)
        .from("driver_points_rules")
        .upsert(payload, { onConflict: "brand_id,branch_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["driver-points-rules"] });
      setForm({});
      toast.success("Regras de pontuação do motorista salvas!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Simulation
  const simulatePoints = (rideValue: number, rideCount: number) => {
    switch (merged.rule_mode) {
      case "FIXED":
        return merged.fixed_points_per_ride;
      case "PERCENT":
        return Math.floor(rideValue * (merged.percent_of_passenger / 100));
      case "VOLUME_TIER": {
        const tier = merged.volume_tiers.find(
          (t) => rideCount >= t.min && (t.max === null || rideCount <= t.max)
        );
        if (!tier) return 0;
        if (tier.mode === "FIXED") return tier.value;
        if (tier.mode === "PERCENT") return Math.floor(rideValue * (tier.value / 100));
        return Math.floor(rideValue * tier.value);
      }
      default:
        return Math.floor(rideValue * merged.points_per_real);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pontuação de Motoristas"
        description="Configure como motoristas ganham pontos a cada corrida finalizada"
      />

      <div className="flex items-center gap-4 flex-wrap">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Cidade/Filial</Label>
          <Select value={branchId} onValueChange={(v) => { setSelectedBranchId(v); setForm({}); }}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Selecione a filial" />
            </SelectTrigger>
            <SelectContent>
              {branches?.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Switch checked={merged.is_active} onCheckedChange={(v) => updateForm("is_active", v)} />
          <Label className="text-sm">{merged.is_active ? "Ativo" : "Inativo"}</Label>
        </div>

        <Button onClick={() => saveMutation.mutate()} disabled={!branchId || saveMutation.isPending}>
          <Save className="h-4 w-4 mr-2" /> Salvar Regras
        </Button>
      </div>

      {/* Modo de pontuação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            Modo de pontuação
          </CardTitle>
          <CardDescription>Escolha como o motorista será pontuado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {RULE_MODES.map((mode) => (
              <div
                key={mode.value}
                onClick={() => updateForm("rule_mode", mode.value)}
                className={`cursor-pointer rounded-lg border p-4 transition-all ${
                  merged.rule_mode === mode.value
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <div className="font-medium text-sm">{mode.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{mode.desc}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Config por modo */}
      {merged.rule_mode === "PER_REAL" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pontos por R$ 1,00</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-xs space-y-2">
              <Label className="text-xs">Quantos pontos por cada R$ 1,00 da corrida</Label>
              <Input
                type="number"
                min={0}
                step={0.1}
                value={merged.points_per_real}
                onChange={(e) => updateForm("points_per_real", parseFloat(e.target.value) || 0)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {merged.rule_mode === "PERCENT" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Percentual dos pontos do passageiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-xs space-y-2">
              <Label className="text-xs">% dos pontos que o passageiro ganhou</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={1}
                value={merged.percent_of_passenger}
                onChange={(e) => updateForm("percent_of_passenger", parseFloat(e.target.value) || 0)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {merged.rule_mode === "FIXED" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pontos fixos por corrida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-xs space-y-2">
              <Label className="text-xs">Quantidade fixa de pontos por corrida finalizada</Label>
              <Input
                type="number"
                min={0}
                step={1}
                value={merged.fixed_points_per_ride}
                onChange={(e) => updateForm("fixed_points_per_ride", parseInt(e.target.value) || 0)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {merged.rule_mode === "VOLUME_TIER" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Faixas de volume mensal</CardTitle>
            <CardDescription>
              Regras mudam conforme o número de corridas do motorista no ciclo de {merged.volume_cycle_days} dias. Ao final do ciclo, a contagem reseta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-xs space-y-2">
              <Label className="text-xs">Dias do ciclo (reset automático)</Label>
              <Input
                type="number"
                min={1}
                max={90}
                value={merged.volume_cycle_days}
                onChange={(e) => updateForm("volume_cycle_days", parseInt(e.target.value) || 30)}
              />
            </div>

            <div className="space-y-3">
              {merged.volume_tiers.map((tier, i) => (
                <div key={i} className="flex items-end gap-3 rounded-lg border border-border p-3 bg-muted/30">
                  <div className="space-y-1">
                    <Label className="text-xs">De (corridas)</Label>
                    <Input
                      type="number"
                      min={0}
                      className="w-24"
                      value={tier.min}
                      onChange={(e) => updateTier(i, "min", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Até</Label>
                    <Input
                      type="number"
                      min={0}
                      className="w-24"
                      placeholder="∞"
                      value={tier.max ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        updateTier(i, "max", v === "" ? null : parseInt(v) || 0);
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo</Label>
                    <Select
                      value={tier.mode}
                      onValueChange={(v) => updateTier(i, "mode", v)}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIER_MODES.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Valor</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.1}
                      className="w-24"
                      value={tier.value}
                      onChange={(e) => updateTier(i, "value", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive"
                    onClick={() => removeTier(i)}
                    disabled={merged.volume_tiers.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addTier}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar faixa
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pontuação Maçaneta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <DoorOpen className="h-4 w-4 text-amber-500" />
            Pontuação Maçaneta
          </CardTitle>
          <CardDescription>
            Corrida "maçaneta" é quando o motorista abre uma corrida avulsa no aplicativo, sem passageiro real. 
            O passageiro não recebe pontos, mas o motorista pode receber uma pontuação fixa configurável. 
            Se o valor for 0, a regra padrão acima será usada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs space-y-2">
            <Label className="text-xs">Pontos fixos por corrida maçaneta</Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={merged.macaneta_points_per_ride}
              onChange={(e) => updateForm("macaneta_points_per_ride", parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              {merged.macaneta_points_per_ride > 0
                ? `Motorista ganhará ${merged.macaneta_points_per_ride} pontos por cada corrida maçaneta`
                : "Usando regra padrão (modo selecionado acima)"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Simulação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            Simulação de pontuação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Corrida R$ 15,00 (5ª corrida)", value: 15, count: 5 },
              { label: "Corrida R$ 30,00 (50ª corrida)", value: 30, count: 50 },
              { label: "Corrida R$ 25,00 (150ª corrida)", value: 25, count: 150 },
            ].map((sim) => (
              <div key={sim.label} className="rounded-lg border border-border p-3 space-y-1">
                <div className="text-xs text-muted-foreground">{sim.label}</div>
                <Badge className="bg-primary/10 text-primary border-primary/30 text-sm font-mono">
                  {simulatePoints(sim.value, sim.count)} pontos
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Essas regras substituem as configurações básicas de motorista na página de integração. 
          Se nenhuma regra estiver configurada aqui, o sistema usará as configurações da integração como fallback.
        </AlertDescription>
      </Alert>
    </div>
  );
}
