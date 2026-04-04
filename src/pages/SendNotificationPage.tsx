import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send } from "lucide-react";
import { toast } from "sonner";
import { useBrandGuard } from "@/hooks/useBrandGuard";

export default function SendNotificationPage() {
  const { currentBrandId, isRootAdmin } = useBrandGuard();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scope, setScope] = useState<"all" | "branch">("all");
  const [branchId, setBranchId] = useState("");
  const [sending, setSending] = useState(false);

  const { data: branches } = useQuery({
    queryKey: ["branches-notif", currentBrandId],
    queryFn: async () => {
      let q = supabase.from("branches").select("id, name").eq("is_active", true).order("name");
      if (!isRootAdmin && currentBrandId) q = q.eq("brand_id", currentBrandId);
      const { data } = await q;
      return data || [];
    },
  });

  const handleSend = async () => {
    if (!title.trim()) { toast.error("Informe o título"); return; }
    setSending(true);
    try {
      // Fetch target customers
      let query = supabase.from("customers").select("id").eq("is_active", true);
      if (!isRootAdmin && currentBrandId) query = query.eq("brand_id", currentBrandId);
      if (scope === "branch" && branchId) query = query.eq("branch_id", branchId);
      const { data: customers, error } = await query.limit(1000);
      if (error) throw error;
      if (!customers?.length) { toast.error("Nenhum cliente encontrado"); setSending(false); return; }

      const customerIds = customers.map(c => c.id);

      const { data: result, error: fnError } = await supabase.functions.invoke("send-push-notification", {
        body: { customer_ids: customerIds, title, body, reference_type: "general" },
      });

      if (fnError) throw fnError;
      toast.success(`Notificação enviada para ${customerIds.length} clientes!`);
      setTitle("");
      setBody("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar notificação");
    }
    setSending(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Enviar Notificação</h2>
        <p className="text-muted-foreground">Envie notificações para clientes da plataforma</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Nova Notificação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Público-alvo</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as "all" | "branch")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                <SelectItem value="branch">Por cidade</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scope === "branch" && (
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {branches?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Nova oferta disponível!" />
          </div>

          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Detalhes da notificação..." rows={4} />
          </div>

          <Button onClick={handleSend} disabled={sending || !title.trim()} className="w-full gap-2">
            <Send className="h-4 w-4" />
            {sending ? "Enviando..." : "Enviar Notificação"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
