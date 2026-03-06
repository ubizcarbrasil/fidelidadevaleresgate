import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Copy, CheckCircle2, XCircle, AlertTriangle, Clock, Send, BookOpen,
  Terminal, Code2, Braces, ArrowRight, Shield, Zap, FileCode2,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const WEBHOOK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/earn-webhook`;

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  return (
    <div className="relative group">
      <pre className="bg-muted/80 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
        {code}
      </pre>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => {
          navigator.clipboard.writeText(code);
          toast.success("Código copiado!");
        }}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function StatusBadge({ code, label }: { code: number; label: string }) {
  const variant = code >= 200 && code < 300 ? "default" : code >= 400 && code < 500 ? "outline" : "destructive";
  const Icon = code >= 200 && code < 300 ? CheckCircle2 : code === 429 ? Clock : XCircle;
  return (
    <div className="flex items-center gap-2">
      <Badge variant={variant} className="font-mono text-xs">
        <Icon className="h-3 w-3 mr-1" />
        {code}
      </Badge>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

const ERROR_CODES = [
  { code: 200, label: "Sucesso — pontos creditados", description: 'Retorna os dados do evento com "ok": true' },
  { code: 400, label: "Payload inválido", description: "JSON malformado, campos obrigatórios ausentes, CPF inválido ou receipt_code obrigatório faltando" },
  { code: 401, label: "API key ausente", description: "Header x-api-key não informado na requisição" },
  { code: 403, label: "API key inválida ou revogada", description: "A chave informada não existe ou foi desativada" },
  { code: 404, label: "Recurso não encontrado", description: "Loja inativa/inexistente para esta marca ou CPF não cadastrado" },
  { code: 405, label: "Método não permitido", description: "Use apenas POST. GET, PUT, DELETE não são aceitos" },
  { code: 409, label: "Receipt duplicado", description: "Já existe um evento de pontuação com este receipt_code para esta loja" },
  { code: 422, label: "Regra de negócio violada", description: "Compra abaixo do mínimo ou nenhuma regra de pontos ativa encontrada" },
  { code: 429, label: "Limite diário atingido", description: "O cliente ou a loja excedeu o limite diário de pontos configurado na regra" },
  { code: 500, label: "Erro interno", description: "Falha ao inserir o evento. Tente novamente ou contate o suporte" },
];

const FIELDS = [
  { name: "cpf", type: "string", required: true, desc: "CPF do cliente (apenas dígitos, 11 a 14 chars)" },
  { name: "store_id", type: "uuid", required: true, desc: "UUID do parceiro cadastrado na plataforma" },
  { name: "purchase_value", type: "number", required: true, desc: "Valor da compra/corrida em Reais (ex: 25.50)" },
  { name: "receipt_code", type: "string", required: false, desc: "Código único do comprovante (ex: TRIP-12345). Pode ser obrigatório conforme regra da marca" },
];

export default function ApiDocsPage() {
  const [testCpf, setTestCpf] = useState("12345678900");
  const [testStoreId, setTestStoreId] = useState("uuid-do-parceiro");
  const [testValue, setTestValue] = useState("25.50");
  const [testReceipt, setTestReceipt] = useState("CORRIDA-001");
  const [testApiKey, setTestApiKey] = useState("dk_SuaChaveAqui");

  const curlExample = useMemo(
    () =>
      `curl -X POST "${WEBHOOK_URL}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${testApiKey}" \\
  -d '{
    "cpf": "${testCpf}",
    "store_id": "${testStoreId}",
    "purchase_value": ${testValue},
    "receipt_code": "${testReceipt}"
  }'`,
    [testCpf, testStoreId, testValue, testReceipt, testApiKey]
  );

  const pythonExample = useMemo(
    () =>
      `import requests

url = "${WEBHOOK_URL}"

headers = {
    "Content-Type": "application/json",
    "x-api-key": "${testApiKey}"
}

payload = {
    "cpf": "${testCpf}",
    "store_id": "${testStoreId}",
    "purchase_value": ${testValue},
    "receipt_code": "${testReceipt}"
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()

if data["ok"]:
    print(f"✅ {data['data']['points_earned']} pontos creditados!")
    print(f"   Saldo atual: {data['data']['new_balance']}")
else:
    print(f"❌ Erro: {data['error']}")`,
    [testCpf, testStoreId, testValue, testReceipt, testApiKey]
  );

  const nodeExample = useMemo(
    () =>
      `const response = await fetch("${WEBHOOK_URL}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "${testApiKey}",
  },
  body: JSON.stringify({
    cpf: "${testCpf}",
    store_id: "${testStoreId}",
    purchase_value: ${testValue},
    receipt_code: "${testReceipt}",
  }),
});

const data = await response.json();

if (data.ok) {
  console.log(\`✅ \${data.data.points_earned} pontos creditados!\`);
  console.log(\`   Saldo atual: \${data.data.new_balance}\`);
} else {
  console.error(\`❌ Erro: \${data.error}\`);
}`,
    [testCpf, testStoreId, testValue, testReceipt, testApiKey]
  );

  const phpExample = useMemo(
    () =>
      `<?php

$url = "${WEBHOOK_URL}";

$payload = json_encode([
    "cpf"            => "${testCpf}",
    "store_id"       => "${testStoreId}",
    "purchase_value" => ${testValue},
    "receipt_code"   => "${testReceipt}",
]);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        "Content-Type: application/json",
        "x-api-key: ${testApiKey}",
    ],
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = json_decode($response, true);

if ($data["ok"]) {
    echo "✅ " . $data["data"]["points_earned"] . " pontos creditados!\\n";
    echo "   Saldo atual: " . $data["data"]["new_balance"] . "\\n";
} else {
    echo "❌ Erro: " . $data["error"] . "\\n";
}`,
    [testCpf, testStoreId, testValue, testReceipt, testApiKey]
  );

  const csharpExample = useMemo(
    () =>
      `using var client = new HttpClient();

client.DefaultRequestHeaders.Add("x-api-key", "${testApiKey}");

var payload = new {
    cpf = "${testCpf}",
    store_id = "${testStoreId}",
    purchase_value = ${testValue},
    receipt_code = "${testReceipt}"
};

var json = System.Text.Json.JsonSerializer.Serialize(payload);
var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

var response = await client.PostAsync("${WEBHOOK_URL}", content);
var body = await response.Content.ReadAsStringAsync();

Console.WriteLine(body);`,
    [testCpf, testStoreId, testValue, testReceipt, testApiKey]
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="h-6 w-6" /> Documentação da API
        </h1>
        <p className="text-muted-foreground mt-1">
          Guia completo para integrar sistemas externos com o webhook de pontuação automática
        </p>
      </div>

      {/* Quick overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-5 flex items-start gap-3">
            <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Pontuação instantânea</p>
              <p className="text-xs text-muted-foreground mt-0.5">Credite pontos em tempo real ao final de cada transação</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-5 flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Anti-fraude integrado</p>
              <p className="text-xs text-muted-foreground mt-0.5">Limites diários, compra mínima e código de recibo único</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-5 flex items-start gap-3">
            <FileCode2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">REST simples</p>
              <p className="text-xs text-muted-foreground mt-0.5">Uma única chamada POST com JSON — sem SDK obrigatório</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Endpoint */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Terminal className="h-5 w-5" /> Endpoint
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs px-2.5">POST</Badge>
            <code className="bg-muted px-3 py-2 rounded text-sm font-mono break-all flex-1">{WEBHOOK_URL}</code>
            <Button
              size="icon"
              variant="outline"
              className="shrink-0"
              onClick={() => {
                navigator.clipboard.writeText(WEBHOOK_URL);
                toast.success("URL copiada!");
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Headers obrigatórios</p>
            <div className="bg-muted/50 border rounded-lg p-3 space-y-1.5 font-mono text-xs">
              <div className="flex gap-2">
                <span className="text-primary font-semibold">Content-Type:</span>
                <span>application/json</span>
              </div>
              <div className="flex gap-2">
                <span className="text-primary font-semibold">x-api-key:</span>
                <span className="text-muted-foreground">sua_chave_api_aqui</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Braces className="h-5 w-5" /> Campos do Request Body
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-4 py-2.5 font-medium">Campo</th>
                  <th className="text-left px-4 py-2.5 font-medium">Tipo</th>
                  <th className="text-left px-4 py-2.5 font-medium">Obrigatório</th>
                  <th className="text-left px-4 py-2.5 font-medium">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {FIELDS.map((f) => (
                  <tr key={f.name} className="border-b last:border-0">
                    <td className="px-4 py-2.5 font-mono text-xs text-primary">{f.name}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="secondary" className="text-xs font-mono">{f.type}</Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      {f.required ? (
                        <Badge variant="outline" className="text-xs">sim</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">não</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{f.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Interactive builder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="h-5 w-5" /> Construtor Interativo
          </CardTitle>
          <CardDescription>
            Preencha os campos abaixo e veja os exemplos de código atualizados automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">API Key</Label>
              <Input
                value={testApiKey}
                onChange={(e) => setTestApiKey(e.target.value)}
                placeholder="dk_SuaChaveAqui"
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">CPF</Label>
              <Input
                value={testCpf}
                onChange={(e) => setTestCpf(e.target.value)}
                placeholder="12345678900"
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Store ID</Label>
              <Input
                value={testStoreId}
                onChange={(e) => setTestStoreId(e.target.value)}
                placeholder="uuid-do-parceiro"
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Valor da compra (R$)</Label>
              <Input
                value={testValue}
                onChange={(e) => setTestValue(e.target.value)}
                placeholder="25.50"
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs">Receipt Code (opcional)</Label>
              <Input
                value={testReceipt}
                onChange={(e) => setTestReceipt(e.target.value)}
                placeholder="CORRIDA-001"
                className="font-mono text-xs"
              />
            </div>
          </div>

          <Separator />

          <Tabs defaultValue="curl" className="w-full">
            <TabsList className="w-full flex flex-wrap h-auto gap-1">
              <TabsTrigger value="curl" className="flex items-center gap-1.5 text-xs">
                <Terminal className="h-3.5 w-3.5" /> cURL
              </TabsTrigger>
              <TabsTrigger value="node" className="flex items-center gap-1.5 text-xs">
                <Code2 className="h-3.5 w-3.5" /> Node.js
              </TabsTrigger>
              <TabsTrigger value="python" className="flex items-center gap-1.5 text-xs">
                <FileCode2 className="h-3.5 w-3.5" /> Python
              </TabsTrigger>
              <TabsTrigger value="php" className="flex items-center gap-1.5 text-xs">
                <FileCode2 className="h-3.5 w-3.5" /> PHP
              </TabsTrigger>
              <TabsTrigger value="csharp" className="flex items-center gap-1.5 text-xs">
                <FileCode2 className="h-3.5 w-3.5" /> C#
              </TabsTrigger>
            </TabsList>

            <TabsContent value="curl" className="mt-4">
              <CodeBlock code={curlExample} lang="bash" />
            </TabsContent>
            <TabsContent value="node" className="mt-4">
              <CodeBlock code={nodeExample} lang="javascript" />
            </TabsContent>
            <TabsContent value="python" className="mt-4">
              <CodeBlock code={pythonExample} lang="python" />
            </TabsContent>
            <TabsContent value="php" className="mt-4">
              <CodeBlock code={phpExample} lang="php" />
            </TabsContent>
            <TabsContent value="csharp" className="mt-4">
              <CodeBlock code={csharpExample} lang="csharp" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Response examples */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" /> Respostas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-600 hover:bg-green-700 text-white font-mono text-xs">200</Badge>
              <span className="text-sm font-medium">Sucesso</span>
            </div>
            <CodeBlock
              code={`{
  "ok": true,
  "data": {
    "earning_event_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "points_earned": 25,
    "money_earned": 2.50,
    "new_balance": 125,
    "customer_name": "João Silva"
  }
}`}
              lang="json"
            />
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="destructive" className="font-mono text-xs">4xx / 5xx</Badge>
              <span className="text-sm font-medium">Erro</span>
            </div>
            <CodeBlock
              code={`{
  "ok": false,
  "error": "Mensagem descritiva do erro"
}`}
              lang="json"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error codes reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Referência de Códigos HTTP
          </CardTitle>
          <CardDescription>Todos os possíveis status retornados pela API</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {ERROR_CODES.map((ec) => (
              <AccordionItem key={ec.code} value={String(ec.code)}>
                <AccordionTrigger className="hover:no-underline py-3">
                  <StatusBadge code={ec.code} label={ec.label} />
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pl-12">
                  {ec.description}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Integration flow */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowRight className="h-5 w-5" /> Fluxo de Integração
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { step: 1, title: "Gere sua API Key", desc: 'Acesse "Integrações API" no painel e crie uma nova chave. Copie-a imediatamente — ela só aparece uma vez.' },
              { step: 2, title: "Configure no sistema externo", desc: "Adicione o endpoint e a API key no seu sistema (app de transporte, delivery, PDV, etc)." },
              { step: 3, title: "Envie o webhook", desc: "Ao final de cada transação, faça um POST com CPF, store_id, valor e receipt_code." },
              { step: 4, title: "Pontos creditados!", desc: "O cliente recebe pontos instantaneamente. Verifique o saldo retornado no campo new_balance." },
            ].map((s) => (
              <div key={s.step} className="flex gap-4 items-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {s.step}
                </div>
                <div>
                  <p className="font-semibold text-sm">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Best practices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" /> Boas Práticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
              <p className="font-semibold">🔑 Proteja sua API Key</p>
              <p className="text-xs text-muted-foreground">Nunca exponha a chave no frontend ou em repositórios públicos. Use variáveis de ambiente.</p>
            </div>
            <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
              <p className="font-semibold">🧾 Use receipt_code</p>
              <p className="text-xs text-muted-foreground">Envie sempre um código único por transação para evitar duplicatas e facilitar auditoria.</p>
            </div>
            <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
              <p className="font-semibold">🔄 Trate respostas de erro</p>
              <p className="text-xs text-muted-foreground">Verifique o campo "ok" e o status HTTP. Implemente retry com backoff para erros 5xx.</p>
            </div>
            <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
              <p className="font-semibold">⚡ Envio assíncrono</p>
              <p className="text-xs text-muted-foreground">Faça a chamada de forma assíncrona para não bloquear o fluxo principal do seu app.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
