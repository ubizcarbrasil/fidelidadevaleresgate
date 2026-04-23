import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Save, HelpCircle, Users, Loader2, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useBranchFeature,
  useSetBranchFeature,
} from "@/compartilhados/hooks/hook_brand_feature";

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

  // Compat: se a flag legada existir e nenhuma das novas, usa o valor antigo como base
  const legacyDuelsOn = settings.enable_driver_duels !== false;
  const [enableDuelDvD, setEnableDuelDvD] = useState(
    settings.enable_duel_driver_vs_driver === true ||
      (settings.enable_duel_driver_vs_driver === undefined && legacyDuelsOn),
  );
  const [enableDuelSponsored, setEnableDuelSponsored] = useState(
    settings.enable_duel_sponsored_by_brand === true ||
      (settings.enable_duel_sponsored_by_brand === undefined && legacyDuelsOn),
  );
  const [enableDuelSideBets, setEnableDuelSideBets] = useState(
    settings.enable_duel_side_bets === true ||
      (settings.enable_duel_side_bets === undefined && legacyDuelsOn),
  );
  const [enableRanking, setEnableRanking] = useState(settings.enable_city_ranking !== false);
  const [enableBelt, setEnableBelt] = useState(settings.enable_city_belt !== false);
  const [publicViewing, setPublicViewing] = useState(settings.allow_public_duel_viewing !== false);
  const [enableGuesses, setEnableGuesses] = useState(settings.enable_duel_guesses === true);
  const [enableRatings, setEnableRatings] = useState(settings.enable_duel_ratings !== false);
  const [enrollmentMode, setEnrollmentMode] = useState<"individual" | "all">(
    settings.duel_enrollment_mode === "all" ? "all" : "individual"
  );
  const [minDuration, setMinDuration] = useState<number>(settings.duel_min_duration_hours ?? 24);
  const [maxDuration, setMaxDuration] = useState<number>(settings.duel_max_duration_hours ?? 168);
  const [maxSimultaneous, setMaxSimultaneous] = useState<number>(settings.duel_max_simultaneous ?? 3);
  const [rankingMetric, setRankingMetric] = useState<string>(settings.ranking_metric ?? "rides");
  const [beltMetric, setBeltMetric] = useState<string>(settings.belt_metric ?? "rides");
  const [phrases, setPhrases] = useState<string[]>(
    Array.isArray(settings.decline_phrases) ? settings.decline_phrases : DEFAULT_PHRASES
  );
  const [newPhrase, setNewPhrase] = useState("");
  const [showConfirmAll, setShowConfirmAll] = useState(false);

  const salvar = useMutation({
    mutationFn: async () => {
      const merged = {
        ...settings,
        enable_duel_driver_vs_driver: enableDuelDvD,
        enable_duel_sponsored_by_brand: enableDuelSponsored,
        enable_duel_side_bets: enableDuelSideBets,
        // Compat com telas antigas: enable_driver_duels = OR das três modalidades
        enable_driver_duels: enableDuelDvD || enableDuelSponsored || enableDuelSideBets,
        enable_city_ranking: enableRanking,
        enable_city_belt: enableBelt,
        allow_public_duel_viewing: publicViewing,
        enable_duel_guesses: enableGuesses,
        enable_duel_ratings: enableRatings,
        duel_enrollment_mode: enrollmentMode,
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

  const habilitarTodos = useMutation({
    mutationFn: async () => {
      // Get branch info
      const { data: branch, error: branchErr } = await supabase
        .from("branches")
        .select("brand_id")
        .eq("id", branchId)
        .single();
      if (branchErr || !branch) throw new Error("Cidade não encontrada");

      // Get all drivers in this branch
      const { data: drivers, error: driversErr } = await supabase
        .from("customers")
        .select("id")
        .eq("branch_id", branchId)
        .eq("brand_id", branch.brand_id)
        .eq("is_active", true)
        .ilike("name", "%[MOTORISTA]%");
      if (driversErr) throw driversErr;
      if (!drivers || drivers.length === 0) throw new Error("Nenhum motorista encontrado nesta cidade");

      // Upsert all as duel participants
      const rows = drivers.map((d) => ({
        customer_id: d.id,
        branch_id: branchId,
        brand_id: branch.brand_id,
        duels_enabled: true,
      }));

      const { error: upsertErr } = await supabase
        .from("driver_duel_participants")
        .upsert(rows, { onConflict: "customer_id" });
      if (upsertErr) throw upsertErr;

      return drivers.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} motoristas habilitados para duelo! 🥊`);
      qc.invalidateQueries({ queryKey: ["gamificacao-stats"] });
    },
    onError: (err: any) => toast.error(err.message || "Erro ao habilitar motoristas"),
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
        {/* Module toggles */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Módulos</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleRow
              label="Duelos entre motoristas (com aposta)"
              checked={enableDuelDvD}
              onChange={setEnableDuelDvD}
              hint="Motoristas se desafiam apostando pontos próprios. Vencedor leva o pote."
            />
            <ToggleRow
              label="Duelos patrocinados pelo empreendedor"
              checked={enableDuelSponsored}
              onChange={setEnableDuelSponsored}
              hint="A carteira da cidade banca o prêmio. Motoristas não apostam pontos."
            />
            <ToggleRow
              label="Apostas paralelas em duelos"
              checked={enableDuelSideBets}
              onChange={setEnableDuelSideBets}
              hint="Outros motoristas podem apostar pontos no resultado de um duelo."
            />
            <ToggleRow label="Ranking da cidade" checked={enableRanking} onChange={setEnableRanking} hint="Exibe uma classificação mensal dos motoristas mais ativos." />
            <ToggleRow label="Cinturão da cidade" checked={enableBelt} onChange={setEnableBelt} hint="Concede o título de campeão ao motorista com melhor desempenho." />
            <ToggleRow label="Visualização pública de duelos" checked={publicViewing} onChange={setPublicViewing} hint="Permite que todos os motoristas vejam os duelos em andamento." />
            <ToggleRow label="Palpites em duelos" checked={enableGuesses} onChange={setEnableGuesses} hint="Permite que outros motoristas façam palpites sobre o resultado dos duelos." />
            <ToggleRow label="Avaliações pós-duelo" checked={enableRatings} onChange={setEnableRatings} hint="Permite que os participantes se avaliem mutuamente após o duelo." />
          </div>
        </div>

        {/* Enrollment mode */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Modo de Adesão</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => setEnrollmentMode("individual")}
              className="rounded-lg border p-3 text-left transition-all"
              style={{
                borderColor: enrollmentMode === "individual" ? "hsl(var(--primary))" : "hsl(var(--border))",
                backgroundColor: enrollmentMode === "individual" ? "hsl(var(--primary) / 0.05)" : "transparent",
              }}
            >
              <p className="text-sm font-medium text-foreground">Adesão individual</p>
              <p className="text-xs text-muted-foreground mt-0.5">Cada motorista escolhe se quer participar dos duelos.</p>
            </button>
            <button
              onClick={() => setEnrollmentMode("all")}
              className="rounded-lg border p-3 text-left transition-all"
              style={{
                borderColor: enrollmentMode === "all" ? "hsl(var(--primary))" : "hsl(var(--border))",
                backgroundColor: enrollmentMode === "all" ? "hsl(var(--primary) / 0.05)" : "transparent",
              }}
            >
              <p className="text-sm font-medium text-foreground">Todos habilitados</p>
              <p className="text-xs text-muted-foreground mt-0.5">O admin habilita todos os motoristas automaticamente.</p>
            </button>
          </div>

          {/* Bulk enable button */}
          <Button
            variant="outline"
            className="gap-2 w-full sm:w-auto"
            onClick={() => setShowConfirmAll(true)}
            disabled={habilitarTodos.isPending}
          >
            {habilitarTodos.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Users className="h-4 w-4" />
            )}
            Habilitar todos os motoristas para duelo
          </Button>
        </div>

        {/* Numeric fields */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Parâmetros</Label>
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

      <ConfirmDialog
        open={showConfirmAll}
        title="Habilitar todos os motoristas"
        description="Isso vai habilitar todos os motoristas ativos desta cidade para participar de duelos. Motoristas futuros precisarão ser habilitados manualmente ou individualmente. Deseja continuar?"
        confirmLabel="Habilitar todos"
        onConfirm={() => habilitarTodos.mutate()}
        onClose={() => setShowConfirmAll(false)}
      />
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
