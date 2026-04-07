import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  CheckCircle, XCircle, Loader2, Clock, Hash, Coins, Car,
  Copy, Check, Save, KeyRound, AlertTriangle, PowerOff, Truck,
} from "lucide-react";
import type { Integration } from "../hooks/hook_integracoes";

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
  integration: Integration;
  getBranchName: (id: string | null) => string;
  webhookBaseUrl: string;
}

export function CardConfigCidade({ brandId, integration, getBranchName, webhookBaseUrl }: Props) {
  const queryClient = useQueryClient();

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState(integration.callback_url || "");
  const [callbackSaved, setCallbackSaved] = useState(false);
  const [credTestResult, setCredTestResult] = useState<any>(null);

  // Driver points
  const [driverPointsEnabled, setDriverPointsEnabled] = useState(false);
  const [driverPointsPercent, setDriverPointsPercent] = useState("50");
  const [driverPointsMode, setDriverPointsMode] = useState("PERCENT");
  const [driverPointsPerReal, setDriverPointsPerReal] = useState("1");
  const [driverPointsSaved, setDriverPointsSaved] = useState(false);

  useEffect(() => {
    setCallbackUrl(integration.callback_url || "");
    setDriverPointsEnabled((integration as any)?.driver_points_enabled ?? false);
    setDriverPointsPercent(String((integration as any)?.driver_points_percent ?? 50));
    setDriverPointsMode((integration as any)?.driver_points_mode ?? "PERCENT");
    setDriverPointsPerReal(String((integration as any)?.driver_points_per_real ?? 1));
  }, [integration.id]);

  const webhookUrl = `${webhookBaseUrl}?brand_id=${encodeURIComponent(brandId)}&branch_id=${encodeURIComponent(integration.branch_id || "")}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const deactivateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("register-machine-webhook", {
        body: { brand_id: brandId, branch_id: integration.branch_id, action: "deactivate" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      toast({ title: "Integração desativada" });
      queryClient.invalidateQueries({ queryKey: ["machine-integrations"] });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteIntegrationMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("machine_integrations").delete().eq("id", integration.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Conexão removida" });
      queryClient.invalidateQueries({ queryKey: ["machine-integrations"] });
    },
    onError: (err: any) => toast({ title: "Erro ao remover", description: err.message, variant: "destructive" }),
  });

  const saveCallbackMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("machine_integrations").update({ callback_url: callbackUrl || null }).eq("id", integration.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setCallbackSaved(true);
      setTimeout(() => setCallbackSaved(false), 2000);
      toast({ title: "URL de retorno salva!" });
      queryClient.invalidateQueries({ queryKey: ["machine-integrations"] });
    },
    onError: (err: any) => toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" }),
  });

  const testCredentialsMutation = useMutation({
    mutationFn: async () => {
      setCredTestResult(null);
      const { data, error } = await supabase.functions.invoke("test-machine-credentials", {
        body: { integration_id: integration.id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => setCredTestResult(data),
    onError: (err: any) => setCredTestResult({ success: false, error: err.message }),
  });

  const saveDriverPointsMutation = useMutation({
    mutationFn: async () => {
      const percent = Math.min(100, Math.max(1, Number(driverPointsPercent) || 50));
      const perReal = Math.max(0.01, Number(driverPointsPerReal) || 1);
      const { error } = await (supabase as any).from("machine_integrations").update({
        driver_points_enabled: driverPointsEnabled,
        driver_points_percent: percent,
        driver_points_mode: driverPointsMode,
        driver_points_per_real: perReal,
      }).eq("id", integration.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setDriverPointsSaved(true);
      setTimeout(() => setDriverPointsSaved(false), 2000);
      toast({ title: "Pontuação do motorista salva!" });
      queryClient.invalidateQueries({ queryKey: ["machine-integrations"] });
    },
    onError: (err: any) => toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardContent className="pt-6 space-y-5">
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckCircle className="h-5 w-5 text-primary" />
          {getBranchName(integration.branch_id)} — Configuração
        </CardTitle>

        {/* KPIs */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <StatusCard icon={Clock} label="Último evento">
            <span className="text-xs font-medium">{integration.last_webhook_at ? new Date(integration.last_webhook_at).toLocaleString("pt-BR") : "—"}</span>
          </StatusCard>
          <StatusCard icon={Car} label="Última corrida">
            <span className="text-xs font-medium">{integration.last_ride_processed_at ? new Date(integration.last_ride_processed_at).toLocaleString("pt-BR") : "—"}</span>
          </StatusCard>
          <StatusCard icon={Hash} label="Corridas">
            <span className="text-2xl font-bold">{integration.total_rides}</span>
          </StatusCard>
          <StatusCard icon={Coins} label="Pontos gerados">
            <span className="text-2xl font-bold">{integration.total_points}</span>
          </StatusCard>
        </div>

        {/* Webhook status + test */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 text-sm">
          {integration.webhook_registered ? (
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
          <Label className="text-xs text-muted-foreground">URL do Webhook — cole no roteador de status da TaxiMachine</Label>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted px-3 py-2 rounded text-xs font-mono break-all border border-border">
              {webhookUrl}
            </code>
            <Button variant="outline" size="icon" onClick={handleCopyUrl}>
              {copiedUrl ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Callback URL */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">URL de retorno (opcional) — receba uma notificação HTTP a cada corrida processada</Label>
          <div className="flex items-center gap-2 max-w-lg">
            <Input value={callbackUrl} onChange={(e) => setCallbackUrl(e.target.value)} placeholder="https://seu-sistema.com/webhook/pontuacao" type="url" />
            <Button variant="outline" size="icon" onClick={() => saveCallbackMutation.mutate()} disabled={saveCallbackMutation.isPending}>
              {callbackSaved ? <Check className="h-4 w-4 text-primary" /> : saveCallbackMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Driver Points Config */}
        <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-primary" /> Pontuação do Motorista
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">Define quanto o motorista ganha de pontos a cada corrida finalizada nesta cidade.</p>
            </div>
            <Switch checked={driverPointsEnabled} onCheckedChange={setDriverPointsEnabled} />
          </div>
          {!driverPointsEnabled && (
            <Alert variant="destructive" className="border-yellow-500/50 bg-yellow-500/10 text-yellow-700 [&>svg]:text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-xs font-semibold">Pontuação desativada</AlertTitle>
              <AlertDescription className="text-xs">Os motoristas <strong>não estão sendo pontuados</strong> nesta cidade. Ative e salve para começar.</AlertDescription>
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
                  <p className="text-xs text-muted-foreground">Motorista receberá <strong>{driverPointsPercent || 50}%</strong> dos pontos que o passageiro ganhou.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 max-w-xs">
                    <Label className="text-xs whitespace-nowrap">Pontos por R$</Label>
                    <Input type="number" min={0.01} step={0.1} value={driverPointsPerReal} onChange={(e) => setDriverPointsPerReal(e.target.value)} className="w-24" />
                    <span className="text-xs text-muted-foreground">pts/R$</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Motorista receberá <strong>{driverPointsPerReal || 1} ponto(s)</strong> por cada R$ 1,00 da corrida.</p>
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
          <Button variant="destructive" size="sm" onClick={() => { if (confirm("Remover esta conexão?")) deleteIntegrationMutation.mutate(); }} disabled={deleteIntegrationMutation.isPending}>
            {deleteIntegrationMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <XCircle className="h-4 w-4 mr-1" /> Remover conexão
          </Button>
          <Button variant="outline" size="sm" onClick={() => integration.branch_id && deactivateMutation.mutate()} disabled={deactivateMutation.isPending}>
            {deactivateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <PowerOff className="h-4 w-4 mr-1" /> Desativar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
