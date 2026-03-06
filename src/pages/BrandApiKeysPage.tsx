import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Key, Copy, Trash2, Plus, Eye, EyeOff, Code2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const prefix = "dk_";
  let key = prefix;
  for (let i = 0; i < 40; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

export default function BrandApiKeysPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { currentBrandId } = useBrandGuard();
  const [newLabel, setNewLabel] = useState("default");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showDocs, setShowDocs] = useState(false);

  const { data: keys, isLoading } = useQuery({
    queryKey: ["brand-api-keys", currentBrandId],
    queryFn: async () => {
      if (!currentBrandId) return [];
      const { data, error } = await supabase
        .from("brand_api_keys")
        .select("*")
        .eq("brand_id", currentBrandId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentBrandId,
  });

  const createKey = useMutation({
    mutationFn: async () => {
      if (!currentBrandId || !user) throw new Error("Contexto inválido");
      const rawKey = generateApiKey();
      const hash = await sha256(rawKey);
      const prefix = rawKey.substring(0, 11); // "dk_" + 8 chars

      const { error } = await supabase.from("brand_api_keys").insert({
        brand_id: currentBrandId,
        label: newLabel.trim() || "default",
        api_key_hash: hash,
        api_key_prefix: prefix,
        created_by: user.id,
      } as any);
      if (error) throw error;
      return rawKey;
    },
    onSuccess: (key) => {
      setGeneratedKey(key);
      setNewLabel("default");
      qc.invalidateQueries({ queryKey: ["brand-api-keys"] });
      toast.success("Chave API criada com sucesso!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeKey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("brand_api_keys")
        .update({ is_active: false } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand-api-keys"] });
      toast.success("Chave revogada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/earn-webhook`;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Key className="h-6 w-6" /> Integrações API
        </h2>
        <p className="text-muted-foreground">
          Gerencie chaves de API para integração com sistemas externos (ex: apps de transporte, delivery)
        </p>
      </div>

      {/* Generated key alert */}
      {generatedKey && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-sm">Chave criada! Copie agora — ela não será exibida novamente.</p>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-3 py-2 rounded text-sm font-mono break-all flex-1">
                    {generatedKey}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedKey);
                      toast.success("Copiado!");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setGeneratedKey(null)}>
              Entendido, já copiei
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create new key */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gerar Nova Chave</CardTitle>
          <CardDescription>
            Crie uma chave para permitir que sistemas externos pontuem clientes automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-2">
              <Label>Rótulo da chave</Label>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Ex: Ubiz Car, App Delivery..."
                maxLength={50}
              />
            </div>
            <Button onClick={() => createKey.mutate()} disabled={createKey.isPending}>
              <Plus className="h-4 w-4 mr-2" />
              {createKey.isPending ? "Gerando..." : "Gerar Chave"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active keys */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Chaves Ativas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : !keys || keys.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma chave criada ainda.</p>
          ) : (
            <div className="divide-y">
              {keys.map((k: any) => (
                <div key={k.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{k.label}</span>
                      <Badge variant={k.is_active ? "default" : "secondary"}>
                        {k.is_active ? "Ativa" : "Revogada"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {k.api_key_prefix}••••••••
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Criada em {format(new Date(k.created_at), "dd/MM/yyyy HH:mm")}
                      {k.last_used_at && ` · Último uso: ${format(new Date(k.last_used_at), "dd/MM/yyyy HH:mm")}`}
                    </p>
                  </div>
                  {k.is_active && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm("Revogar esta chave? Sistemas que a usam deixarão de funcionar.")) {
                          revokeKey.mutate(k.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Revogar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Docs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Code2 className="h-5 w-5" /> Documentação da API
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setShowDocs(!showDocs)}>
            {showDocs ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {showDocs ? "Ocultar" : "Mostrar"}
          </Button>
        </CardHeader>
        {showDocs && (
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">ENDPOINT</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-muted px-3 py-2 rounded text-sm font-mono break-all flex-1">
                  POST {webhookUrl}
                </code>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(webhookUrl);
                    toast.success("URL copiada!");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">HEADERS</Label>
              <pre className="bg-muted p-3 rounded text-xs font-mono mt-1 overflow-x-auto">
{`Content-Type: application/json
x-api-key: dk_SuaChaveAqui...`}
              </pre>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">BODY (JSON)</Label>
              <pre className="bg-muted p-3 rounded text-xs font-mono mt-1 overflow-x-auto">
{`{
  "cpf": "12345678900",
  "store_id": "uuid-do-parceiro",
  "purchase_value": 25.50,
  "receipt_code": "CORRIDA-12345"
}`}
              </pre>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">CAMPOS</Label>
              <div className="mt-1 text-sm space-y-1">
                <p><code className="bg-muted px-1 rounded">cpf</code> — CPF do cliente (apenas dígitos) <Badge variant="outline" className="ml-1 text-xs">obrigatório</Badge></p>
                <p><code className="bg-muted px-1 rounded">store_id</code> — UUID do parceiro <Badge variant="outline" className="ml-1 text-xs">obrigatório</Badge></p>
                <p><code className="bg-muted px-1 rounded">purchase_value</code> — Valor em R$ <Badge variant="outline" className="ml-1 text-xs">obrigatório</Badge></p>
                <p><code className="bg-muted px-1 rounded">receipt_code</code> — Código do comprovante <Badge variant="secondary" className="ml-1 text-xs">opcional</Badge></p>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">RESPOSTA DE SUCESSO (200)</Label>
              <pre className="bg-muted p-3 rounded text-xs font-mono mt-1 overflow-x-auto">
{`{
  "ok": true,
  "data": {
    "earning_event_id": "uuid",
    "points_earned": 25,
    "money_earned": 2.50,
    "new_balance": 125,
    "customer_name": "João"
  }
}`}
              </pre>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">EXEMPLO CURL</Label>
              <pre className="bg-muted p-3 rounded text-xs font-mono mt-1 overflow-x-auto whitespace-pre-wrap">
{`curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: dk_SuaChaveAqui" \\
  -d '{"cpf":"12345678900","store_id":"uuid","purchase_value":25.50,"receipt_code":"TRIP-001"}'`}
              </pre>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
