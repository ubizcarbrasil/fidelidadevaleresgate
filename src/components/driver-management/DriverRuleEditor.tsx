import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Save, Settings2 } from "lucide-react";

interface Props {
  driverId: string;
  brandId: string;
}

export default function DriverRuleEditor({ driverId, brandId }: Props) {
  const qc = useQueryClient();

  const { data: rule, isLoading } = useQuery({
    queryKey: ["driver-rule-individual", driverId, brandId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("driver_points_rules")
        .select("*")
        .eq("brand_id", brandId)
        .eq("driver_customer_id", driverId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: brandRule } = useQuery({
    queryKey: ["driver-rule-brand", brandId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("driver_points_rules")
        .select("*")
        .eq("brand_id", brandId)
        .is("driver_customer_id", null)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [mode, setMode] = useState<string>("");
  const [value, setValue] = useState("");
  const [editing, setEditing] = useState(false);

  const startEditing = () => {
    setMode(rule?.rule_mode || brandRule?.rule_mode || "FIXED");
    setValue(String(rule?.fixed_points ?? rule?.percent_of_passenger ?? rule?.points_per_real ?? brandRule?.fixed_points ?? "10"));
    setEditing(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) throw new Error("Valor inválido");

      const payload: any = {
        brand_id: brandId,
        driver_customer_id: driverId,
        rule_mode: mode,
        is_active: true,
        fixed_points: mode === "FIXED" ? numValue : null,
        percent_of_passenger: mode === "PERCENT" ? numValue : null,
        points_per_real: mode === "POINTS_PER_REAL" ? numValue : null,
      };

      if (rule?.id) {
        const { error } = await (supabase as any)
          .from("driver_points_rules")
          .update(payload)
          .eq("id", rule.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("driver_points_rules")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Regra individual salva!");
      qc.invalidateQueries({ queryKey: ["driver-rule-individual", driverId] });
      setEditing(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!rule?.id) return;
      const { error } = await (supabase as any)
        .from("driver_points_rules")
        .delete()
        .eq("id", rule.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Regra individual removida. Será usada a regra padrão.");
      qc.invalidateQueries({ queryKey: ["driver-rule-individual", driverId] });
      setEditing(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border p-3 flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const modeLabels: Record<string, string> = {
    FIXED: "Fixo por corrida",
    PERCENT: "% dos pontos do passageiro",
    POINTS_PER_REAL: "Pontos por R$",
    VOLUME_TIERS: "Faixas de volume",
  };

  return (
    <div className="rounded-lg border border-border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium flex items-center gap-1.5">
            <Settings2 className="h-3.5 w-3.5" />
            Regra Individual
          </h4>
          <p className="text-xs text-muted-foreground">
            {rule ? "Regra personalizada ativa" : "Usando regra padrão da marca"}
          </p>
        </div>
        {!editing && (
          <Button size="sm" variant="outline" onClick={startEditing}>
            {rule ? "Editar" : "Personalizar"}
          </Button>
        )}
      </div>

      {!editing && rule && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {modeLabels[rule.rule_mode] || rule.rule_mode}
          </Badge>
          <span className="text-sm font-mono">
            {rule.rule_mode === "FIXED" && `${rule.fixed_points} pts`}
            {rule.rule_mode === "PERCENT" && `${rule.percent_of_passenger}%`}
            {rule.rule_mode === "POINTS_PER_REAL" && `${rule.points_per_real} pts/R$`}
          </span>
        </div>
      )}

      {editing && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Modo de pontuação</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIXED">Fixo por corrida</SelectItem>
                <SelectItem value="PERCENT">% dos pontos do passageiro</SelectItem>
                <SelectItem value="POINTS_PER_REAL">Pontos por R$</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">
              {mode === "FIXED" ? "Pontos por corrida" : mode === "PERCENT" ? "Percentual (%)" : "Pontos por R$ 1,00"}
            </Label>
            <Input
              type="number"
              min={0}
              step={mode === "PERCENT" ? "1" : "0.1"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
              Salvar
            </Button>
            {rule && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                Remover Override
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
