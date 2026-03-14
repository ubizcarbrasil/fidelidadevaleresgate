import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ScoredCustomersPanel from "@/components/machine-integration/ScoredCustomersPanel";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Car, CheckCircle, XCircle, Loader2, Activity, Clock, Hash, Coins,
  Eye, EyeOff, Copy, Check, Radio, ExternalLink, Save, Link2, KeyRound, AlertTriangle,
  MapPin, Plus, Power, PowerOff, Send, Trophy, Phone, User, RefreshCw,
} from "lucide-react";

/* ── Status labels ── */
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  P: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-700 border-yellow-300" },
  A: { label: "Aceita", color: "bg-blue-500/10 text-blue-700 border-blue-300" },
  S: { label: "Em andamento", color: "bg-indigo-500/10 text-indigo-700 border-indigo-300" },
  F: { label: "Finalizada", color: "bg-primary/10 text-primary border-primary/30" },
  C: { label: "Cancelada", color: "bg-destructive/10 text-destructive border-destructive/30" },
  N: { label: "Negada", color: "bg-destructive/10 text-destructive border-destructive/30" },
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

type Integration = {
  id: string; brand_id: string; branch_id: string | null; api_key: string;
  basic_auth_user: string; basic_auth_password: string;
  webhook_registered: boolean; is_active: boolean;
  last_webhook_at: string | null; last_ride_processed_at: string | null;
  total_rides: number; total_points: number;
  callback_url: string | null; created_at: string; updated_at: string;
};

type Branch = { id: string; name: string; city: string | null; state: string | null };

/* ── Ride status map for diagnostics ── */
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

function WebhookDiagnosticsCard({ brandId }: { brandId: string }) {
  const queryClient = useQueryClient();
  const { data: rides = [], isLoading } = useQuery({
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

  const failedCount = rides.filter((r: any) => ["API_ERROR", "CREDENTIAL_ERROR"].includes(r.ride_status)).length;
  const hasErrors = failedCount > 0;

  const retryMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("retry-failed-rides", {
        body: { brand_id: brandId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["machine-rides-diag", brandId] });
      toast({
        title: "Retry concluído",
        description: `${data.finalized || 0} corrigida(s), ${data.failed || 0} ainda com erro.`,
      });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao reprocessar", description: String(err.message || err), variant: "destructive" });
    },
  });

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
            <CardDescription>Últimas 10 corridas processadas — resultado final de cada uma.</CardDescription>
          </div>
          {hasErrors && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => retryMutation.mutate()}
              disabled={retryMutation.isPending}
              className="shrink-0"
            >
              {retryMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Reprocessar falhas ({failedCount})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm">Carregando...</span>
            </div>
          ) : rides.length === 0 ? (
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
                      {isError && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {st.label}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground">#{r.machine_ride_id}</span>
                    {r.ride_value != null && (
                      <span className="text-xs text-muted-foreground">R$ {Number(r.ride_value).toFixed(2)}</span>
                    )}
                    {r.points_credited > 0 && (
                      <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">{r.points_credited} pts</Badge>
                    )}
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

/* ══════════════════════════════════════════════════════════════════ */

export default function MachineIntegrationPage() {
  const { currentBrandId } = useBrandGuard();
  const queryClient = useQueryClient();

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [basicUser, setBasicUser] = useState("");
  const [basicPass, setBasicPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState("");
  const [callbackSaved, setCallbackSaved] = useState(false);
  const [receiptApiKey, setReceiptApiKey] = useState("");
  const [showReceiptApiKey, setShowReceiptApiKey] = useState(false);
  const [urlReceiptApiKey, setUrlReceiptApiKey] = useState("");
  const [showUrlReceiptApiKey, setShowUrlReceiptApiKey] = useState(false);
  const [liveEvents, setLiveEvents] = useState<RideEvent[]>([]);
  const [activatingBranchId, setActivatingBranchId] = useState<string>("");
  const [urlBranchId, setUrlBranchId] = useState<string>("");
  const [urlBasicUser, setUrlBasicUser] = useState("");
  const [urlBasicPass, setUrlBasicPass] = useState("");
  const [showUrlPass, setShowUrlPass] = useState(false);
  const [urlApiKey, setUrlApiKey] = useState("");
  const [showUrlApiKey, setShowUrlApiKey] = useState(false);
  const [urlActivatedWebhook, setUrlActivatedWebhook] = useState<string | null>(null);
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramSaved, setTelegramSaved] = useState(false);
  const [liveNotifications, setLiveNotifications] = useState<any[]>([]);
  const [credTestResult, setCredTestResult] = useState<{ success: boolean; message?: string; error?: string; details?: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const webhookBaseUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/machine-webhook`;

  const handleCopyUrl = (branchId?: string) => {
    let url = `${webhookBaseUrl}?brand_id=${encodeURIComponent(currentBrandId!)}`;
    if (branchId) url += `&branch_id=${encodeURIComponent(branchId)}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  /* ── Query: branches ── */
  const { data: branches = [] } = useQuery({
    queryKey: ["branches", currentBrandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name, city, state")
        .eq("brand_id", currentBrandId!)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Branch[];
    },
    enabled: !!currentBrandId,
  });

  /* ── Query: all integrations for this brand ── */
  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ["machine-integrations", currentBrandId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("machine_integrations")
        .select("*")
        .eq("brand_id", currentBrandId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as Integration[];
    },
    enabled: !!currentBrandId,
  });

  const activeIntegrations = integrations.filter((i) => i.is_active);
  const selectedIntegration = selectedBranchId
    ? integrations.find((i) => i.branch_id === selectedBranchId && i.is_active)
    : null;

  useEffect(() => {
    if (selectedIntegration?.callback_url !== undefined) setCallbackUrl(selectedIntegration?.callback_url || "");
    setTelegramChatId((selectedIntegration as any)?.telegram_chat_id || "");
  }, [selectedIntegration?.callback_url, (selectedIntegration as any)?.telegram_chat_id]);

  /* ── Initial events ── */
  useEffect(() => {
    if (!currentBrandId) return;
    (supabase as any)
      .from("machine_ride_events").select("*")
      .eq("brand_id", currentBrandId)
      .order("created_at", { ascending: false }).limit(50)
      .then(({ data }: { data: RideEvent[] | null }) => { if (data) setLiveEvents(data); });

    // Load initial notifications
    (supabase as any)
      .from("machine_ride_notifications").select("*")
      .eq("brand_id", currentBrandId)
      .order("created_at", { ascending: false }).limit(30)
      .then(({ data }: { data: any[] | null }) => { if (data) setLiveNotifications(data); });
  }, [currentBrandId]);

  /* ── Realtime ── */
  useEffect(() => {
    if (!currentBrandId) return;
    const channel = supabase
      .channel(`ride-events-${currentBrandId}`)
      .on("postgres_changes" as any, {
        event: "INSERT", schema: "public", table: "machine_ride_events",
        filter: `brand_id=eq.${currentBrandId}`,
      }, (payload: any) => {
        const ev = payload.new as RideEvent;
        setLiveEvents((prev) => [ev, ...prev].slice(0, 100));
        if (ev.status_code === "F") {
          toast({ title: "🎯 Pontuação creditada!", description: `Corrida #${ev.machine_ride_id} finalizada` });
          queryClient.invalidateQueries({ queryKey: ["machine-integrations", currentBrandId] });
        }
      }).subscribe();

    // Realtime: notifications
    const notifChannel = supabase
      .channel(`ride-notifs-${currentBrandId}`)
      .on("postgres_changes" as any, {
        event: "INSERT", schema: "public", table: "machine_ride_notifications",
        filter: `brand_id=eq.${currentBrandId}`,
      }, (payload: any) => {
        setLiveNotifications((prev) => [payload.new, ...prev].slice(0, 50));
      }).subscribe();

    return () => { supabase.removeChannel(channel); supabase.removeChannel(notifChannel); };
  }, [currentBrandId, queryClient]);

  /* ── Mutations ── */
  const activateMutation = useMutation({
    mutationFn: async (opts?: { urlOnly?: boolean }) => {
      const isUrlOnly = opts?.urlOnly;
      const branchId = isUrlOnly ? urlBranchId : activatingBranchId;
      const user = isUrlOnly ? urlBasicUser : basicUser;
      const pass = isUrlOnly ? urlBasicPass : basicPass;
      if (!branchId) throw new Error("Selecione uma cidade");
      const body: Record<string, string> = {
        brand_id: currentBrandId!,
        branch_id: branchId,
        basic_auth_user: user,
        basic_auth_password: pass,
      };
      const resolvedApiKey = isUrlOnly ? urlApiKey : apiKey;
      if (resolvedApiKey) body.api_key = resolvedApiKey;
      const resolvedReceiptKey = isUrlOnly ? urlReceiptApiKey : receiptApiKey;
      if (resolvedReceiptKey) body.receipt_api_key = resolvedReceiptKey;
      const { data, error } = await supabase.functions.invoke("register-machine-webhook", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return { ...data, isUrlOnly };
    },
    onSuccess: (data) => {
      if (data.isUrlOnly) {
        setUrlActivatedWebhook(data.webhook_url || null);
        toast({
          title: "Cidade ativada por URL!",
          description: "Copie a URL abaixo e cole no roteador de status da TaxiMachine.",
        });
        setUrlBasicUser(""); setUrlBasicPass(""); setUrlApiKey(""); setUrlReceiptApiKey("");
      } else {
        toast({
          title: "Integração ativada!",
          description: data.webhook_registered
            ? "Webhook registrado com sucesso."
            : "Integração ativada, mas o registro automático falhou. Copie a URL manualmente.",
        });
        setApiKey(""); setReceiptApiKey(""); setBasicUser(""); setBasicPass(""); setActivatingBranchId("");
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
        body: { brand_id: currentBrandId, branch_id: branchId, action: "deactivate" },
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

  const saveCallbackMutation = useMutation({
    mutationFn: async () => {
      if (!selectedIntegration?.id) throw new Error("Integration not found");
      const { error } = await (supabase as any)
        .from("machine_integrations")
        .update({ callback_url: callbackUrl || null })
        .eq("id", selectedIntegration.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setCallbackSaved(true);
      setTimeout(() => setCallbackSaved(false), 2000);
      toast({ title: "URL de retorno salva!" });
      queryClient.invalidateQueries({ queryKey: ["machine-integrations"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    },
  });

  const saveTelegramMutation = useMutation({
    mutationFn: async () => {
      if (!selectedIntegration?.id) throw new Error("Integration not found");
      const { error } = await (supabase as any)
        .from("machine_integrations")
        .update({ telegram_chat_id: telegramChatId || null })
        .eq("id", selectedIntegration.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setTelegramSaved(true);
      setTimeout(() => setTelegramSaved(false), 2000);
      toast({ title: "Chat ID do Telegram salvo!" });
      queryClient.invalidateQueries({ queryKey: ["machine-integrations"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    },
  });

  const testTelegramMutation = useMutation({
    mutationFn: async () => {
      if (!telegramChatId.trim()) throw new Error("Chat ID vazio");
      const branchName = getBranchName(selectedIntegration?.branch_id || null);
      const { data, error } = await supabase.functions.invoke("send-telegram-ride-notification", {
        body: {
          chat_id: telegramChatId.trim(),
          customer_name: "Teste de Conexão",
          customer_phone: "(00) 00000-0000",
          city_name: branchName,
          ride_value: 25.50,
          points_credited: 25,
          finalized_at: new Date().toISOString(),
          machine_ride_id: "TESTE-000",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "✅ Mensagem de teste enviada!", description: "Verifique o chat do Telegram." });
    },
    onError: (err: any) => {
      toast({ title: "Erro no envio de teste", description: err.message || "Verifique o Chat ID e tente novamente.", variant: "destructive" });
    },
  });

  // Branches not yet integrated
  const integratedBranchIds = new Set(activeIntegrations.map((i) => i.branch_id));
  const availableBranches = branches.filter((b) => !integratedBranchIds.has(b.id));

  const getBranchName = (branchId: string | null) => {
    if (!branchId) return "Sem cidade";
    const b = branches.find((br) => br.id === branchId);
    return b ? b.name : branchId;
  };

  /* ══════════════════════ RENDER ══════════════════════ */
  return (
    <div className="space-y-6">
      <PageHeader
        title="Integração de Mobilidade"
        description="Conecte cada cidade à sua plataforma de corridas para pontuar clientes automaticamente"
      />

      {/* ─── ACTIVE INTEGRATIONS LIST ─── */}
      {activeIntegrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5 text-primary" />
              Cidades conectadas ({activeIntegrations.length})
            </CardTitle>
            <CardDescription>Cada cidade possui suas próprias credenciais e contadores.</CardDescription>
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
                      <div className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        <span>{integ.total_rides} corridas</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        <span>{integ.total_points} pts</span>
                      </div>
                    </div>
                    {integ.last_ride_processed_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Última: {new Date(integ.last_ride_processed_at).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── SELECTED CITY DETAILS ─── */}
      {selectedIntegration && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="h-5 w-5 text-primary" />
                {getBranchName(selectedIntegration.branch_id)} — Detalhes
              </CardTitle>
              <CardDescription>
                Corridas finalizadas geram pontos automaticamente. Regra: <strong>R$ 1 = 1 ponto</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatusCard icon={Clock} label="Último evento">
                  <span className="text-xs font-medium">
                    {selectedIntegration.last_webhook_at ? new Date(selectedIntegration.last_webhook_at).toLocaleString("pt-BR") : "—"}
                  </span>
                </StatusCard>
                <StatusCard icon={Car} label="Última corrida">
                  <span className="text-xs font-medium">
                    {selectedIntegration.last_ride_processed_at ? new Date(selectedIntegration.last_ride_processed_at).toLocaleString("pt-BR") : "—"}
                  </span>
                </StatusCard>
                <StatusCard icon={Hash} label="Corridas">
                  <span className="text-2xl font-bold">{selectedIntegration.total_rides}</span>
                </StatusCard>
                <StatusCard icon={Coins} label="Pontos gerados">
                  <span className="text-2xl font-bold">{selectedIntegration.total_points}</span>
                </StatusCard>
              </div>

              {!Boolean(selectedIntegration.basic_auth_user && selectedIntegration.basic_auth_password) && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Credenciais incompletas</AlertTitle>
                  <AlertDescription>
                    Desative e reative esta cidade com as credenciais corretas.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center gap-3 text-sm flex-wrap">
                {selectedIntegration.webhook_registered ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Webhook registrado</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span>Webhook não registrado</span>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testCredentialsMutation.mutate()}
                  disabled={testCredentialsMutation.isPending}
                >
                  {testCredentialsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <KeyRound className="h-4 w-4 mr-1" />
                  )}
                  Testar Credenciais
                </Button>
              </div>

              {credTestResult && (
                <Alert variant={credTestResult.success ? "default" : "destructive"}>
                  {credTestResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  <AlertTitle>{credTestResult.success ? "Credenciais válidas" : "Erro nas credenciais"}</AlertTitle>
                  <AlertDescription className="text-xs">
                    {credTestResult.success ? credTestResult.message : (
                      <>
                        <p className="font-medium">{credTestResult.error}</p>
                        {credTestResult.details && <p className="mt-1 opacity-80">{credTestResult.details}</p>}
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Webhook URL for this city */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">URL do webhook desta cidade</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded text-xs font-mono break-all border border-border">
                    {`${webhookBaseUrl}?brand_id=${encodeURIComponent(currentBrandId!)}&branch_id=${encodeURIComponent(selectedIntegration.branch_id || "")}`}
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
                  <Input
                    value={callbackUrl}
                    onChange={(e) => setCallbackUrl(e.target.value)}
                    placeholder="https://seu-sistema.com/webhook/pontuacao"
                    type="url"
                  />
                  <Button variant="outline" size="icon" onClick={() => saveCallbackMutation.mutate()} disabled={saveCallbackMutation.isPending}>
                    {callbackSaved ? <Check className="h-4 w-4 text-primary" /> : saveCallbackMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Telegram Chat ID */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Send className="h-3 w-3" /> Chat ID do Telegram (opcional)
                </Label>
                <div className="flex items-center gap-2 max-w-lg">
                  <Input
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    placeholder="-1001234567890"
                  />
                  <Button variant="outline" size="icon" onClick={() => saveTelegramMutation.mutate()} disabled={saveTelegramMutation.isPending}>
                    {telegramSaved ? <Check className="h-4 w-4 text-primary" /> : saveTelegramMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!telegramChatId.trim() || testTelegramMutation.isPending}
                    onClick={() => testTelegramMutation.mutate()}
                  >
                    {testTelegramMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                    Testar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Crie um bot no <strong>@BotFather</strong>, adicione ao grupo e use <strong>@userinfobot</strong> para obter o chat_id.
                </p>
              </div>

              <Button
                variant="destructive" size="sm"
                onClick={() => selectedIntegration.branch_id && deactivateMutation.mutate(selectedIntegration.branch_id)}
                disabled={deactivateMutation.isPending}
              >
                {deactivateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <PowerOff className="h-4 w-4 mr-1" />
                Desativar esta cidade
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* ─── ÚLTIMAS PONTUAÇÕES (realtime) ─── */}
      {activeIntegrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-primary" />
              Últimas pontuações
            </CardTitle>
            <CardDescription>Pontuações creditadas em tempo real, todas as cidades.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              {liveNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                  <Trophy className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">Nenhuma pontuação registrada ainda.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {liveNotifications.map((notif: any) => (
                    <div key={notif.id} className="flex flex-col gap-1 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium text-xs">{notif.customer_name || "Não identificado"}</span>
                          {notif.customer_cpf_masked && (
                            <span className="text-xs text-muted-foreground">CPF {notif.customer_cpf_masked}</span>
                          )}
                        </div>
                        <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">
                          {notif.points_credited} pts
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {notif.customer_phone && (
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{notif.customer_phone}</span>
                        )}
                        {notif.city_name && (
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{notif.city_name}</span>
                        )}
                        <span className="flex items-center gap-1"><Coins className="h-3 w-3" />R$ {Number(notif.ride_value || 0).toFixed(2)}</span>
                        <span className="ml-auto">{new Date(notif.created_at).toLocaleTimeString("pt-BR")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* ─── DIAGNÓSTICO DO WEBHOOK ─── */}
      {activeIntegrations.length > 0 && (
        <WebhookDiagnosticsCard brandId={currentBrandId!} />
      )}

      {/* ─── REALTIME FEED (always visible if any integration active) ─── */}
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
                    const payload = ev.raw_payload as Record<string, unknown>;
                    return (
                      <div key={ev.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${isFinalized ? "border-primary/30 bg-primary/5" : "border-border"}`}>
                        <Badge variant="outline" className={`text-xs shrink-0 ${st.color}`}>{st.label}</Badge>
                        <span className="font-mono text-xs text-muted-foreground shrink-0">#{ev.machine_ride_id}</span>
                        {isFinalized && payload?.ride_value !== undefined && (
                          <span className="text-xs font-medium text-primary shrink-0">
                            R$ {Number(payload.ride_value || 0).toFixed(2)} → {Math.floor(Number(payload.ride_value || 0))} pts
                          </span>
                        )}
                        <span className="ml-auto text-xs text-muted-foreground shrink-0">
                          {new Date(ev.created_at).toLocaleTimeString("pt-BR")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Scored Customers */}
      {activeIntegrations.length > 0 && <ScoredCustomersPanel brandId={currentBrandId!} />}

      {/* ─── ADD NEW CITY ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {activeIntegrations.length > 0 ? "Adicionar nova cidade" : "Ativar integração"}
          </CardTitle>
          <CardDescription>
            {activeIntegrations.length > 0
              ? "Cada cidade tem suas próprias credenciais da TaxiMachine."
              : "Conecte sua plataforma de corridas selecionando a cidade e as credenciais."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="credentials" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="credentials" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <KeyRound className="h-4 w-4" />
                Por credenciais
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Link2 className="h-4 w-4" />
                Por URL (manual)
              </TabsTrigger>
            </TabsList>

            {/* ── Tab: Credentials ── */}
            <TabsContent value="credentials" className="space-y-4 mt-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <h3 className="font-semibold text-sm">Como funciona</h3>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Selecione a <strong>cidade</strong> que deseja conectar.</li>
                  <li>Obtenha as credenciais no painel da TaxiMachine para essa cidade.</li>
                  <li>Preencha a <strong>chave de acesso</strong> (opcional), <strong>usuário</strong> e <strong>senha</strong>.</li>
                  <li>Clique em "Ativar cidade". Se a chave foi informada, o webhook é registrado automaticamente.</li>
                  <li>Cada corrida finalizada credita pontos ao passageiro (<strong>R$ 1 = 1 ponto</strong>).</li>
                </ol>
              </div>

              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  {availableBranches.length > 0 ? (
                    <Select value={activatingBranchId} onValueChange={setActivatingBranchId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a cidade..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBranches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {branches.length === 0
                        ? "Nenhuma cidade cadastrada. Cadastre cidades antes de ativar."
                        : "Todas as cidades já estão conectadas."}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api_key">Chave de acesso (webhook)</Label>
                  <div className="relative">
                    <Input
                      id="api_key"
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Chave que a TaxiMachine envia no header x-api-secret"
                    />
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowApiKey(!showApiKey)}>
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Opcional. Usada para autenticar o webhook recebido.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receipt_api_key">Chave da API de Vendas (recibos)</Label>
                  <div className="relative">
                    <Input
                      id="receipt_api_key"
                      type={showReceiptApiKey ? "text" : "password"}
                      value={receiptApiKey}
                      onChange={(e) => setReceiptApiKey(e.target.value)}
                      placeholder="Chave para consultar recibos na api-vendas"
                    />
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowReceiptApiKey(!showReceiptApiKey)}>
                      {showReceiptApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Enviada como header <code className="bg-muted px-1 rounded">api-key</code> para consultar recibos.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="basic_user">Usuário</Label>
                  <Input id="basic_user" value={basicUser} onChange={(e) => setBasicUser(e.target.value)} placeholder="Usuário de autenticação" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="basic_pass">Senha</Label>
                  <div className="relative">
                    <Input id="basic_pass" type={showPass ? "text" : "password"} value={basicPass} onChange={(e) => setBasicPass(e.target.value)} placeholder="Senha de autenticação" />
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPass(!showPass)}>
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button onClick={() => activateMutation.mutate({})} disabled={activateMutation.isPending || !basicUser || !basicPass || !activatingBranchId}>
                  {activateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Power className="h-4 w-4 mr-1" />
                  Ativar cidade
                </Button>
              </div>
            </TabsContent>

            {/* ── Tab: URL ── */}
            <TabsContent value="url" className="space-y-4 mt-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <h3 className="font-semibold text-sm">Como funciona</h3>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Selecione a <strong>cidade</strong> que deseja conectar.</li>
                  <li>Informe a <strong>chave de acesso</strong> (API Key) fornecida pela TaxiMachine para consulta de recibos.</li>
                  <li>Preencha <strong>usuário</strong> e <strong>senha</strong> da TaxiMachine.</li>
                  <li>Clique em "Ativar cidade".</li>
                  <li>Copie a URL gerada e cole no <strong>roteador de status</strong> da TaxiMachine.</li>
                </ol>
              </div>

              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  {availableBranches.length > 0 ? (
                    <Select value={urlBranchId} onValueChange={(v) => { setUrlBranchId(v); setUrlActivatedWebhook(null); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a cidade..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBranches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {branches.length === 0
                        ? "Nenhuma cidade cadastrada. Cadastre cidades antes de ativar."
                        : "Todas as cidades já estão conectadas."}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url_api_key">Chave de acesso (webhook)</Label>
                  <div className="relative">
                    <Input
                      id="url_api_key"
                      type={showUrlApiKey ? "text" : "password"}
                      value={urlApiKey}
                      onChange={(e) => setUrlApiKey(e.target.value)}
                      placeholder="Chave que a TaxiMachine envia no header x-api-secret"
                    />
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowUrlApiKey(!showUrlApiKey)}>
                      {showUrlApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Opcional. Usada para autenticar o webhook recebido.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url_receipt_api_key">Chave da API de Vendas (recibos)</Label>
                  <div className="relative">
                    <Input
                      id="url_receipt_api_key"
                      type={showUrlReceiptApiKey ? "text" : "password"}
                      value={urlReceiptApiKey}
                      onChange={(e) => setUrlReceiptApiKey(e.target.value)}
                      placeholder="Chave para consultar recibos na api-vendas"
                    />
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowUrlReceiptApiKey(!showUrlReceiptApiKey)}>
                      {showUrlReceiptApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Enviada como header <code className="bg-muted px-1 rounded">api-key</code> para consultar recibos.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url_basic_user">Usuário</Label>
                  <Input id="url_basic_user" value={urlBasicUser} onChange={(e) => setUrlBasicUser(e.target.value)} placeholder="Usuário de autenticação" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url_basic_pass">Senha</Label>
                  <div className="relative">
                    <Input id="url_basic_pass" type={showUrlPass ? "text" : "password"} value={urlBasicPass} onChange={(e) => setUrlBasicPass(e.target.value)} placeholder="Senha de autenticação" />
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowUrlPass(!showUrlPass)}>
                      {showUrlPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button onClick={() => activateMutation.mutate({ urlOnly: true })} disabled={activateMutation.isPending || !urlReceiptApiKey || !urlBasicUser || !urlBasicPass || !urlBranchId}>
                  {activateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Power className="h-4 w-4 mr-1" />
                  Ativar cidade
                </Button>
              </div>

              {urlActivatedWebhook && (
                <Alert className="border-primary/30 bg-primary/5">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <AlertTitle>Cidade ativada!</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p className="text-sm">Copie a URL abaixo e cole no roteador de status da TaxiMachine:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-muted px-3 py-2 rounded text-xs font-mono break-all border border-border">
                        {urlActivatedWebhook}
                      </code>
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

/* ── Small helper component ── */
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
