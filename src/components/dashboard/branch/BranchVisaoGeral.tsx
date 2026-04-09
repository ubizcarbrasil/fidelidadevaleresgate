import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Wallet, TrendingUp, TrendingDown, Activity, AlertTriangle, Plus } from "lucide-react";
import { formatPoints } from "@/lib/formatPoints";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { LoadingButton } from "@/components/ui/loading-button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import type { BranchDashboardStats } from "./tipos_branch_dashboard";

interface Props {
  stats: BranchDashboardStats;
  branchId: string;
  brandId: string;
}

export default function BranchVisaoGeral({ stats, branchId, brandId }: Props) {
  const isLowBalance = stats.wallet_balance <= stats.wallet_low_threshold;
  const { consoleScope } = useBrandGuard();
  const canLoad = ["ROOT", "BRAND", "TENANT"].includes(consoleScope);

  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadAmount, setLoadAmount] = useState("");
  const [loadDescription, setLoadDescription] = useState("");

  const loadMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(loadAmount);
      if (!amount || amount <= 0) throw new Error("Valor inválido");

      const { data: existing } = await supabase
        .from("branch_points_wallet")
        .select("id, balance, total_loaded")
        .eq("branch_id", branchId)
        .maybeSingle();

      if (existing) {
        const newBalance = Number(existing.balance) + amount;
        await supabase
          .from("branch_points_wallet")
          .update({ balance: newBalance, total_loaded: Number(existing.total_loaded) + amount })
          .eq("id", existing.id);

        await supabase.from("branch_wallet_transactions").insert({
          branch_id: branchId, brand_id: brandId,
          transaction_type: "LOAD", amount, balance_after: newBalance,
          description: loadDescription || "Recarga de pontos",
        });
      } else {
        await supabase.from("branch_points_wallet").insert({
          branch_id: branchId, brand_id: brandId,
          balance: amount, total_loaded: amount, total_distributed: 0,
        });
        await supabase.from("branch_wallet_transactions").insert({
          branch_id: branchId, brand_id: brandId,
          transaction_type: "LOAD", amount, balance_after: amount,
          description: loadDescription || "Recarga inicial de pontos",
        });
      }
    },
    onSuccess: () => {
      toast.success("Recarga realizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["branch-dashboard-stats-v2", branchId] });
      queryClient.invalidateQueries({ queryKey: ["branch-wallet", branchId] });
      queryClient.invalidateQueries({ queryKey: ["branch-wallet-transactions", branchId] });
      setLoadAmount("");
      setLoadDescription("");
      setDialogOpen(false);
    },
    onError: (err: Error) => { toast.error(err.message || "Erro ao recarregar"); },
  });

  return (
    <Card className={isLowBalance ? "border-destructive/50" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Visão Geral da Cidade
          </CardTitle>
          <div className="flex items-center gap-2">
            {isLowBalance && (
              <Badge variant="destructive" className="gap-1 text-[10px]">
                <AlertTriangle className="h-3 w-3" /> Saldo Baixo
              </Badge>
            )}
            {canLoad && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1 h-7 text-xs">
                    <Plus className="h-3 w-3" /> Recarregar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Recarregar Carteira</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label>Quantidade de pontos</Label>
                      <Input type="number" min={1} placeholder="Ex: 10000" value={loadAmount} onChange={(e) => setLoadAmount(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição (opcional)</Label>
                      <Textarea placeholder="Ex: Recarga mensal Abril/2026" value={loadDescription} onChange={(e) => setLoadDescription(e.target.value)} rows={2} />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                    <LoadingButton onClick={() => loadMutation.mutate()} disabled={!loadAmount || Number(loadAmount) <= 0} isLoading={loadMutation.isPending} loadingText="Salvando..." className="gap-2">
                      Confirmar Recarga
                    </LoadingButton>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs text-muted-foreground">Saldo Carteira</p>
            </div>
            <p className={`text-xl font-bold ${isLowBalance ? "text-destructive" : ""}`}>
              {formatPoints(stats.wallet_balance)} <span className="text-xs font-normal text-muted-foreground">pts</span>
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              <p className="text-xs text-muted-foreground">Total Carregado</p>
            </div>
            <p className="text-xl font-bold">{formatPoints(stats.wallet_total_loaded)} <span className="text-xs font-normal text-muted-foreground">pts</span></p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
              <p className="text-xs text-muted-foreground">Total Distribuído</p>
            </div>
            <p className="text-xl font-bold">{formatPoints(stats.wallet_total_distributed)} <span className="text-xs font-normal text-muted-foreground">pts</span></p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Regras Ativas</p>
            <p className="text-xl font-bold">{stats.active_rules}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Disponível</p>
            <p className="text-xl font-bold">
              {stats.wallet_total_loaded > 0
                ? `${Math.round((stats.wallet_balance / stats.wallet_total_loaded) * 100)}%`
                : "—"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
