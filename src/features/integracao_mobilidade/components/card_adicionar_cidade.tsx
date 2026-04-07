import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import {
  Plus, Power, Loader2, Eye, EyeOff, CheckCircle, Check, Copy,
} from "lucide-react";
import type { Branch, Integration } from "../hooks/hook_integracoes";

interface Props {
  brandId: string;
  availableBranches: Branch[];
  branches: Branch[];
  activeIntegrations: Integration[];
}

export function CardAdicionarCidade({ brandId, availableBranches, branches, activeIntegrations }: Props) {
  const queryClient = useQueryClient();
  const webhookBaseUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/machine-webhook`;

  const [activatingBranchId, setActivatingBranchId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [basicUser, setBasicUser] = useState("");
  const [basicPass, setBasicPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [webhookMode, setWebhookMode] = useState<"auto" | "manual">("auto");
  const [activatedWebhookUrl, setActivatedWebhookUrl] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const activateMutation = useMutation({
    mutationFn: async () => {
      if (!activatingBranchId) throw new Error("Selecione uma cidade");
      const body: Record<string, string> = {
        brand_id: brandId,
        branch_id: activatingBranchId,
        basic_auth_user: basicUser,
        basic_auth_password: basicPass,
      };
      if (apiKey) body.api_key = apiKey;
      const { data, error } = await supabase.functions.invoke("register-machine-webhook", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      if (webhookMode === "manual") {
        const url = `${webhookBaseUrl}?brand_id=${encodeURIComponent(brandId)}&branch_id=${encodeURIComponent(activatingBranchId)}`;
        setActivatedWebhookUrl(data.webhook_url || url);
        toast({ title: "Cidade ativada!", description: "Copie a URL abaixo e cole no roteador de status da TaxiMachine." });
      } else {
        toast({
          title: "Integração ativada!",
          description: data.webhook_registered ? "Webhook registrado automaticamente." : "Ativada, mas o registro automático falhou. Copie a URL manualmente.",
        });
        if (!data.webhook_registered) {
          const url = `${webhookBaseUrl}?brand_id=${encodeURIComponent(brandId)}&branch_id=${encodeURIComponent(activatingBranchId)}`;
          setActivatedWebhookUrl(url);
        }
      }
      setApiKey("");
      setBasicUser("");
      setBasicPass("");
      setActivatingBranchId("");
      queryClient.invalidateQueries({ queryKey: ["machine-integrations"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao ativar", description: err.message || "Falha ao ativar.", variant: "destructive" });
    },
  });

  return (
    <Card className={availableBranches.length > 0 ? "border-yellow-500/40 shadow-[0_0_0_1px_hsl(var(--primary)/0.1)]" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          {activeIntegrations.length > 0 ? "Adicionar nova cidade" : "Ativar integração"}
          {availableBranches.length > 0 && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-400 text-xs ml-1">
              {availableBranches.length} pendente{availableBranches.length > 1 ? "s" : ""}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Informe as credenciais da <strong>cidade</strong> na TaxiMachine. Essas credenciais são usadas para <strong>pontuar motoristas</strong> e <strong>enviar notificações</strong> — são diferentes das credenciais da Matriz (usadas para pontuar passageiros).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cidade */}
        <div className="space-y-2">
          <Label>Cidade</Label>
          {availableBranches.length > 0 ? (
            <Select value={activatingBranchId} onValueChange={(v) => { setActivatingBranchId(v); setActivatedWebhookUrl(null); }}>
              <SelectTrigger><SelectValue placeholder="Selecione a cidade..." /></SelectTrigger>
              <SelectContent>{availableBranches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-muted-foreground">
              {branches.length === 0 ? "Nenhuma cidade cadastrada. Crie uma cidade antes." : "Todas as cidades já estão conectadas."}
            </p>
          )}
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <Label>API Key da Cidade (para motorista + notificações)</Label>
          <div className="relative">
            <Input type={showApiKey ? "text" : "password"} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Token fornecido pela TaxiMachine para esta cidade" />
            <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowApiKey(!showApiKey)}>
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Necessária para registrar o webhook automaticamente. Se não tiver, use o modo manual.</p>
        </div>

        {/* Usuário */}
        <div className="space-y-2">
          <Label>Usuário da Cidade (Basic Auth)</Label>
          <Input value={basicUser} onChange={(e) => setBasicUser(e.target.value)} placeholder="Usuário de autenticação desta cidade" />
        </div>

        {/* Senha */}
        <div className="space-y-2">
          <Label>Senha da Cidade (Basic Auth)</Label>
          <div className="relative">
            <Input type={showPass ? "text" : "password"} value={basicPass} onChange={(e) => setBasicPass(e.target.value)} placeholder="Senha de autenticação desta cidade" />
            <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPass(!showPass)}>
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Usuário e senha da cidade são usados para receber corridas via webhook (pontuar motorista) e enviar mensagens no app (notificações).</p>
        </div>

        {/* Modo do webhook */}
        <div className="space-y-2">
          <Label>Como registrar o webhook?</Label>
          <RadioGroup value={webhookMode} onValueChange={(v) => setWebhookMode(v as "auto" | "manual")} className="flex flex-col gap-2 sm:flex-row sm:gap-4">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="auto" id="webhook-auto" />
              <Label htmlFor="webhook-auto" className="text-sm font-normal cursor-pointer">Automático</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="manual" id="webhook-manual" />
              <Label htmlFor="webhook-manual" className="text-sm font-normal cursor-pointer">Manual (copiar URL)</Label>
            </div>
          </RadioGroup>
          <p className="text-xs text-muted-foreground">
            {webhookMode === "auto"
              ? "O sistema registrará o webhook automaticamente na TaxiMachine usando a API Key."
              : "Após ativar, você receberá uma URL para colar manualmente no roteador de status."}
          </p>
        </div>

        <Button className="w-full sm:w-auto" onClick={() => activateMutation.mutate()} disabled={activateMutation.isPending || !basicUser || !basicPass || !activatingBranchId}>
          {activateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Power className="h-4 w-4 mr-1" /> Ativar cidade
        </Button>

        {activatedWebhookUrl && (
          <Alert className="border-primary/30 bg-primary/5">
            <CheckCircle className="h-4 w-4 text-primary" />
            <AlertTitle>Cidade ativada!</AlertTitle>
            <AlertDescription className="space-y-2">
              <p className="text-sm">Copie a URL abaixo e cole no roteador de status da TaxiMachine:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded text-xs font-mono break-all border border-border">{activatedWebhookUrl}</code>
                <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(activatedWebhookUrl); setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2000); }}>
                  {copiedUrl ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
