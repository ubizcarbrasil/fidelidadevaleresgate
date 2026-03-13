import { useState } from "react";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Play, CheckCircle, XCircle, Loader2, AlertTriangle, User, Car, Coins } from "lucide-react";

interface TestResult {
  status: number;
  body: Record<string, unknown>;
  duration: number;
}

export default function MachineWebhookTestPage() {
  const { currentBrandId } = useBrandGuard();

  const [requestId, setRequestId] = useState(() => `TEST-${Date.now()}`);
  const [statusCode, setStatusCode] = useState("F");
  const [apiSecret, setApiSecret] = useState("");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const webhookUrl = `https://${projectId}.supabase.co/functions/v1/machine-webhook`;

  const handleTest = async () => {
    if (!apiSecret.trim()) {
      toast({ title: "API Secret obrigatório", description: "Informe o x-api-secret da integração.", variant: "destructive" });
      return;
    }

    setTesting(true);
    setResult(null);
    const start = performance.now();

    try {
      const payload: Record<string, unknown> = {
        request_id: requestId,
        status_code: statusCode,
      };
      if (currentBrandId) payload.brand_id = currentBrandId;

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-secret": apiSecret,
        },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      const duration = Math.round(performance.now() - start);

      setResult({ status: res.status, body, duration });

      if (res.ok) {
        toast({ title: "Teste executado ✅", description: `Resposta ${res.status} em ${duration}ms` });
      } else {
        toast({ title: "Erro no webhook", description: body.error || `Status ${res.status}`, variant: "destructive" });
      }
    } catch (err) {
      const duration = Math.round(performance.now() - start);
      setResult({ status: 0, body: { error: String(err) }, duration });
      toast({ title: "Erro de rede", description: String(err), variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const regenerateRequestId = () => setRequestId(`TEST-${Date.now()}`);

  const statusOk = result && result.status >= 200 && result.status < 300;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teste do Webhook TaxiMachine"
        description="Simule chamadas ao webhook machine-webhook para validar a integração."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Request Config */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Car className="h-4 w-4" />
              Configurar Requisição
            </CardTitle>
            <CardDescription>
              Preencha os campos e clique em "Executar Teste" para simular um webhook.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiSecret">x-api-secret (API Key da integração)</Label>
              <Input
                id="apiSecret"
                type="password"
                placeholder="Cole aqui a API Key da integração TaxiMachine"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Encontre na página TaxiMachine → campo "API Key"
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestId">request_id (ID da corrida)</Label>
              <div className="flex gap-2">
                <Input
                  id="requestId"
                  value={requestId}
                  onChange={(e) => setRequestId(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={regenerateRequestId}>
                  Novo ID
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Cada request_id só é processado uma vez (anti-duplicidade). Gere um novo para cada teste.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="statusCode">status_code</Label>
              <div className="flex gap-2">
                {["F", "A", "C", "P"].map((code) => (
                  <Button
                    key={code}
                    variant={statusCode === code ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusCode(code)}
                  >
                    {code}
                    {code === "F" && <span className="ml-1 text-xs opacity-70">(Finalizada)</span>}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Apenas <Badge variant="secondary" className="text-xs">F</Badge> (Finalizada) credita pontos. Outros status são ignorados.
              </p>
            </div>

            <Separator />

            <div className="rounded-md bg-muted p-3 text-xs font-mono break-all">
              <p className="font-semibold text-muted-foreground mb-1">Endpoint:</p>
              <p className="text-foreground">{webhookUrl}</p>
            </div>

            <Button
              onClick={handleTest}
              disabled={testing}
              className="w-full"
              size="lg"
            >
              {testing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Executando...</>
              ) : (
                <><Play className="h-4 w-4 mr-2" /> Executar Teste</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {result ? (
                statusOk ? <CheckCircle className="h-4 w-4 text-primary" /> : <XCircle className="h-4 w-4 text-destructive" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              )}
              Resultado
            </CardTitle>
            {result && (
              <CardDescription>
                Status <Badge variant={statusOk ? "default" : "destructive"}>{result.status}</Badge> em {result.duration}ms
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Car className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">Execute um teste para ver o resultado aqui.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary cards */}
                {statusOk && result.body && (
                  <div className="grid grid-cols-2 gap-3">
                    {result.body.customer_found !== undefined && (
                      <div className="flex items-center gap-2 rounded-lg border p-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Cliente</p>
                          <p className="text-sm font-medium">
                            {result.body.customer_found ? "Encontrado ✅" : "Não encontrado"}
                          </p>
                        </div>
                      </div>
                    )}
                    {result.body.points_credited !== undefined && (
                      <div className="flex items-center gap-2 rounded-lg border p-3">
                        <Coins className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Pontos</p>
                          <p className="text-sm font-medium">{String(result.body.points_credited)}</p>
                        </div>
                      </div>
                    )}
                    {result.body.ride_value !== undefined && (
                      <div className="flex items-center gap-2 rounded-lg border p-3">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Valor da corrida</p>
                          <p className="text-sm font-medium">R$ {Number(result.body.ride_value).toFixed(2)}</p>
                        </div>
                      </div>
                    )}
                    {result.body.machine_ride_id && (
                      <div className="flex items-center gap-2 rounded-lg border p-3">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Ride ID</p>
                          <p className="text-sm font-medium font-mono">{String(result.body.machine_ride_id)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Raw JSON */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Resposta completa (JSON):</p>
                  <pre className="rounded-md bg-muted p-3 text-xs font-mono overflow-auto max-h-64 whitespace-pre-wrap">
                    {JSON.stringify(result.body, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Help */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como funciona o fluxo</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>O webhook recebe o <code className="bg-muted px-1 rounded">request_id</code> e <code className="bg-muted px-1 rounded">status_code</code></li>
            <li>Se <code className="bg-muted px-1 rounded">status_code ≠ "F"</code>, o evento é ignorado (corrida não finalizada)</li>
            <li>A integração é localizada pelo <code className="bg-muted px-1 rounded">x-api-secret</code> ou <code className="bg-muted px-1 rounded">brand_id</code></li>
            <li>O webhook consulta a API TaxiMachine para obter valor e CPF do passageiro</li>
            <li>Se o CPF é encontrado, o cliente recebe os pontos (1 ponto por real)</li>
            <li>Se o CPF não é encontrado, um novo cliente é <strong>criado automaticamente</strong></li>
            <li>Registros de auditoria são gerados em cada etapa</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
