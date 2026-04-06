import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Key, UserPlus, Link, Copy, Check, Car, Users, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

function normalizeSlug(city: string, uf: string): string {
  const raw = `${city}-${uf}`.toLowerCase();
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function geocode(city: string, uf: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const q = encodeURIComponent(`${city}, ${uf}, Brasil`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`);
    const data = await res.json();
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {}
  return null;
}

export default function BrandBranchForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { currentBrandId } = useBrandGuard();
  const queryClient = useQueryClient();

  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [saving, setSaving] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState("");

  // Credenciais da cidade
  const [apiKey, setApiKey] = useState("");
  const [basicAuthUser, setBasicAuthUser] = useState("");
  const [basicAuthPassword, setBasicAuthPassword] = useState("");

  // Franqueado
  const [criarFranqueado, setCriarFranqueado] = useState(false);
  const [franqueadoEmail, setFranqueadoEmail] = useState("");
  const [franqueadoPassword, setFranqueadoPassword] = useState("123456");
  const [franqueadoNome, setFranqueadoNome] = useState("");
  const [emailJaExiste, setEmailJaExiste] = useState(false);
  const [verificandoEmail, setVerificandoEmail] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [scoringModel, setScoringModel] = useState("BOTH");
  const [isCityRedemptionEnabled, setIsCityRedemptionEnabled] = useState(false);

  // Gamificação de Motoristas
  const [enableDriverDuels, setEnableDriverDuels] = useState(false);
  const [enableCityRanking, setEnableCityRanking] = useState(false);
  const [enableCityBelt, setEnableCityBelt] = useState(false);
  const [allowPublicDuelViewing, setAllowPublicDuelViewing] = useState(false);

  // Load brand's default scoring model for new cities
  useEffect(() => {
    if (isEdit || !currentBrandId) return;
    supabase
      .from("brands")
      .select("brand_settings_json")
      .eq("id", currentBrandId)
      .single()
      .then(({ data }) => {
        if (data?.brand_settings_json && typeof data.brand_settings_json === "object" && !Array.isArray(data.brand_settings_json)) {
          const settings = data.brand_settings_json as Record<string, any>;
          if (settings.default_scoring_model) {
            setScoringModel(settings.default_scoring_model);
          }
        }
      });
  }, [isEdit, currentBrandId]);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const webhookUrl = isEdit && id && currentBrandId
    ? `https://${projectId}.supabase.co/functions/v1/machine-webhook?brand_id=${currentBrandId}&branch_id=${id}`
    : null;

  const handleCopyUrl = async () => {
    if (!webhookUrl) return;
    await navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    toast.success("URL copiada!");
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const { data: existing, isLoading } = useQuery({
    queryKey: ["brand-branch", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEdit,
  });

  // Load existing integration data (credentials + telegram)
  const { data: existingIntegration } = useQuery({
    queryKey: ["branch-integration", id, currentBrandId],
    queryFn: async () => {
      if (!id || !currentBrandId) return null;
      const { data } = await supabase
        .from("machine_integrations")
        .select("api_key, basic_auth_user, basic_auth_password, telegram_chat_id")
        .eq("brand_id", currentBrandId)
        .eq("branch_id", id)
        .maybeSingle();
      return data;
    },
    enabled: isEdit && !!currentBrandId,
  });

  useEffect(() => {
    if (existing) {
      setCidade(existing.city || existing.name || "");
      setUf(existing.state || "");
      setAtivo(existing.is_active);
      if ((existing as any).scoring_model) setScoringModel((existing as any).scoring_model);
      setIsCityRedemptionEnabled(!!(existing as any).is_city_redemption_enabled);
      // Gamificação flags
      const bs = existing.branch_settings_json as Record<string, any> | null;
      if (bs && typeof bs === "object") {
        setEnableDriverDuels(bs.enable_driver_duels === true);
        setEnableCityRanking(bs.enable_city_ranking === true);
        setEnableCityBelt(bs.enable_city_belt === true);
        setAllowPublicDuelViewing(bs.allow_public_duel_viewing === true);
      }
    }
  }, [existing]);

  useEffect(() => {
    if (existingIntegration) {
      if (existingIntegration.telegram_chat_id) setTelegramChatId(existingIntegration.telegram_chat_id);
      if (existingIntegration.api_key && !existingIntegration.api_key.startsWith("url-only-")) {
        setApiKey(existingIntegration.api_key);
      }
      if (existingIntegration.basic_auth_user) setBasicAuthUser(existingIntegration.basic_auth_user);
      if (existingIntegration.basic_auth_password) setBasicAuthPassword(existingIntegration.basic_auth_password);
    }
  }, [existingIntegration]);

  const verificarEmail = async (email: string) => {
    if (!email.trim() || !email.includes("@")) {
      setEmailJaExiste(false);
      return;
    }
    setVerificandoEmail(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();
      setEmailJaExiste(!!data);
    } catch {
      setEmailJaExiste(false);
    } finally {
      setVerificandoEmail(false);
    }
  };

  const handleSave = async () => {
    if (!cidade.trim() || !uf) {
      toast.error("Preencha a cidade e o estado.");
      return;
    }
    if (!currentBrandId) {
      toast.error("Marca não identificada.");
      return;
    }
    if (!isEdit && criarFranqueado && emailJaExiste) {
      toast.error("Este e-mail já está cadastrado. Use outro e-mail para o gestor.");
      return;
    }

    setSaving(true);
    try {
      const name = `${cidade.trim()} - ${uf}`;
      const slug = normalizeSlug(cidade.trim(), uf);
      const geo = await geocode(cidade.trim(), uf);

      // Merge existing branch_settings_json with gamification flags
      const existingSettings = (existing?.branch_settings_json && typeof existing.branch_settings_json === "object")
        ? (existing.branch_settings_json as Record<string, any>)
        : {};
      const branchSettingsJson = {
        ...existingSettings,
        enable_driver_duels: enableDriverDuels,
        enable_city_ranking: enableCityRanking,
        enable_city_belt: enableCityBelt,
        allow_public_duel_viewing: allowPublicDuelViewing,
      };

      const payload = {
        name,
        slug,
        city: cidade.trim(),
        state: uf,
        is_active: ativo,
        scoring_model: scoringModel,
        is_city_redemption_enabled: isCityRedemptionEnabled,
        branch_settings_json: branchSettingsJson,
        timezone: "America/Sao_Paulo",
        latitude: geo?.lat ?? null,
        longitude: geo?.lon ?? null,
        brand_id: currentBrandId,
      };

      let branchId = id;

      if (isEdit && id) {
        const { error } = await supabase.from("branches").update(payload).eq("id", id);
        if (error) throw error;
        toast.success("Cidade atualizada com sucesso!");
      } else {
        const { data: inserted, error } = await supabase
          .from("branches")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        branchId = inserted.id;
        toast.success("Cidade criada com sucesso!");
      }

      // Register integration credentials via edge function
      if (branchId && (basicAuthUser.trim() || apiKey.trim())) {
        const { error: fnError } = await supabase.functions.invoke("register-machine-webhook", {
          body: {
            brand_id: currentBrandId,
            branch_id: branchId,
            api_key: apiKey.trim() || undefined,
            basic_auth_user: basicAuthUser.trim(),
            basic_auth_password: basicAuthPassword.trim(),
            telegram_chat_id: telegramChatId.trim() || undefined,
          },
        });
        if (fnError) {
          console.error("Integration registration error:", fnError);
          toast.error("Cidade salva, mas houve erro ao registrar a integração.");
        }
      } else if (branchId && telegramChatId.trim()) {
        // Only telegram update, no credentials
        await supabase
          .from("machine_integrations")
          .update({ telegram_chat_id: telegramChatId.trim() })
          .eq("brand_id", currentBrandId)
          .eq("branch_id", branchId);
      }

      // Create franchisee user if requested
      if (!isEdit && criarFranqueado && franqueadoEmail.trim() && branchId) {
        const { data: fnResult, error: fnErr } = await supabase.functions.invoke("create-branch-admin", {
          body: {
            email: franqueadoEmail.trim(),
            password: franqueadoPassword || "123456",
            full_name: franqueadoNome.trim() || "Franqueado",
            brand_id: currentBrandId,
            branch_id: branchId,
          },
        });
        if (fnErr) {
          console.error("Franchisee creation error:", fnErr);
          toast.error("Cidade criada, mas houve erro ao criar o franqueado.");
        } else {
          toast.success(`Franqueado criado: ${franqueadoEmail.trim()}`);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["brand-branches"] });
      navigate("/brand-branches");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar cidade.");
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/brand-branches")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={isEdit ? "Editar Cidade" : "Nova Cidade"}
          description="Preencha apenas o essencial — os dados técnicos são gerados automaticamente."
        />
      </div>

      <Card className="rounded-xl">
        <CardContent className="p-5 space-y-5">
          <div className="space-y-2">
            <Label>Estado (UF)</Label>
            <Select value={uf} onValueChange={setUf}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input
              placeholder="Ex: Campinas"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Ativa</Label>
            <Switch checked={ativo} onCheckedChange={setAtivo} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Resgate na Cidade</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Habilita a troca de pontos por créditos em parceiros locais para motoristas.
              </p>
            </div>
            <Switch checked={isCityRedemptionEnabled} onCheckedChange={setIsCityRedemptionEnabled} />
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
            <p><strong>Nome gerado:</strong> {cidade.trim() && uf ? `${cidade.trim()} - ${uf}` : "—"}</p>
            <p><strong>Slug:</strong> {cidade.trim() && uf ? normalizeSlug(cidade.trim(), uf) : "—"}</p>
            <p><strong>Timezone:</strong> America/Sao_Paulo</p>
            <p><strong>Coordenadas:</strong> preenchidas automaticamente ao salvar</p>
          </div>
        </CardContent>
      </Card>

      {/* Modelo de Negócio */}
      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Modelo de Pontuação
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Define quem será pontuado nesta cidade: motorista, passageiro ou ambos.
          </p>
        </CardHeader>
        <CardContent>
          <RadioGroup value={scoringModel} onValueChange={setScoringModel} className="space-y-3">
            <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="DRIVER_ONLY" id="scoring-driver" />
              <Label htmlFor="scoring-driver" className="flex items-center gap-2 cursor-pointer flex-1">
                <Car className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Pontuar apenas Motorista</p>
                  <p className="text-xs text-muted-foreground">Foco em fidelização de motoristas</p>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="PASSENGER_ONLY" id="scoring-passenger" />
              <Label htmlFor="scoring-passenger" className="flex items-center gap-2 cursor-pointer flex-1">
                <Users className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Pontuar apenas Cliente</p>
                  <p className="text-xs text-muted-foreground">Foco em fidelização de passageiros</p>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="BOTH" id="scoring-both" />
              <Label htmlFor="scoring-both" className="flex items-center gap-2 cursor-pointer flex-1">
                <RefreshCw className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Pontuar Ambos</p>
                  <p className="text-xs text-muted-foreground">Motoristas e passageiros são pontuados</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" />
            Credenciais da Cidade
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Credenciais de acesso à API de mobilidade desta cidade. Necessárias para receber corridas em tempo real.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>API Key</Label>
            <Input
              placeholder="Chave de API da cidade"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Usuário</Label>
            <Input
              placeholder="Usuário de autenticação"
              value={basicAuthUser}
              onChange={(e) => setBasicAuthUser(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Senha</Label>
            <Input
              type="password"
              placeholder="Senha de autenticação"
              value={basicAuthPassword}
              onChange={(e) => setBasicAuthPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Chat ID do Telegram (opcional)</Label>
            <Input
              placeholder="Ex: -1001234567890"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Se informado, as notificações de corridas desta cidade serão enviadas para este grupo.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* URL do Webhook */}
      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Link className="h-4 w-4" />
            URL para Eventos (Webhook)
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Use esta URL para configurar o envio de corridas em tempo real para esta cidade.
          </p>
        </CardHeader>
        <CardContent>
          {webhookUrl ? (
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={webhookUrl}
                className="font-mono text-xs bg-muted/50"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={handleCopyUrl}
              >
                {copiedUrl ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              A URL será gerada automaticamente após salvar a cidade.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Franqueado / Gestor da Cidade */}
      {!isEdit && (
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Gestor da Cidade (Franqueado)
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Crie um usuário administrador para gerenciar esta cidade.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Criar gestor da cidade</Label>
              <Switch checked={criarFranqueado} onCheckedChange={setCriarFranqueado} />
            </div>

            {criarFranqueado && (
              <>
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    placeholder="Ex: João Silva"
                    value={franqueadoNome}
                    onChange={(e) => setFranqueadoNome(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail de acesso</Label>
                  <Input
                    type="email"
                    placeholder="franqueado@exemplo.com"
                    value={franqueadoEmail}
                    onChange={(e) => {
                      setFranqueadoEmail(e.target.value);
                      setEmailJaExiste(false);
                    }}
                    onBlur={() => verificarEmail(franqueadoEmail)}
                    className={emailJaExiste ? "border-destructive" : ""}
                  />
                  {verificandoEmail && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Verificando e-mail...
                    </p>
                  )}
                  {emailJaExiste && (
                    <p className="text-xs text-destructive">
                      Este e-mail já está cadastrado no sistema. Use outro e-mail.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input
                    type="password"
                    placeholder="Senha de acesso"
                    value={franqueadoPassword}
                    onChange={(e) => setFranqueadoPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Senha padrão: 123456. O franqueado poderá alterar após o login.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={() => navigate("/brand-branches")}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
          {isEdit ? "Salvar" : "Criar Cidade"}
        </Button>
      </div>
    </div>
  );
}
