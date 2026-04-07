import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ScoredCustomersPanel from "@/components/machine-integration/ScoredCustomersPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import {
  KeyRound, Eye, EyeOff, Save, Check, Loader2, CheckCircle,
  Trophy, User, Phone, MapPin, Coins, Radio,
} from "lucide-react";
import type { Integration, BrandMatrix } from "../hooks/hook_integracoes";

interface Props {
  brandId: string;
  activeIntegrations: Integration[];
  brandMatrix: BrandMatrix;
  selectedIntegration: Integration | null;
  getBranchName: (id: string | null) => string;
}

export function AbaPontuarPassageiro({
  brandId,
  activeIntegrations,
  brandMatrix,
  selectedIntegration,
  getBranchName,
}: Props) {
  const queryClient = useQueryClient();

  // Matrix credentials
  const [matrixApiKey, setMatrixApiKey] = useState("");
  const [showMatrixApiKey, setShowMatrixApiKey] = useState(false);
  const [matrixBasicUser, setMatrixBasicUser] = useState("");
  const [matrixBasicPass, setMatrixBasicPass] = useState("");
  const [showMatrixPass, setShowMatrixPass] = useState(false);
  const [matrixSaved, setMatrixSaved] = useState(false);

  // Notifications feed
  const [liveNotifications, setLiveNotifications] = useState<any[]>([]);
  const [identifyNotif, setIdentifyNotif] = useState<any>(null);
  const [identifyForm, setIdentifyForm] = useState({ name: "", cpf: "", phone: "" });

  useEffect(() => {
    if (brandMatrix) {
      setMatrixApiKey(brandMatrix.matrix_api_key || "");
      setMatrixBasicUser(brandMatrix.matrix_basic_auth_user || "");
      setMatrixBasicPass(brandMatrix.matrix_basic_auth_password || "");
    }
  }, [brandMatrix]);

  // Load initial notifications
  useEffect(() => {
    if (!brandId) return;
    (supabase as any)
      .from("machine_ride_notifications")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }: { data: any[] | null }) => {
        if (data) setLiveNotifications(data);
      });
  }, [brandId]);

  // Realtime notifications
  useEffect(() => {
    if (!brandId) return;
    const channel = supabase
      .channel(`ride-notifs-pass-${brandId}`)
      .on("postgres_changes" as any, {
        event: "INSERT",
        schema: "public",
        table: "machine_ride_notifications",
        filter: `brand_id=eq.${brandId}`,
      }, (payload: any) => {
        setLiveNotifications((prev) => [payload.new, ...prev].slice(0, 50));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [brandId]);

  // Preferred endpoint
  const handleEndpointChange = async (val: string) => {
    if (!selectedIntegration?.id) return;
    const { error } = await (supabase as any)
      .from("machine_integrations")
      .update({ preferred_endpoint: val })
      .eq("id", selectedIntegration.id);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Endpoint primário atualizado" });
      queryClient.invalidateQueries({ queryKey: ["machine-integrations"] });
    }
  };

  const saveMatrixMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from("brands")
        .update({
          matrix_api_key: matrixApiKey || null,
          matrix_basic_auth_user: matrixBasicUser || null,
          matrix_basic_auth_password: matrixBasicPass || null,
        })
        .eq("id", brandId);
      if (error) throw error;
    },
    onSuccess: () => {
      setMatrixSaved(true);
      setTimeout(() => setMatrixSaved(false), 2000);
      toast({ title: "Credenciais da matriz salvas!" });
      queryClient.invalidateQueries({ queryKey: ["brand-matrix", brandId] });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      {/* Credenciais da Matriz */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-5 w-5 text-primary" />
            Credenciais da Matriz (Sede)
          </CardTitle>
          <CardDescription>
            Configuração única para todas as cidades. A API da Matriz é usada para buscar recibos e identificar passageiros (CPF, telefone, nome).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-lg">
          <div className="space-y-2">
            <Label>Chave API da Matriz</Label>
            <div className="relative">
              <Input
                type={showMatrixApiKey ? "text" : "password"}
                value={matrixApiKey}
                onChange={(e) => setMatrixApiKey(e.target.value)}
                placeholder="api-key da matriz"
              />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowMatrixApiKey(!showMatrixApiKey)}>
                {showMatrixApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Usuário Basic Auth da Matriz</Label>
            <Input value={matrixBasicUser} onChange={(e) => setMatrixBasicUser(e.target.value)} placeholder="Usuário de autenticação da matriz" />
          </div>
          <div className="space-y-2">
            <Label>Senha Basic Auth da Matriz</Label>
            <div className="relative">
              <Input type={showMatrixPass ? "text" : "password"} value={matrixBasicPass} onChange={(e) => setMatrixBasicPass(e.target.value)} placeholder="Senha de autenticação da matriz" />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowMatrixPass(!showMatrixPass)}>
                {showMatrixPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => saveMatrixMutation.mutate()} disabled={saveMatrixMutation.isPending}>
              {matrixSaved ? <Check className="h-4 w-4 text-primary mr-1" /> : saveMatrixMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Salvar credenciais da Matriz
            </Button>
          </div>
          {matrixApiKey && (
            <Alert className="border-primary/30 bg-primary/5">
              <CheckCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="text-xs">
                Matriz configurada. Todas as cidades usarão estas credenciais para buscar recibos e pontuar passageiros.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Endpoint primário */}
      {selectedIntegration && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Radio className="h-4 w-4 text-primary" />
              Endpoint primário da API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-w-lg">
            <Select
              value={selectedIntegration.preferred_endpoint || "recibo"}
              onValueChange={handleEndpointChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recibo">Recibo (padrão) — retorna CPF do passageiro</SelectItem>
                <SelectItem value="request_v1">Request v1 — retorna telefone do passageiro</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              O sistema tenta o endpoint primário primeiro. Se falhar, usa o outro como fallback.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Últimas pontuações */}
      {activeIntegrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-primary" />
              Últimas pontuações de passageiros
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
                  {liveNotifications.map((notif: any) => {
                    const isUnidentified = !notif.customer_name || notif.customer_name?.startsWith("Passageiro corrida");
                    return (
                      <div key={notif.id} className="flex flex-col gap-1 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className={`font-medium text-xs ${isUnidentified ? "italic text-muted-foreground" : ""}`}>
                              {isUnidentified ? "Cliente não identificado" : notif.customer_name}
                            </span>
                            {notif.customer_cpf_masked && (
                              <span className="text-xs text-muted-foreground">CPF {notif.customer_cpf_masked}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isUnidentified && (
                              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-primary" onClick={() => setIdentifyNotif(notif)}>
                                Identificar
                              </Button>
                            )}
                            <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">
                              {notif.points_credited} pts
                            </Badge>
                          </div>
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
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Scored Customers */}
      {activeIntegrations.length > 0 && <ScoredCustomersPanel brandId={brandId} />}

      {/* Identificar Cliente Dialog */}
      <Dialog open={!!identifyNotif} onOpenChange={(v) => { if (!v) { setIdentifyNotif(null); setIdentifyForm({ name: "", cpf: "", phone: "" }); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Identificar Cliente</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Corrida #{identifyNotif?.machine_ride_id} — R$ {Number(identifyNotif?.ride_value || 0).toFixed(2)}</p>
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label>Nome</Label><Input value={identifyForm.name} onChange={e => setIdentifyForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do cliente" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>CPF</Label><Input value={identifyForm.cpf} onChange={e => setIdentifyForm(f => ({ ...f, cpf: e.target.value }))} placeholder="000.000.000-00" /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input value={identifyForm.phone} onChange={e => setIdentifyForm(f => ({ ...f, phone: e.target.value }))} placeholder="(99) 99999-9999" /></div>
            </div>
            <Button className="w-full" disabled={!identifyForm.name.trim()} onClick={async () => {
              if (!identifyNotif) return;
              try {
                const name = identifyForm.name.trim();
                const cpf = identifyForm.cpf.trim() || null;
                const phone = identifyForm.phone.trim() || null;

                let customerId = identifyNotif.customer_id || null;
                if (!customerId && identifyNotif.machine_ride_id && identifyNotif.brand_id) {
                  const { data: ledgerEntry } = await (supabase as any)
                    .from("points_ledger").select("customer_id")
                    .eq("brand_id", identifyNotif.brand_id)
                    .eq("reference_type", "MACHINE_RIDE")
                    .ilike("reason", `%#${identifyNotif.machine_ride_id}%`)
                    .limit(1).maybeSingle();
                  if (ledgerEntry?.customer_id) customerId = ledgerEntry.customer_id;
                }
                if (!customerId && identifyNotif.machine_ride_id && identifyNotif.brand_id) {
                  const { data: custByName } = await (supabase as any)
                    .from("customers").select("id")
                    .eq("brand_id", identifyNotif.brand_id)
                    .eq("name", `Passageiro corrida #${identifyNotif.machine_ride_id}`)
                    .limit(1).maybeSingle();
                  if (custByName?.id) customerId = custByName.id;
                }

                if (customerId) {
                  const updates: Record<string, any> = { name };
                  if (cpf) updates.cpf = cpf;
                  if (phone) updates.phone = phone;
                  await (supabase as any).from("customers").update(updates).eq("id", customerId);
                }

                const notifUpdate: Record<string, any> = {
                  customer_name: name,
                  customer_phone: phone,
                  customer_cpf_masked: cpf ? `•••${cpf.slice(-4)}` : null,
                };
                if (customerId) notifUpdate.customer_id = customerId;
                await (supabase as any).from("machine_ride_notifications").update(notifUpdate).eq("id", identifyNotif.id);

                if (identifyNotif.machine_ride_id) {
                  await (supabase as any).from("machine_rides").update({
                    passenger_name: name, passenger_cpf: cpf, passenger_phone: phone,
                  }).eq("brand_id", identifyNotif.brand_id).eq("machine_ride_id", identifyNotif.machine_ride_id);
                }

                setLiveNotifications(prev => prev.map(n => n.id === identifyNotif.id ? { ...n, customer_name: name, customer_phone: phone, customer_cpf_masked: cpf ? `•••${cpf.slice(-4)}` : null, customer_id: customerId } : n));
                setIdentifyNotif(null);
                setIdentifyForm({ name: "", cpf: "", phone: "" });
                toast({ title: "Cliente identificado!", description: `${name} vinculado à corrida.` });
              } catch (err: any) {
                toast({ title: "Erro", description: err.message, variant: "destructive" });
              }
            }}>Salvar identificação</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
