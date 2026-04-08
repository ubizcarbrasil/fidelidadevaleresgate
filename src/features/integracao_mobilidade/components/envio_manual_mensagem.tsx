import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Send, Users, User, Plus, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useMessageTemplates } from "../hooks/hook_message_templates";
import { useMessageLogs } from "../hooks/hook_message_flows";
import { AVAILABLE_VARS } from "../hooks/hook_message_flows";
import { STATUS_LABELS, STATUS_COLORS } from "../constants/constantes_mensagens";
import type { Branch } from "../hooks/hook_integracoes";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface Props {
  brandId: string;
  branches: Branch[];
}

export function EnvioManualMensagem({ brandId, branches }: Props) {
  const { templates } = useMessageTemplates(brandId);
  const logsQuery = useMessageLogs(brandId, 20);
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<"all" | "individual">("all");
  const [branchId, setBranchId] = useState<string>("all");
  const [useTemplate, setUseTemplate] = useState(false);
  const [templateId, setTemplateId] = useState("");
  const [freeMessage, setFreeMessage] = useState("");
  const [searchCpf, setSearchCpf] = useState("");
  const [foundDriver, setFoundDriver] = useState<{ id: string; name: string; cpf: string } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const selectedTemplate = templates.find((t) => t.id === templateId);
  const message = useTemplate ? selectedTemplate?.body_template ?? "" : freeMessage;

  const searchDriver = async () => {
    if (!searchCpf.trim()) return;
    setIsSearching(true);
    setFoundDriver(null);
    try {
      const { data, error } = await supabase.rpc("lookup_driver_by_cpf" as any, {
        p_brand_id: brandId,
        p_cpf: searchCpf.replace(/\D/g, ""),
      });
      if (error) throw error;
      if (data && (data as any[]).length > 0) {
        const d = (data as any[])[0];
        setFoundDriver({ id: d.id, name: d.name, cpf: d.cpf });
      } else {
        toast({ title: "Motorista não encontrado", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erro ao buscar", description: err.message, variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast({ title: "Mensagem vazia", variant: "destructive" });
      return;
    }
    setIsSending(true);
    try {
      const payload: Record<string, unknown> = {
        brand_id: brandId,
        event_type: "MANUAL_BROADCAST",
        audience: mode === "all" ? "all_drivers" : "individual",
        message_body: message,
      };
      if (branchId !== "all") payload.branch_id = branchId;
      if (mode === "individual" && foundDriver) payload.customer_ids = [foundDriver.id];
      if (useTemplate && templateId) payload.template_id = templateId;

      const { data, error } = await supabase.functions.invoke("send-driver-message", { body: payload });
      if (error) throw error;
      const result = data as any;
      toast({
        title: "Mensagens enviadas",
        description: `${result.sent ?? 0} enviada(s), ${result.failed ?? 0} falha(s)`,
      });
      queryClient.invalidateQueries({ queryKey: ["driver-message-logs", brandId] });
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const inserirVariavel = (varKey: string) => {
    setFreeMessage((prev) => prev + `{{${varKey}}}`);
  };

  const logs = logsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Envio Manual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Audience mode */}
          <div className="flex items-center gap-4">
            <Button
              variant={mode === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("all")}
            >
              <Users className="h-4 w-4 mr-1.5" /> Todos
            </Button>
            <Button
              variant={mode === "individual" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("individual")}
            >
              <User className="h-4 w-4 mr-1.5" /> Individual
            </Button>
          </div>

          {/* Branch filter */}
          {mode === "all" && (
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as cidades</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Individual search */}
          {mode === "individual" && (
            <div className="space-y-2">
              <Label>Buscar motorista por CPF</Label>
              <div className="flex gap-2">
                <Input
                  value={searchCpf}
                  onChange={(e) => setSearchCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="flex-1"
                />
                <Button onClick={searchDriver} disabled={isSearching} size="sm">
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
                </Button>
              </div>
              {foundDriver && (
                <div className="p-2 rounded-md border bg-muted/30 text-sm">
                  <strong>{foundDriver.name}</strong> — CPF: {foundDriver.cpf}
                </div>
              )}
            </div>
          )}

          {/* Template or free text */}
          <div className="flex items-center gap-2">
            <Switch checked={useTemplate} onCheckedChange={setUseTemplate} />
            <Label className="text-sm">Usar template existente</Label>
          </div>

          {useTemplate ? (
            <div className="space-y-2">
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger><SelectValue placeholder="Selecione um template" /></SelectTrigger>
                <SelectContent>
                  {templates.filter((t) => t.is_active).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate && (
                <p className="text-xs text-muted-foreground font-mono p-2 border rounded-md">
                  {selectedTemplate.body_template}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {AVAILABLE_VARS.map((v) => (
                  <Badge
                    key={v.key}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/20 transition-colors text-xs"
                    onClick={() => inserirVariavel(v.key)}
                  >
                    <Plus className="h-3 w-3 mr-0.5" />
                    {`{{${v.key}}}`}
                  </Badge>
                ))}
              </div>
              <Textarea
                value={freeMessage}
                onChange={(e) => setFreeMessage(e.target.value)}
                placeholder="Digite a mensagem..."
                rows={4}
                className="font-mono text-sm"
              />
            </div>
          )}

          <Button
            onClick={handleSend}
            disabled={isSending || !message.trim() || (mode === "individual" && !foundDriver)}
            className="w-full"
          >
            {isSending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Enviar Mensagem
          </Button>
        </CardContent>
      </Card>

      {/* Recent logs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" /> Histórico Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum envio registrado</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start justify-between gap-2 p-2 rounded-md border text-xs">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono line-clamp-2">{log.rendered_message}</p>
                    <p className="text-muted-foreground mt-1">
                      {format(new Date(log.created_at), "dd/MM HH:mm")}
                      {log.event_type && ` • ${log.event_type}`}
                    </p>
                  </div>
                  <Badge variant="outline" className={STATUS_COLORS[log.status] ?? ""}>
                    {STATUS_LABELS[log.status] ?? log.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
