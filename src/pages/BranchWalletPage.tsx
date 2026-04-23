import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatPoints } from "@/lib/formatPoints";
import { Wallet, ArrowUpCircle, ArrowDownCircle, Plus, TrendingUp, TrendingDown, Coins, AlertTriangle, MapPin, ArrowRight } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function AlertaSaldoBaixo({ balance, threshold }: { balance: number; threshold: number }) {
  if (balance > threshold) return null;
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="flex items-center gap-3 py-4">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
        <div>
          <p className="text-sm font-semibold text-destructive">Saldo baixo!</p>
          <p className="text-xs text-muted-foreground">
            Seu saldo de {formatPoints(balance)} pts está abaixo do limite de {formatPoints(threshold)} pts. Recarregue para continuar distribuindo pontos.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ListaTransacoes({ transactions, filterType }: { transactions: any[]; filterType: string | null }) {
  const filtered = filterType ? transactions.filter((tx) => tx.transaction_type === filterType) : transactions;

  if (filtered.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Nenhuma transação registrada.</p>;
  }

  return (
    <div className="divide-y divide-border">
      {filtered.map((tx: any) => (
        <div key={tx.id} className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            {tx.transaction_type === "LOAD" ? (
              <ArrowUpCircle className="h-5 w-5 text-success" />
            ) : (
              <ArrowDownCircle className="h-5 w-5 text-destructive" />
            )}
            <div>
              <p className="text-sm font-medium">
                {tx.transaction_type === "LOAD" ? "Recarga" : "Distribuição"}
              </p>
              <p className="text-xs text-muted-foreground">{tx.description || "—"}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-sm font-semibold ${tx.transaction_type === "LOAD" ? "text-success" : "text-destructive"}`}>
              {tx.transaction_type === "LOAD" ? "+" : "-"}{formatPoints(tx.amount)} pts
            </p>
            <p className="text-[10px] text-muted-foreground">
              Saldo: {formatPoints(tx.balance_after)} pts
            </p>
            <p className="text-[10px] text-muted-foreground">
              {new Date(tx.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BranchWalletPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlBranchId = searchParams.get("branchId");
  const { currentBranchId, currentBrandId, consoleScope } = useBrandGuard();
  const queryClient = useQueryClient();
  const [loadAmount, setLoadAmount] = useState("");
  const [loadDescription, setLoadDescription] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const effectiveBranchId =
    urlBranchId && ["ROOT", "TENANT", "BRAND"].includes(consoleScope)
      ? urlBranchId
      : currentBranchId;

  const canLoad = ["ROOT", "BRAND", "TENANT"].includes(consoleScope);

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["branch-wallet", effectiveBranchId],
    queryFn: async () => {
      if (!effectiveBranchId) return null;
      const { data } = await supabase
        .from("branch_points_wallet")
        .select("*")
        .eq("branch_id", effectiveBranchId)
        .maybeSingle();
      return data;
    },
    enabled: !!effectiveBranchId,
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ["branch-wallet-transactions", effectiveBranchId],
    queryFn: async () => {
      if (!effectiveBranchId) return [];
      const { data } = await supabase
        .from("branch_wallet_transactions")
        .select("*")
        .eq("branch_id", effectiveBranchId)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!effectiveBranchId,
  });

  const loadMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(loadAmount);
      if (!amount || amount <= 0) throw new Error("Valor inválido");
      if (!effectiveBranchId || !currentBrandId) throw new Error("Cidade não identificada");

      const { data: existing } = await supabase
        .from("branch_points_wallet")
        .select("id, balance, total_loaded")
        .eq("branch_id", effectiveBranchId)
        .maybeSingle();

      if (existing) {
        const newBalance = Number(existing.balance) + amount;
        await supabase
          .from("branch_points_wallet")
          .update({ balance: newBalance, total_loaded: Number(existing.total_loaded) + amount })
          .eq("id", existing.id);

        await supabase.from("branch_wallet_transactions").insert({
          branch_id: effectiveBranchId, brand_id: currentBrandId,
          transaction_type: "LOAD", amount, balance_after: newBalance,
          description: loadDescription || "Recarga de pontos",
        });
      } else {
        await supabase.from("branch_points_wallet").insert({
          branch_id: effectiveBranchId, brand_id: currentBrandId,
          balance: amount, total_loaded: amount, total_distributed: 0,
        });
        await supabase.from("branch_wallet_transactions").insert({
          branch_id: effectiveBranchId, brand_id: currentBrandId,
          transaction_type: "LOAD", amount, balance_after: amount,
          description: loadDescription || "Recarga inicial de pontos",
        });
      }
    },
    onSuccess: () => {
      toast.success("Recarga realizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["branch-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["branch-wallet-transactions"] });
      setLoadAmount("");
      setLoadDescription("");
      setDialogOpen(false);
    },
    onError: (err: Error) => { toast.error(err.message || "Erro ao recarregar"); },
  });

  if (!effectiveBranchId) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Selecione uma cidade primeiro</h2>
              <p className="text-sm text-muted-foreground">
                A Carteira de Pontos é gerenciada por cidade. Vá em <strong>Minhas Cidades</strong>,
                escolha uma cidade e abra a Carteira pelo painel dela.
              </p>
            </div>
            <Button onClick={() => navigate("/brand-branches")} className="gap-2">
              Ir para Minhas Cidades <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lowThreshold = Number((wallet as any)?.low_balance_threshold ?? 1000);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Carteira de Pontos</h1>
            <p className="text-xs text-muted-foreground">Gerencie o saldo de pontos da sua cidade</p>
          </div>
        </div>
        {canLoad && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Recarregar</Button>
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

      {/* Low balance alert */}
      {!walletLoading && wallet && (
        <AlertaSaldoBaixo balance={Number(wallet.balance ?? 0)} threshold={lowThreshold} />
      )}

      {/* Balance Cards */}
      {walletLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Coins className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo Disponível</p>
                  <p className="text-2xl font-bold">{formatPoints(wallet?.balance ?? 0)} pts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Carregado</p>
                  <p className="text-2xl font-bold">{formatPoints(wallet?.total_loaded ?? 0)} pts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Distribuído</p>
                  <p className="text-2xl font-bold">{formatPoints(wallet?.total_distributed ?? 0)} pts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions with tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Histórico de Transações</CardTitle>
          <CardDescription>Últimas 50 movimentações da carteira</CardDescription>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !transactions || transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma transação registrada.</p>
          ) : (
            <Tabs defaultValue="all">
              <TabsList className="mb-3">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="LOAD">Recargas</TabsTrigger>
                <TabsTrigger value="DEBIT">Distribuições</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <ListaTransacoes transactions={transactions} filterType={null} />
              </TabsContent>
              <TabsContent value="LOAD">
                <ListaTransacoes transactions={transactions} filterType="LOAD" />
              </TabsContent>
              <TabsContent value="DEBIT">
                <ListaTransacoes transactions={transactions} filterType="DEBIT" />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
