import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Car, CheckCircle, XCircle, Loader2, Activity, Clock, Hash, Coins, Eye, EyeOff, Copy, Check } from "lucide-react";

export default function MachineIntegrationPage() {
  const { currentBrandId } = useBrandGuard();
  const queryClient = useQueryClient();

  const [apiKey, setApiKey] = useState("");
  const [basicUser, setBasicUser] = useState("");
  const [basicPass, setBasicPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const webhookUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/machine-webhook`;

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const { data: integration, isLoading } = useQuery({
    queryKey: ["machine-integration", currentBrandId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("machine_integrations")
        .select("*")
        .eq("brand_id", currentBrandId!)
        .maybeSingle();
      if (error) throw error;
      return data as {
        id: string;
        brand_id: string;
        api_key: string;
        basic_auth_user: string;
        basic_auth_password: string;
        webhook_registered: boolean;
        is_active: boolean;
        last_webhook_at: string | null;
        last_ride_processed_at: string | null;
        total_rides: number;
        total_points: number;
        created_at: string;
        updated_at: string;
      } | null;
    },
    enabled: !!currentBrandId,
  });

  const activateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("register-machine-webhook", {
        body: {
          brand_id: currentBrandId,
          api_key: apiKey,
          basic_auth_user: basicUser,
          basic_auth_password: basicPass,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Integração ativada!",
        description: data.webhook_registered
          ? "Webhook registrado com sucesso na TaxiMachine."
          : "Integração ativada, mas o registro do webhook falhou. Tente novamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["machine-integration"] });
      setApiKey("");
      setBasicUser("");
      setBasicPass("");
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao ativar",
        description: err.message || "Falha ao ativar a integração.",
        variant: "destructive",
      });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("register-machine-webhook", {
        body: { brand_id: currentBrandId, action: "deactivate" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "Integração desativada" });
      queryClient.invalidateQueries({ queryKey: ["machine-integration"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const isActive = integration?.is_active;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integração TaxiMachine"
        description="Configure a pontuação automática de corridas via TaxiMachine"
      />

      {/* Status Dashboard */}
      {integration && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-4 flex flex-col items-center gap-1">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Status</span>
              {isActive ? (
                <Badge className="bg-primary text-primary-foreground">Ativo</Badge>
              ) : (
                <Badge variant="secondary">Inativo</Badge>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex flex-col items-center gap-1">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Último Webhook</span>
              <span className="text-sm font-medium">
                {integration.last_webhook_at
                  ? new Date(integration.last_webhook_at).toLocaleString("pt-BR")
                  : "—"}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex flex-col items-center gap-1">
              <Car className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Última Corrida</span>
              <span className="text-sm font-medium">
                {integration.last_ride_processed_at
                  ? new Date(integration.last_ride_processed_at).toLocaleString("pt-BR")
                  : "—"}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex flex-col items-center gap-1">
              <Hash className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Corridas</span>
              <span className="text-2xl font-bold">{integration.total_rides}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex flex-col items-center gap-1">
              <Coins className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Pontos Gerados</span>
              <span className="text-2xl font-bold">{integration.total_points}</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            {isActive ? "Integração Ativa" : "Configurar Credenciais"}
          </CardTitle>
          <CardDescription>
            {isActive
              ? "Sua integração está funcionando. Corridas finalizadas geram pontos automaticamente (1 Real = 1 ponto)."
              : "Insira suas credenciais da API TaxiMachine para ativar a pontuação automática de corridas."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isActive ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Credenciais configuradas</span>
              </div>
              {integration?.webhook_registered ? (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Webhook registrado na TaxiMachine</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span>Webhook não registrado — tente desativar e reativar</span>
                </div>
              )}
              <Button
                variant="destructive"
                onClick={() => deactivateMutation.mutate()}
                disabled={deactivateMutation.isPending}
              >
                {deactivateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Desativar Integração
              </Button>
            </div>
          ) : (
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="api_key">API Key</Label>
                <div className="relative">
                  <Input
                    id="api_key"
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Sua chave de API TaxiMachine"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="basic_user">Basic Auth Usuário</Label>
                <Input
                  id="basic_user"
                  value={basicUser}
                  onChange={(e) => setBasicUser(e.target.value)}
                  placeholder="Usuário de autenticação"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="basic_pass">Basic Auth Senha</Label>
                <div className="relative">
                  <Input
                    id="basic_pass"
                    type={showPass ? "text" : "password"}
                    value={basicPass}
                    onChange={(e) => setBasicPass(e.target.value)}
                    placeholder="Senha de autenticação"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                onClick={() => activateMutation.mutate()}
                disabled={activateMutation.isPending || !apiKey || !basicUser || !basicPass}
              >
                {activateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Ativar Integração
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook URL Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">URL do Webhook</CardTitle>
          <CardDescription>
            Cole esta URL na sua plataforma de mobilidade para receber eventos de corrida em tempo real.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted px-3 py-2 rounded text-xs font-mono break-all">
              {webhookUrl}
            </code>
            <Button variant="outline" size="icon" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Autenticação: header <code className="bg-muted px-1 rounded">x-api-secret</code> com a API Key configurada, ou campo <code className="bg-muted px-1 rounded">brand_id</code> no body.
          </p>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Como funciona?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Insira suas credenciais da API TaxiMachine acima.</p>
          <p>2. Ao ativar, registramos um webhook na TaxiMachine para receber eventos de corrida.</p>
          <p>3. Todos os eventos de status são registrados em tempo real (P, A, S, C, N, F).</p>
          <p>4. Quando uma corrida é finalizada (status "F"), o sistema busca o recibo e credita pontos.</p>
          <p>5. Se o passageiro tiver CPF cadastrado, os pontos são creditados automaticamente.</p>
          <p>6. Regra de pontos: <strong>1 Real = 1 ponto</strong> (arredondado para baixo).</p>
          <p className="text-xs">Exemplo: Corrida de R$ 15,80 → 15 pontos.</p>
        </CardContent>
      </Card>
    </div>
  );
}
