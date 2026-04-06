import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Save, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  branchId: string;
  settings: Record<string, any>;
}

const DEFAULT_PHRASES = [
  "Hoje não, parceiro! 😅",
  "Tô de boa por agora 🙏",
  "Quem sabe na próxima? 😂",
];

export default function ConfiguracaoModulo({ branchId, settings }: Props) {
  const qc = useQueryClient();

  const [enableDuels, setEnableDuels] = useState(settings.enable_driver_duels !== false);
  const [enableRanking, setEnableRanking] = useState(settings.enable_city_ranking !== false);
  const [enableBelt, setEnableBelt] = useState(settings.enable_city_belt !== false);
  const [publicViewing, setPublicViewing] = useState(settings.allow_public_duel_viewing !== false);
  const [minDuration, setMinDuration] = useState<number>(settings.duel_min_duration_hours ?? 24);
  const [maxDuration, setMaxDuration] = useState<number>(settings.duel_max_duration_hours ?? 168);
  const [maxSimultaneous, setMaxSimultaneous] = useState<number>(settings.duel_max_simultaneous ?? 3);
  const [rankingMetric, setRankingMetric] = useState<string>(settings.ranking_metric ?? "rides");
  const [beltMetric, setBeltMetric] = useState<string>(settings.belt_metric ?? "rides");
  const [phrases, setPhrases] = useState<string[]>(
    Array.isArray(settings.decline_phrases) ? settings.decline_phrases : DEFAULT_PHRASES
  );
  const [newPhrase, setNewPhrase] = useState("");

  const salvar = useMutation({
    mutationFn: async () => {
      const merged = {
        ...settings,
        enable_driver_duels: enableDuels,
        enable_city_ranking: enableRanking,
        enable_city_belt: enableBelt,
        allow_public_duel_viewing: publicViewing,
        duel_min_duration_hours: minDuration,
        duel_max_duration_hours: maxDuration,
        duel_max_simultaneous: maxSimultaneous,
        ranking_metric: rankingMetric,
        belt_metric: beltMetric,
        decline_phrases: phrases,
      };
      const { error } = await supabase
        .from("branches")
        .update({ branch_settings_json: merged })
        .eq("id", branchId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configuração salva!");
      qc.invalidateQueries({ queryKey: ["branch-detail-gamificacao", branchId] });
    },
    onError: () => toast.error("Erro ao salvar configuração"),
  });

  const addPhrase = () => {
    const trimmed = newPhrase.trim();
    if (trimmed && !phrases.includes(trimmed)) {
      setPhrases([...phrases, trimmed]);
      setNewPhrase("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Configuração do Módulo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggles */}
        <div className="grid gap-4 sm:grid-cols-2">
          <ToggleRow label="Duelos entre motoristas" checked={enableDuels} onChange={setEnableDuels} hint="Permite que motoristas se desafiem em competições de corridas." />
          <ToggleRow label="Ranking da cidade" checked={enableRanking} onChange={setEnableRanking} hint="Exibe uma classificação mensal dos motoristas mais ativos." />
          <ToggleRow label="Cinturão da cidade" checked={enableBelt} onChange={setEnableBelt} hint="Concede o título de campeão ao motorista com melhor desempenho." />
          <ToggleRow label="Visualização pública de duelos" checked={publicViewing} onChange={setPublicViewing} hint="Permite que todos os motoristas vejam os duelos em andamento." />
        </div>

        {/* Numeric fields */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">Duração mínima (horas)</Label>
            <Input type="number" min={1} value={minDuration} onChange={e => setMinDuration(Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Duração máxima (horas)</Label>
            <Input type="number" min={1} value={maxDuration} onChange={e => setMaxDuration(Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Máx. duelos simultâneos</Label>
            <Input type="number" min={1} max={10} value={maxSimultaneous} onChange={e => setMaxSimultaneous(Number(e.target.value))} />
          </div>
        </div>

        {/* Metric selects */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Métrica do ranking</Label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={rankingMetric} onChange={e => setRankingMetric(e.target.value)}>
              <option value="rides">Corridas</option>
              <option value="points">Pontos</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Métrica do cinturão</Label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={beltMetric} onChange={e => setBeltMetric(e.target.value)}>
              <option value="rides">Corridas</option>
              <option value="points">Pontos</option>
            </select>
          </div>
        </div>

        {/* Decline phrases */}
        <div className="space-y-2">
          <Label className="text-xs">Frases de recusa (com humor leve)</Label>
          <div className="space-y-1">
            {phrases.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex-1 text-sm bg-muted rounded px-3 py-1.5">{p}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPhrases(phrases.filter((_, j) => j !== i))}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Nova frase..." value={newPhrase} onChange={e => setNewPhrase(e.target.value)} onKeyDown={e => e.key === "Enter" && addPhrase()} />
            <Button variant="outline" size="sm" onClick={addPhrase}><Plus className="h-4 w-4" /></Button>
          </div>
        </div>

        <Button onClick={() => salvar.mutate()} disabled={salvar.isPending} className="w-full sm:w-auto">
          <Save className="h-4 w-4 mr-2" />
          {salvar.isPending ? "Salvando..." : "Salvar configuração"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ToggleRow({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <span className="text-sm flex items-center gap-1.5">
        {label}
        {hint && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px] text-xs">
                {hint}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
