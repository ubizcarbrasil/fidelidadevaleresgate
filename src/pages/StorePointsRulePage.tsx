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
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Settings2, Clock, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function StorePointsRulePage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { currentBrandId, currentBranchId } = useBrandGuard();

  const [pointsPerReal, setPointsPerReal] = useState(1);
  const [startsAt, setStartsAt] = useState<Date | undefined>();
  const [endsAt, setEndsAt] = useState<Date | undefined>();

  // Fetch stores the user manages (store_admin)
  const { data: stores } = useQuery({
    queryKey: ["my-stores", currentBrandId, currentBranchId],
    queryFn: async () => {
      let q = supabase.from("stores").select("id, name, branch_id, brand_id").eq("is_active", true);
      if (currentBranchId) q = q.eq("branch_id", currentBranchId);
      else if (currentBrandId) q = q.eq("brand_id", currentBrandId);
      const { data, error } = await q.order("name");
      if (error) throw error;
      return data;
    },
  });

  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const selectedStore = stores?.find(s => s.id === selectedStoreId);

  // Fetch active points_rule for the store's branch
  const { data: baseRule } = useQuery({
    queryKey: ["base-rule", currentBrandId, selectedStore?.branch_id],
    queryFn: async () => {
      if (!currentBrandId) return null;
      let q = supabase.from("points_rules").select("*").eq("brand_id", currentBrandId).eq("is_active", true);
      if (selectedStore?.branch_id) {
        q = q.or(`branch_id.eq.${selectedStore.branch_id},branch_id.is.null`);
      }
      const { data, error } = await q.order("branch_id", { ascending: false, nullsFirst: false }).limit(1);
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!currentBrandId && !!selectedStoreId,
  });

  // Fetch existing store rules
  const { data: myRules } = useQuery({
    queryKey: ["store-points-rules", selectedStoreId],
    queryFn: async () => {
      if (!selectedStoreId) return [];
      const { data, error } = await supabase
        .from("store_points_rules")
        .select("*")
        .eq("store_id", selectedStoreId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedStoreId,
  });

  const activeRule = myRules?.find(r => r.status === "ACTIVE" && r.is_active);

  const save = useMutation({
    mutationFn: async () => {
      if (!user || !selectedStore || !baseRule) throw new Error("Dados inválidos");
      if (!baseRule.allow_store_custom_rule) throw new Error("Regra customizada não permitida");

      const clampedPoints = Math.min(
        Math.max(pointsPerReal, Number(baseRule.store_points_per_real_min)),
        Number(baseRule.store_points_per_real_max)
      );

      const status = baseRule.store_rule_requires_approval ? "PENDING_APPROVAL" : "ACTIVE";

      const { error } = await supabase.from("store_points_rules").insert({
        brand_id: selectedStore.brand_id,
        branch_id: selectedStore.branch_id,
        store_id: selectedStore.id,
        points_per_real: clampedPoints,
        starts_at: startsAt?.toISOString() || null,
        ends_at: endsAt?.toISOString() || null,
        status: status as any,
        created_by_user_id: user.id,
      });
      if (error) throw error;
      return status;
    },
    onSuccess: (status) => {
      qc.invalidateQueries({ queryKey: ["store-points-rules"] });
      toast.success(status === "PENDING_APPROVAL" ? "Regra enviada para aprovação!" : "Regra ativada!");
      setStartsAt(undefined);
      setEndsAt(undefined);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE": return <Badge className="bg-green-600">Ativa</Badge>;
      case "PENDING_APPROVAL": return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pendente</Badge>;
      case "REJECTED": return <Badge variant="destructive">Rejeitada</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings2 className="h-6 w-6" /> Minha Regra de Pontuação
        </h2>
        <p className="text-muted-foreground">Configure a taxa de pontos da sua loja</p>
      </div>

      {/* Store selection */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Selecione a Loja</CardTitle></CardHeader>
        <CardContent>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedStoreId}
            onChange={e => setSelectedStoreId(e.target.value)}
          >
            <option value="">Selecione...</option>
            {stores?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </CardContent>
      </Card>

      {selectedStoreId && baseRule && (
        <>
          {/* Base rule info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Info className="h-4 w-4" /> Regra Base do Programa</CardTitle>
              <CardDescription>Definida pela administração da filial</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Pontos por R$1:</span> <strong>{Number(baseRule.points_per_real)}</strong></div>
              <div><span className="text-muted-foreground">R$ por ponto:</span> <strong>{Number(baseRule.money_per_point).toFixed(3)}</strong></div>
              <div><span className="text-muted-foreground">Compra mínima:</span> <strong>R$ {Number(baseRule.min_purchase_to_earn).toFixed(2)}</strong></div>
              <div><span className="text-muted-foreground">Máx pts/compra:</span> <strong>{baseRule.max_points_per_purchase}</strong></div>
            </CardContent>
          </Card>

          {!baseRule.allow_store_custom_rule ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Info className="h-8 w-8 mx-auto mb-2" />
                <p>Regras customizadas por loja não estão habilitadas para este programa.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Active rule display */}
              {activeRule && (
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-green-700">Regra Ativa da Loja</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p><strong>{Number(activeRule.points_per_real)}</strong> pontos por R$1</p>
                    {activeRule.starts_at && <p>Início: {format(new Date(activeRule.starts_at), "dd/MM/yyyy", { locale: ptBR })}</p>}
                    {activeRule.ends_at && <p>Fim: {format(new Date(activeRule.ends_at), "dd/MM/yyyy", { locale: ptBR })}</p>}
                  </CardContent>
                </Card>
              )}

              {/* New rule form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Definir Nova Regra</CardTitle>
                  <CardDescription>
                    Permitido entre {Number(baseRule.store_points_per_real_min)} e {Number(baseRule.store_points_per_real_max)} pontos por R$1
                    {baseRule.store_rule_requires_approval && " · Requer aprovação"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Pontos por R$1: <strong>{pointsPerReal}</strong></Label>
                    <Slider
                      value={[pointsPerReal]}
                      onValueChange={v => setPointsPerReal(v[0])}
                      min={Number(baseRule.store_points_per_real_min)}
                      max={Number(baseRule.store_points_per_real_max)}
                      step={0.1}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Min: {Number(baseRule.store_points_per_real_min)}</span>
                      <span>Max: {Number(baseRule.store_points_per_real_max)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1"><Clock className="h-3 w-3" /> Início (opcional)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startsAt && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startsAt ? format(startsAt, "dd/MM/yyyy", { locale: ptBR }) : "Sem data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={startsAt} onSelect={setStartsAt} locale={ptBR} className="p-3 pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1"><Clock className="h-3 w-3" /> Fim (opcional)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endsAt && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endsAt ? format(endsAt, "dd/MM/yyyy", { locale: ptBR }) : "Sem data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={endsAt} onSelect={setEndsAt} locale={ptBR} className="p-3 pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full">
                    {save.isPending ? "Salvando..." : baseRule.store_rule_requires_approval ? "Enviar para Aprovação" : "Ativar Regra"}
                  </Button>
                </CardContent>
              </Card>

              {/* History */}
              {myRules && myRules.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">Histórico</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pts/R$</TableHead>
                          <TableHead>Período</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Criado em</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {myRules.map(r => (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono">{Number(r.points_per_real)}</TableCell>
                            <TableCell className="text-xs">
                              {r.starts_at ? format(new Date(r.starts_at), "dd/MM/yy") : "—"}
                              {" → "}
                              {r.ends_at ? format(new Date(r.ends_at), "dd/MM/yy") : "—"}
                            </TableCell>
                            <TableCell>{statusBadge(r.status)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{format(new Date(r.created_at), "dd/MM/yy HH:mm")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
