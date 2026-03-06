import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Handshake, Settings2, Store, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function GanhaGanhaConfigPage() {
  const qc = useQueryClient();
  const { currentBrandId } = useBrandGuard();

  const [isActive, setIsActive] = useState(false);
  const [feeEarned, setFeeEarned] = useState("0.01");
  const [feeRedeemed, setFeeRedeemed] = useState("0.01");
  const [feeMode, setFeeMode] = useState<"UNIFORM" | "CUSTOM">("UNIFORM");
  const [storeFees, setStoreFees] = useState<Record<string, { earned: string; redeemed: string }>>({});

  // Fetch config
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["gg-config", currentBrandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ganha_ganha_config")
        .select("*")
        .eq("brand_id", currentBrandId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!currentBrandId,
  });

  // Fetch stores
  const { data: stores } = useQuery({
    queryKey: ["gg-stores", currentBrandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name, store_type")
        .eq("brand_id", currentBrandId!)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!currentBrandId,
  });

  // Fetch custom store fees
  const { data: customFees } = useQuery({
    queryKey: ["gg-store-fees", currentBrandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ganha_ganha_store_fees")
        .select("*")
        .eq("brand_id", currentBrandId!);
      if (error) throw error;
      return data;
    },
    enabled: !!currentBrandId,
  });

  // Initialize form
  useEffect(() => {
    if (config) {
      setIsActive(config.is_active);
      setFeeEarned(String(config.fee_per_point_earned));
      setFeeRedeemed(String(config.fee_per_point_redeemed));
      setFeeMode(config.fee_mode as "UNIFORM" | "CUSTOM");
    }
  }, [config]);

  useEffect(() => {
    if (customFees) {
      const map: Record<string, { earned: string; redeemed: string }> = {};
      customFees.forEach((f: any) => {
        map[f.store_id] = { earned: String(f.fee_per_point_earned), redeemed: String(f.fee_per_point_redeemed) };
      });
      setStoreFees(map);
    }
  }, [customFees]);

  const save = useMutation({
    mutationFn: async () => {
      if (!currentBrandId) throw new Error("Sem marca");

      // Upsert config
      const { error } = await supabase
        .from("ganha_ganha_config")
        .upsert({
          brand_id: currentBrandId,
          is_active: isActive,
          fee_per_point_earned: parseFloat(feeEarned) || 0.01,
          fee_per_point_redeemed: parseFloat(feeRedeemed) || 0.01,
          fee_mode: feeMode,
        }, { onConflict: "brand_id" });
      if (error) throw error;

      // If activating, force all stores to MISTA
      if (isActive) {
        const { error: storeErr } = await supabase
          .from("stores")
          .update({ store_type: "MISTA" })
          .eq("brand_id", currentBrandId)
          .neq("store_type", "MISTA");
        if (storeErr) throw storeErr;
      }

      // Save custom fees if CUSTOM mode
      if (feeMode === "CUSTOM") {
        for (const [storeId, fees] of Object.entries(storeFees)) {
          await supabase
            .from("ganha_ganha_store_fees")
            .upsert({
              brand_id: currentBrandId,
              store_id: storeId,
              fee_per_point_earned: parseFloat(fees.earned) || 0.01,
              fee_per_point_redeemed: parseFloat(fees.redeemed) || 0.01,
            }, { onConflict: "brand_id,store_id" });
        }
      }
    },
    onSuccess: () => {
      toast.success("Configuração salva!");
      qc.invalidateQueries({ queryKey: ["gg-config"] });
      qc.invalidateQueries({ queryKey: ["gg-stores"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (configLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Handshake className="h-6 w-6" /> Módulo Ganha-Ganha
        </h2>
        <p className="text-muted-foreground">
          Configure o modelo onde todos os parceiros são emissores e receptores de pontos.
        </p>
      </div>

      {/* Activation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ativação</CardTitle>
          <CardDescription>
            Ao ativar, todos os parceiros serão convertidos para tipo MISTA (emissora + receptora).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label className="font-medium">
              {isActive ? "Módulo Ativo" : "Módulo Desativado"}
            </Label>
            {isActive && <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Ativo</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* Fee configuration */}
      {isActive && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings2 className="h-5 w-5" /> Taxas por Ponto
              </CardTitle>
              <CardDescription>
                Defina o valor cobrado por cada ponto gerado e resgatado dentro do programa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Taxa por ponto gerado (R$)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    value={feeEarned}
                    onChange={e => setFeeEarned(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Cobrado quando o parceiro gera pontos para um cliente.</p>
                </div>
                <div className="space-y-2">
                  <Label>Taxa por ponto resgatado (R$)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    value={feeRedeemed}
                    onChange={e => setFeeRedeemed(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Cobrado quando pontos são resgatados no parceiro.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Modo de cobrança</Label>
                <Select value={feeMode} onValueChange={(v) => setFeeMode(v as "UNIFORM" | "CUSTOM")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNIFORM">Uniforme — mesma taxa para todos</SelectItem>
                    <SelectItem value="CUSTOM">Personalizado — taxa por parceiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Custom store fees */}
          {feeMode === "CUSTOM" && stores && stores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Store className="h-5 w-5" /> Taxas por Parceiro
                </CardTitle>
                <CardDescription>
                  Parceiros sem taxa personalizada usarão a taxa padrão acima.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parceiro</TableHead>
                      <TableHead>Taxa Geração (R$)</TableHead>
                      <TableHead>Taxa Resgate (R$)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stores.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            className="w-28"
                            placeholder={feeEarned}
                            value={storeFees[s.id]?.earned ?? ""}
                            onChange={e =>
                              setStoreFees(prev => ({
                                ...prev,
                                [s.id]: { earned: e.target.value, redeemed: prev[s.id]?.redeemed ?? "" },
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            className="w-28"
                            placeholder={feeRedeemed}
                            value={storeFees[s.id]?.redeemed ?? ""}
                            onChange={e =>
                              setStoreFees(prev => ({
                                ...prev,
                                [s.id]: { earned: prev[s.id]?.earned ?? "", redeemed: e.target.value },
                              }))
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Button onClick={() => save.mutate()} disabled={save.isPending} size="lg">
        <Save className="h-4 w-4 mr-2" />
        {save.isPending ? "Salvando..." : "Salvar Configuração"}
      </Button>
    </div>
  );
}
