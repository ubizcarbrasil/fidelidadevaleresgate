import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ScoredDriversPanel from "@/components/machine-integration/ScoredDriversPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  Car, CheckCircle, XCircle, Loader2, Activity, Clock, Hash, Coins,
  Eye, EyeOff, Copy, Check, Radio, Save, Link2, KeyRound, AlertTriangle,
  MapPin, Plus, Power, PowerOff, RefreshCw, Truck,
} from "lucide-react";
import type { Integration, Branch } from "../hooks/hook_integracoes";

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

function StatusCard({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-4 flex flex-col items-center gap-1">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
        {children}
      </CardContent>
    </Card>
  );
}

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
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Add city form - credentials
  const [activatingBranchId, setActivatingBranchId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [basicUser, setBasicUser] = useState("");
  const [basicPass, setBasicPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Add city form - URL
  const [urlBranchId, setUrlBranchId] = useState("");
  const [urlBasicUser, setUrlBasicUser] = useState("");
  const [urlBasicPass, setUrlBasicPass] = useState("");
  const [showUrlPass, setShowUrlPass] = useState(false);
  const [urlApiKey, setUrlApiKey] = useState("");
  const [showUrlApiKey, setShowUrlApiKey] = useState(false);
  const [urlActivatedWebhook, setUrlActivatedWebhook] = useState<string | null>(null);

  // Driver points config
  const [driverPointsEnabled, setDriverPointsEnabled] = useState(false);
  const [driverPointsPercent, setDriverPointsPercent] = useState("50");
  const [driverPointsMode, setDriverPointsMode] = useState("PERCENT");
  const [driverPointsPerReal, setDriverPointsPerReal] = useState("1");
  const [driverPointsSaved, setDriverPointsSaved] = useState(false);

  // Diagnostics & cred test
  const [credTestResult, setCredTestResult] = useState<any>(null);
  const [callbackUrl, setCallbackUrl] = useState("");
  const [callbackSaved, setCallbackSaved] = useState(false);

  // Live events
  const [liveEvents, setLiveEvents] = useState<RideEvent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedIntegration = selectedBranchId
    ? integrations.find((i) => i.branch_id === selectedBranchId && i.is_active)
    : null;

  useEffect(() => {
    if (selectedIntegration) {
      setCallbackUrl(selectedIntegration.callback_url || "");
      setDriverPointsEnabled((selectedIntegration as any)?.driver_points_enabled ?? false);
      setDriverPointsPercent(String((selectedIntegration as any)?.driver_points_percent ?? 50));
      setDriverPointsMode((selectedIntegration as any)?.driver_points_mode ?? "PERCENT");
      setDriverPointsPerReal(String((selectedIntegration as any)?.driver_points_per_real ?? 1));
    }
  }, [selectedIntegration?.id]);

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

  const handleCopyUrl = (branchId?: string) => {
    let url = `${webhookBaseUrl}?brand_id=${encodeURIComponent(brandId!)}`;
    if (branchId) url += `&branch_id=${encodeURIComponent(branchId)}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  /* Mutations */
  const activateMutation = useMutation({
    mutationFn: async (opts?: { urlOnly?: boolean }) => {
      const isUrlOnly = opts?.urlOnly;
      const branchId = isUrlOnly ? urlBranchId : activatingBranchId;
      const user = isUrlOnly ? urlBasicUser : basicUser;
      const pass = isUrlOnly ? urlBasicPass : basicPass;
      if (!branchId) throw new Error("Selecione uma cidade");
      const body: Record<string, string> = {
        brand_id: brandId, branch_id: branchId,
        basic_auth_user: user, basic_auth_password: pass,
      };
      const resolvedApiKey = isUrlOnly ? urlApiKey : apiKey;
      if (resolvedApiKey) body.api_key = resolvedApiKey;
      const { data, error } = await supabase.functions.invoke("register-machine-webhook", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return { ...data, isUrlOnly };
    },
    onSuccess: (data) => {
      if (data.isUrlOnly) {
        setUrlActivatedWebhook(data.webhook_url || null);
        toast({ title: "Cidade ativada por URL!", description: "Copie a URL abaixo e cole no roteador de status da TaxiMachine." });
        setUrlBasicUser(""); setUrlBasicPass(""); setUrlApiKey("");
      } else {
        toast({
          title: "Integração ativada!",
          description: data.webhook_registered ? "Webhook registrado com sucesso." : "Integração ativada, mas o registro automático falhou. Copie a URL manualmente.",
        });
        setApiKey(""); setBasicUser(""); setBasicPass(""); setActivatingBranchId("");
      }
      queryClient.invalidateQueries({ queryKey: ["machine-integrations"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao ativar", description: err.message || "Falha ao ativar.", variant: "destructive" });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (branchId: string) => {
      const { data, error } = await supabase.functions.invoke("register-machine-webhook", {
        body: { brand_id: brandId, branch_id: branchId, action: "deactivate" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "Integração desativada" });
      queryClient.invalidateQueries({ queryKey: ["machine-integrations"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const deleteIntegrationMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const { error } = await (supabase as any).from("machine_integrations").delete().eq("id", integrationId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Conexão removida" });
      queryClient.invalidateQueries({ queryKey: ["machine-integrations"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    },
  });

  const saveCallbackMutation = useMutation({
    mutationFn: async () => {
      if (!selectedIntegration?.id) throw new Error("Integration not found");
      const { error } = await (supabase as any).from("machine_integrations").update({ callback_url: callbackUrl || null }).eq("id", selectedIntegration.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setCallbackSaved(true); setTimeout(() => setCallbackSaved(false), 2000);
      toast({ title: "URL de retorno salva!" });
      queryClient.invalidateQueries({ queryKey: ["machine-integrations"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    },
  });

  const testCredentialsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedIntegration?.id) throw new Error("No integration selected");
      setCredTestResult(null);
      const { data, error } = await supabase.functions.invoke("test-machine-credentials", {
        body: { integration_id: selectedIntegration.id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => setCredTestResult(data),
    onError: (err: any) => setCredTestResult({ success: false, error: err.message }),
  });

  const saveDriverPointsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedIntegration?.id) throw new Error("Integration not found");
      const percent = Math.min(100, Math.max(1, Number(driverPointsPercent) || 50));
      const perReal = Math.max(0.01, Number(driverPointsPerReal) || 1);
      const { error } = await (supabase as any).from("machine_integrations").update({
        driver_points_enabled: driverPointsEnabled,
        driver_points_percent: percent,
        driver_points_mode: driverPointsMode,
        driver_points_per_real: perReal,
      }).eq("id", selectedIntegration.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setDriverPointsSaved(true); setTimeout(() => setDriverPointsSaved(false), 2000);
      toast({ title: "Pontuação do motorista salva!" });
      queryClient.invalidateQueries({ queryKey: ["machine-integrations"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    },
  });

  // Retry failed rides
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

  // Diag rides
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
      {/* Cidades conectadas */}
      {activeIntegrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5 text-primary" />
              Cidades conectadas ({activeIntegrations.length})
            </CardTitle>
            <CardDescription>Selecione uma cidade para configurar a pontuação do motorista.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activeIntegrations.map((integ) => {
                const hasCredentials = Boolean(integ.basic_auth_user && integ.basic_auth_password);
                const isSelected = selectedBranchId === integ.branch_id;
                return (
                  <div
                    key={integ.id}
                    onClick={() => setSelectedBranchId(integ.branch_id)}
                    className={`cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md ${isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">{getBranchName(integ.branch_id)}</span>
                      <Badge variant={hasCredentials ? "default" : "destructive"} className="text-xs">
                        {hasCredentials ? "Ativo" : "Sem credenciais"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1"><Hash className="h-3 w-3" /><span>{integ.total_rides} corridas</span></div>
                      <div className="flex items-center gap-1"><Coins className="h-3 w-3" /><span>{integ.total_points} pts</span></div>
                    </div>
                    {integ.last_ride_processed_at && (
                      <p className="text-xs text-muted-foreground mt-1">Última: {new Date(integ.last_ride_processed_at).toLocaleDateString("pt-BR")}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected city details */}
      {selectedIntegration && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-5 w-5 text-primary" />
              {getBranchName(selectedIntegration.branch_id)} — Pontuação do Motorista
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* KPIs */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <StatusCard icon={Clock} label="Último evento">
                <span className="text-xs font-medium">{selectedIntegration.last_webhook_at ? new Date(selectedIntegration.last_webhook_at).toLocaleString("pt-BR") : "—"}</span>
              </StatusCard>
              <StatusCard icon={Car} label="Última corrida">
                <span className="text-xs font-medium">{selectedIntegration.last_ride_processed_at ? new Date(selectedIntegration.last_ride_processed_at).toLocaleString("pt-BR") : "—"}</span>
              </StatusCard>
              <StatusCard icon={Hash} label="Corridas"><span className="text-2xl font-bold">{selectedIntegration.total_rides}</span></StatusCard>
              <StatusCard icon={Coins} label="Pontos gerados"><span className="text-2xl font-bold">{selectedIntegration.total_points}</span></StatusCard>
            </div>

            {/* Webhook status */}
            <div className="flex items-center gap-3 text-sm flex-wrap">
              {selectedIntegration.webhook_registered ? (
                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /><span>Webhook registrado</span></div>
              ) : (
                <div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-destructive" /><span>Webhook não registrado</span></div>
              )}
              <Button variant="outline" size="sm" onClick={() => testCredentialsMutation.mutate()} disabled={testCredentialsMutation.isPending}>
                {testCredentialsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <KeyRound className="h-4 w-4 mr-1" />}
                Testar Credenciais
              </Button>
            </div>

            {credTestResult && (
              <Alert variant={credTestResult.success ? "default" : "destructive"}>
                {credTestResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <AlertTitle>{credTestResult.success ? "Sucesso" : "Falha"}</AlertTitle>
                <AlertDescription className="text-xs">{credTestResult.message || credTestResult.error}</AlertDescription>
              </Alert>
            )}

            {/* Webhook URL */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">URL do Webhook</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded text-xs font-mono break-all border border-border">
                  {`${webhookBaseUrl}?brand_id=${encodeURIComponent(brandId)}&branch_id=${encodeURIComponent(selectedIntegration.branch_id || "")}`}
                </code>
                <Button variant="outline" size="icon" onClick={() => handleCopyUrl(selectedIntegration.branch_id || undefined)}>
                  {copiedUrl ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Callback URL */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">URL de retorno (opcional)</Label>
              <div className="flex items-center gap-2 max-w-lg">
                <Input value={callbackUrl} onChange={(e) => setCallbackUrl(e.target.value)} placeholder="https://seu-sistema.com/webhook/pontuacao" type="url" />
                <Button variant="outline" size="icon" onClick={() => saveCallbackMutation.mutate()} disabled={saveCallbackMutation.isPending}>
                  {callbackSaved ? <Check className="h-4 w-4 text-primary" /> : saveCallbackMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Driver Points Config */}
            <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground flex items-center gap-1"><Truck className="h-3 w-3" /> Pontuação do Motorista</Label>
                <Switch checked={driverPointsEnabled} onCheckedChange={setDriverPointsEnabled} />
              </div>
              {!driverPointsEnabled && (
                <Alert variant="destructive" className="border-yellow-500/50 bg-yellow-500/10 text-yellow-700 [&>svg]:text-yellow-600">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="text-xs font-semibold">Pontuação desativada</AlertTitle>
                  <AlertDescription className="text-xs">Os motoristas <strong>não estão sendo pontuados</strong>. Ative o switch e salve.</AlertDescription>
                </Alert>
              )}
              {driverPointsEnabled && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Modo de cálculo</Label>
                    <Select value={driverPointsMode} onValueChange={setDriverPointsMode}>
                      <SelectTrigger className="w-full max-w-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENT">Percentual do passageiro</SelectItem>
                        <SelectItem value="PER_REAL">Pontos por R$ da corrida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {driverPointsMode === "PERCENT" ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 max-w-xs">
                        <Label className="text-xs whitespace-nowrap">Percentual</Label>
                        <Input type="number" min={1} max={100} value={driverPointsPercent} onChange={(e) => setDriverPointsPercent(e.target.value)} className="w-20" />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Motorista receberá <strong>{driverPointsPercent || 50}%</strong> dos pontos do passageiro.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 max-w-xs">
                        <Label className="text-xs whitespace-nowrap">Pontos por R$</Label>
                        <Input type="number" min={0.01} step={0.1} value={driverPointsPerReal} onChange={(e) => setDriverPointsPerReal(e.target.value)} className="w-24" />
                        <span className="text-xs text-muted-foreground">pts/R$</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Motorista receberá <strong>{driverPointsPerReal || 1} ponto(s)</strong> por R$ 1,00.</p>
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => saveDriverPointsMutation.mutate()} disabled={saveDriverPointsMutation.isPending}>
                  {driverPointsSaved ? <Check className="h-4 w-4 text-primary mr-1" /> : saveDriverPointsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                  Salvar
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Button variant="destructive" size="sm" onClick={() => { if (confirm("Remover esta conexão?")) deleteIntegrationMutation.mutate(selectedIntegration.id); }} disabled={deleteIntegrationMutation.isPending}>
                {deleteIntegrationMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <XCircle className="h-4 w-4 mr-1" /> Remover conexão
              </Button>
              <Button variant="outline" size="sm" onClick={() => selectedIntegration.branch_id && deactivateMutation.mutate(selectedIntegration.branch_id)} disabled={deactivateMutation.isPending}>
                {deactivateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <PowerOff className="h-4 w-4 mr-1" /> Desativar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diagnóstico do Webhook */}
      {activeIntegrations.length > 0 && (
        <DiagnosticoWebhook
          rides={diagRides}
          retryMutation={retryMutation}
        />
      )}

      {/* Eventos em tempo real */}
      {activeIntegrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Radio className="h-4 w-4 text-primary animate-pulse" />
              Eventos em tempo real (todas as cidades)
            </CardTitle>
            <CardDescription>Corridas recebidas ao vivo. Finalizadas com pontuação são destacadas.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              {liveEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                  <Radio className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">Aguardando eventos...</p>
                </div>
              ) : (
                <div className="space-y-2" ref={scrollRef}>
                  {liveEvents.map((ev) => {
                    const st = STATUS_LABELS[ev.status_code] || { label: ev.status_code, color: "bg-muted text-muted-foreground" };
                    const isFinalized = ev.status_code === "F";
                    const payload = ev.raw_payload;
                    return (
                      <div key={ev.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${isFinalized ? "border-primary/30 bg-primary/5" : "border-border"}`}>
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
      {activeIntegrations.length > 0 && integrations.some((i: any) => i.driver_points_enabled) && (
        <ScoredDriversPanel brandId={brandId} />
      )}

      {/* Adicionar nova cidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {activeIntegrations.length > 0 ? "Adicionar nova cidade" : "Ativar integração"}
          </CardTitle>
          <CardDescription>
            {activeIntegrations.length > 0 ? "Cada cidade tem suas próprias credenciais da TaxiMachine." : "Conecte sua plataforma de corridas selecionando a cidade e as credenciais."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="credentials" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="credentials" className="flex items-center gap-1.5 text-xs sm:text-sm"><KeyRound className="h-4 w-4" />Por credenciais</TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-1.5 text-xs sm:text-sm"><Link2 className="h-4 w-4" />Por URL (manual)</TabsTrigger>
            </TabsList>

            <TabsContent value="credentials" className="space-y-4 mt-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <h3 className="font-semibold text-sm">Como funciona</h3>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Selecione a <strong>cidade</strong> que deseja conectar.</li>
                  <li>Obtenha as credenciais no painel da TaxiMachine para essa cidade.</li>
                  <li>Preencha a <strong>chave de acesso</strong> (opcional), <strong>usuário</strong> e <strong>senha</strong>.</li>
                  <li>Clique em "Ativar cidade". Se a chave foi informada, o webhook é registrado automaticamente.</li>
                </ol>
              </div>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  {availableBranches.length > 0 ? (
                    <Select value={activatingBranchId} onValueChange={setActivatingBranchId}>
                      <SelectTrigger><SelectValue placeholder="Selecione a cidade..." /></SelectTrigger>
                      <SelectContent>{availableBranches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground">{branches.length === 0 ? "Nenhuma cidade cadastrada." : "Todas as cidades já estão conectadas."}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>api-key da Cidade</Label>
                  <div className="relative">
                    <Input type={showApiKey ? "text" : "password"} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Token da cidade" />
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowApiKey(!showApiKey)}>
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Usuário da Cidade</Label>
                  <Input value={basicUser} onChange={(e) => setBasicUser(e.target.value)} placeholder="Usuário de autenticação" />
                </div>
                <div className="space-y-2">
                  <Label>Senha da Cidade</Label>
                  <div className="relative">
                    <Input type={showPass ? "text" : "password"} value={basicPass} onChange={(e) => setBasicPass(e.target.value)} placeholder="Senha de autenticação" />
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPass(!showPass)}>
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button onClick={() => activateMutation.mutate({})} disabled={activateMutation.isPending || !basicUser || !basicPass || !activatingBranchId}>
                  {activateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Power className="h-4 w-4 mr-1" /> Ativar cidade
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4 mt-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <h3 className="font-semibold text-sm">Como funciona</h3>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Selecione a <strong>cidade</strong>.</li>
                  <li>Informe a <strong>chave de acesso</strong> (API Key).</li>
                  <li>Preencha <strong>usuário</strong> e <strong>senha</strong>.</li>
                  <li>Copie a URL gerada e cole no <strong>roteador de status</strong> da TaxiMachine.</li>
                </ol>
              </div>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  {availableBranches.length > 0 ? (
                    <Select value={urlBranchId} onValueChange={(v) => { setUrlBranchId(v); setUrlActivatedWebhook(null); }}>
                      <SelectTrigger><SelectValue placeholder="Selecione a cidade..." /></SelectTrigger>
                      <SelectContent>{availableBranches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground">{branches.length === 0 ? "Nenhuma cidade cadastrada." : "Todas as cidades já estão conectadas."}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>api-key da Cidade</Label>
                  <div className="relative">
                    <Input type={showUrlApiKey ? "text" : "password"} value={urlApiKey} onChange={(e) => setUrlApiKey(e.target.value)} placeholder="Token da cidade" />
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowUrlApiKey(!showUrlApiKey)}>
                      {showUrlApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Usuário da Cidade</Label>
                  <Input value={urlBasicUser} onChange={(e) => setUrlBasicUser(e.target.value)} placeholder="Usuário de autenticação" />
                </div>
                <div className="space-y-2">
                  <Label>Senha da Cidade</Label>
                  <div className="relative">
                    <Input type={showUrlPass ? "text" : "password"} value={urlBasicPass} onChange={(e) => setUrlBasicPass(e.target.value)} placeholder="Senha de autenticação" />
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowUrlPass(!showUrlPass)}>
                      {showUrlPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button onClick={() => activateMutation.mutate({ urlOnly: true })} disabled={activateMutation.isPending || !urlBasicUser || !urlBasicPass || !urlBranchId}>
                  {activateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Power className="h-4 w-4 mr-1" /> Ativar cidade
                </Button>
              </div>
              {urlActivatedWebhook && (
                <Alert className="border-primary/30 bg-primary/5">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <AlertTitle>Cidade ativada!</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p className="text-sm">Copie a URL abaixo e cole no roteador de status da TaxiMachine:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-muted px-3 py-2 rounded text-xs font-mono break-all border border-border">{urlActivatedWebhook}</code>
                      <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(urlActivatedWebhook); setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2000); }}>
                        {copiedUrl ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
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
            <CardDescription>Últimas 10 corridas processadas.</CardDescription>
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
