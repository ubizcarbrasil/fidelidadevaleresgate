import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ScoredDriversPanel from "@/components/machine-integration/ScoredDriversPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import {
  Car, Activity, Radio, AlertTriangle, RefreshCw, Loader2, Info, MapPin, Plus,
} from "lucide-react";
import type { Integration, Branch } from "../hooks/hook_integracoes";
import { CardCidadesConectadas } from "./card_cidades_conectadas";
import { CardConfigCidade } from "./card_config_cidade";
import { CardAdicionarCidade } from "./card_adicionar_cidade";

/* Status labels */
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  P: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-700 border-yellow-300" },
  A: { label: "Aceita", color: "bg-blue-500/10 text-blue-700 border-blue-300" },
  S: { label: "Em andamento", color: "bg-indigo-500/10 text-indigo-700 border-indigo-300" },
  F: { label: "Finalizada", color: "bg-primary/10 text-primary border-primary/30" },
  C: { label: "Cancelada", color: "bg-destructive/10 text-destructive border-destructive/30" },
  N: { label: "Negada", color: "bg-destructive/10 text-destructive border-destructive/30" },
};

const RIDE_STATUS_MAP: Record<string, { label: string; className: string }> = {
  FINALIZED: { label: "Finalizada", className: "bg-primary/10 text-primary border-primary/30" },
  API_ERROR: { label: "Erro API", className: "bg-destructive/10 text-destructive border-destructive/30" },
  CREDENTIAL_ERROR: { label: "Erro Credencial", className: "bg-destructive/10 text-destructive border-destructive/30" },
  NO_VALUE: { label: "Sem valor", className: "bg-yellow-500/10 text-yellow-700 border-yellow-300" },
  PENDING: { label: "Pendente", className: "bg-muted text-muted-foreground border-border" },
  ACCEPTED: { label: "Aceita", className: "bg-blue-500/10 text-blue-700 border-blue-300" },
  IN_PROGRESS: { label: "Em andamento", className: "bg-indigo-500/10 text-indigo-700 border-indigo-300" },
  CANCELLED: { label: "Cancelada", className: "bg-muted text-muted-foreground border-border" },
  DENIED: { label: "Negada", className: "bg-muted text-muted-foreground border-border" },
};

type RideEvent = {
  id: string;
  brand_id: string;
  machine_ride_id: string;
  status_code: string;
  raw_payload: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
};

interface Props {
  brandId: string;
  integrations: Integration[];
  activeIntegrations: Integration[];
  availableBranches: Branch[];
  branches: Branch[];
  getBranchName: (id: string | null) => string;
}

export function AbaPontuarMotorista({
  brandId,
  integrations,
  activeIntegrations,
  availableBranches,
  branches,
  getBranchName,
}: Props) {
  const queryClient = useQueryClient();
  const webhookBaseUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/machine-webhook`;

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [liveEvents, setLiveEvents] = useState<RideEvent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const addCidadeRef = useRef<HTMLDivElement>(null);

  const hasActiveCities = activeIntegrations.length > 0;

  const selectedIntegration = selectedBranchId
    ? integrations.find((i) => i.branch_id === selectedBranchId && i.is_active)
    : null;

  // Load initial events
  useEffect(() => {
    if (!brandId) return;
    (supabase as any)
      .from("machine_ride_events").select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false }).limit(50)
      .then(({ data }: { data: RideEvent[] | null }) => { if (data) setLiveEvents(data); });
  }, [brandId]);

  // Realtime events
  useEffect(() => {
    if (!brandId) return;
    const channel = supabase
      .channel(`ride-events-driver-${brandId}`)
      .on("postgres_changes" as any, {
        event: "INSERT", schema: "public", table: "machine_ride_events",
        filter: `brand_id=eq.${brandId}`,
      }, (payload: any) => {
        const ev = payload.new as RideEvent;
        setLiveEvents((prev) => [ev, ...prev].slice(0, 100));
        if (ev.status_code === "F") {
          toast({ title: "🎯 Pontuação creditada!", description: `Corrida #${ev.machine_ride_id} finalizada` });
          queryClient.invalidateQueries({ queryKey: ["machine-integrations", brandId] });
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [brandId, queryClient]);

  const retryMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("retry-failed-rides", { body: { brand_id: brandId } });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["machine-rides-diag", brandId] });
      toast({ title: "Retry concluído", description: `${data.finalized || 0} corrigida(s), ${data.failed || 0} ainda com erro.` });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao reprocessar", description: String(err.message || err), variant: "destructive" });
    },
  });

  const { data: diagRides = [] } = useQuery({
    queryKey: ["machine-rides-diag", brandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("machine_rides")
        .select("id, machine_ride_id, ride_status, ride_value, points_credited, created_at, finalized_at")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-6">
      {/* Explicação da aba */}
      <Alert className="border-primary/20 bg-primary/5">
        <Car className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <strong>Pontuar Motorista</strong> — Cada cidade possui suas <strong>próprias credenciais</strong> (API Key, Usuário e Senha da cidade na TaxiMachine).
          Essas credenciais são usadas para receber status de corridas via webhook e calcular os pontos do motorista. São independentes das credenciais da Matriz.
        </AlertDescription>
      </Alert>

      {/* Sem cidades ativas: empty state + card de adicionar */}
      {!hasActiveCities && (
        <Card className="border-dashed border-2 border-primary/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="rounded-full bg-primary/10 p-4">
              <MapPin className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Nenhuma cidade configurada</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Conecte sua primeira cidade para começar a receber corridas via webhook e pontuar motoristas automaticamente.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!hasActiveCities && (
        <CardAdicionarCidade
          brandId={brandId}
          availableBranches={availableBranches}
          branches={branches}
          activeIntegrations={activeIntegrations}
        />
      )}

      {/* Com cidades ativas: botão de atalho */}
      {hasActiveCities && (
        <Button
          variant="outline"
          size="sm"
          className="gap-2 w-full sm:w-auto"
          onClick={() => addCidadeRef.current?.scrollIntoView({ behavior: "smooth" })}
        >
          <Car className="h-4 w-4" />
          + Adicionar cidade
        </Button>
      )}

      {/* Cidades conectadas */}
      <CardCidadesConectadas
        activeIntegrations={activeIntegrations}
        selectedBranchId={selectedBranchId}
        onSelectBranch={setSelectedBranchId}
        getBranchName={getBranchName}
      />

      {/* Config da cidade selecionada */}
      {selectedIntegration && (
        <CardConfigCidade
          brandId={brandId}
          integration={selectedIntegration}
          getBranchName={getBranchName}
          webhookBaseUrl={webhookBaseUrl}
        />
      )}

      {/* Diagnóstico */}
      {hasActiveCities && (
        <DiagnosticoWebhook rides={diagRides} retryMutation={retryMutation} />
      )}

      {/* Eventos em tempo real */}
      {hasActiveCities && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Radio className="h-4 w-4 text-primary animate-pulse" />
              Eventos em tempo real
            </CardTitle>
            <CardDescription>
              Corridas recebidas ao vivo de todas as cidades. Corridas finalizadas com pontuação são destacadas em verde.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              {liveEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                  <Radio className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">Aguardando eventos...</p>
                  <p className="text-xs mt-1">Eventos aparecerão aqui quando corridas forem processadas.</p>
                </div>
              ) : (
                <div className="space-y-2" ref={scrollRef}>
                  {liveEvents.map((ev) => {
                    const st = STATUS_LABELS[ev.status_code] || { label: ev.status_code, color: "bg-muted text-muted-foreground" };
                    const isFinalized = ev.status_code === "F";
                    const payload = ev.raw_payload;
                    return (
                      <div key={ev.id} className={`flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${isFinalized ? "border-primary/30 bg-primary/5" : "border-border"}`}>
                        <Badge variant="outline" className={`text-xs shrink-0 ${st.color}`}>{st.label}</Badge>
                        <span className="font-mono text-xs text-muted-foreground shrink-0">#{ev.machine_ride_id}</span>
                        {isFinalized && payload?.ride_value !== undefined && (
                          <span className="text-xs font-medium text-primary shrink-0">
                            R$ {Number(payload.ride_value || 0).toFixed(2)} → {Math.floor(Number(payload.ride_value || 0))} pts
                          </span>
                        )}
                        <span className="ml-auto text-xs text-muted-foreground shrink-0">{new Date(ev.created_at).toLocaleTimeString("pt-BR")}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Scored Drivers */}
      {hasActiveCities && integrations.some((i: any) => i.driver_points_enabled) && (
        <ScoredDriversPanel brandId={brandId} />
      )}

      {/* Adicionar nova cidade (no final, quando já há cidades) */}
      {hasActiveCities && (
        <div ref={addCidadeRef}>
          <CardAdicionarCidade
            brandId={brandId}
            availableBranches={availableBranches}
            branches={branches}
            activeIntegrations={activeIntegrations}
          />
        </div>
      )}
    </div>
  );
}

/* Diagnostics sub-component */
function DiagnosticoWebhook({ rides, retryMutation }: { rides: any[]; retryMutation: any }) {
  const failedCount = rides.filter((r: any) => ["API_ERROR", "CREDENTIAL_ERROR"].includes(r.ride_status)).length;
  const hasErrors = failedCount > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-primary" />
              Diagnóstico do Webhook
              {hasErrors && <AlertTriangle className="h-4 w-4 text-destructive" />}
            </CardTitle>
            <CardDescription>Últimas 10 corridas processadas — identifica erros de credencial ou API.</CardDescription>
          </div>
          {hasErrors && (
            <Button variant="outline" size="sm" onClick={() => retryMutation.mutate()} disabled={retryMutation.isPending} className="shrink-0">
              {retryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              Reprocessar falhas ({failedCount})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          {rides.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Activity className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">Nenhuma corrida processada ainda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rides.map((r: any) => {
                const st = RIDE_STATUS_MAP[r.ride_status] || { label: r.ride_status, className: "bg-muted text-muted-foreground border-border" };
                const isError = ["API_ERROR", "CREDENTIAL_ERROR"].includes(r.ride_status);
                return (
                  <div key={r.id} className={`flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm ${isError ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
                    <Badge variant="outline" className={`text-xs shrink-0 ${st.className}`}>
                      {isError && <AlertTriangle className="h-3 w-3 mr-1" />}{st.label}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground">#{r.machine_ride_id}</span>
                    {r.ride_value != null && <span className="text-xs text-muted-foreground">R$ {Number(r.ride_value).toFixed(2)}</span>}
                    {r.points_credited > 0 && <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">{r.points_credited} pts</Badge>}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
