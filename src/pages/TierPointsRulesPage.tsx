import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { TIERS } from "@/lib/tierUtils";

export default function TierPointsRulesPage() {
  const qc = useQueryClient();
  const { currentBrandId } = useBrandGuard();
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  const { data: branches } = useQuery({
    queryKey: ["branches-for-tier", currentBrandId],
    queryFn: async () => {
      let q = supabase.from("branches").select("id, name").eq("is_active", true).order("name");
      if (currentBrandId) q = q.eq("brand_id", currentBrandId);
      const { data } = await q;
      return data || [];
    },
  });

  // Auto-select first branch
  const branchId = selectedBranchId || branches?.[0]?.id || "";

  const { data: rules, isLoading } = useQuery({
    queryKey: ["tier-points-rules", currentBrandId, branchId],
    enabled: !!currentBrandId && !!branchId,
    queryFn: async () => {
      const { data } = await supabase
        .from("tier_points_rules")
        .select("*")
        .eq("brand_id", currentBrandId!)
        .eq("branch_id", branchId);
      return data || [];
    },
  });

  const [localRules, setLocalRules] = useState<Record<string, { points_per_real: number; is_active: boolean }>>({});

  // Merge DB rules with defaults
  const mergedTiers = TIERS.map(tier => {
    const dbRule = rules?.find((r: any) => r.tier === tier.key);
    const local = localRules[tier.key];
    return {
      ...tier,
      points_per_real: local?.points_per_real ?? dbRule?.points_per_real ?? 1,
      is_active: local?.is_active ?? dbRule?.is_active ?? false,
      dbId: dbRule?.id,
    };
  });

  const updateLocal = (tierKey: string, field: string, value: any) => {
    const current = mergedTiers.find(t => t.key === tierKey)!;
    const defaults = { points_per_real: current.points_per_real, is_active: current.is_active };
    setLocalRules(prev => {
      const existing = prev[tierKey] || defaults;
      return { ...prev, [tierKey]: { ...existing, [field]: value } };
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!currentBrandId || !branchId) throw new Error("Selecione uma filial");
      const upserts = mergedTiers.map(t => ({
        brand_id: currentBrandId,
        branch_id: branchId,
        tier: t.key,
        points_per_real: t.points_per_real,
        is_active: t.is_active,
      }));
      const { error } = await (supabase as any).from("tier_points_rules").upsert(upserts, { onConflict: "brand_id,branch_id,tier" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tier-points-rules"] });
      setLocalRules({});
      toast.success("Regras de pontuação por tier salvas!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Pontuação por Tier" description="Defina pontos por R$1 gasto para cada perfil de cliente" />

      <div className="flex items-center gap-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Cidade/Filial</Label>
          <Select value={branchId} onValueChange={v => { setSelectedBranchId(v); setLocalRules({}); }}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Selecione a filial" /></SelectTrigger>
            <SelectContent>
              {branches?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={!branchId} className="ml-auto">
          <Save className="h-4 w-4 mr-2" /> Salvar Regras
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mergedTiers.map(tier => (
          <Card key={tier.key} className={`transition-opacity ${tier.is_active ? "" : "opacity-60"}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={tier.color}>{tier.label}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {tier.key === "INICIANTE" ? "0 corridas" :
                     tier.key === "GALATICO" ? "500+ corridas" :
                     `${tier.min}–${tier.max} corridas`}
                  </span>
                </div>
                <Switch
                  checked={tier.is_active}
                  onCheckedChange={v => updateLocal(tier.key, "is_active", v)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-xs">Pontos por R$ 1,00</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={tier.points_per_real}
                  onChange={e => updateLocal(tier.key, "points_per_real", parseFloat(e.target.value) || 0)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
