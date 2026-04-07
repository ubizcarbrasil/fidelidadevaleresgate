import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Zap, Trophy } from "lucide-react";
import { formatPoints } from "@/lib/formatPoints";

interface Props {
  duel: any;
  branchId: string;
  walletBalance: number;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalImpulsionarDuelo({ duel, branchId, walletBalance, open, onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const getNome = (p: any) => p?.public_nickname || p?.customer?.name || "Motorista";

  const handleSubmit = async () => {
    const valor = parseInt(amount);
    if (!valor || valor <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("admin_boost_duel", {
        p_duel_id: duel.id,
        p_amount: valor,
        p_branch_id: branchId,
      });

      if (error) throw error;
      const result = data as any;
      if (!result?.success) {
        toast.error(result?.error || "Erro ao impulsionar");
        return;
      }

      toast.success(`Duelo impulsionado com ${formatPoints(valor)} pts!`);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Erro ao impulsionar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" /> Impulsionar Duelo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Duel info */}
          <div className="rounded-lg border p-3 text-center space-y-1">
            <p className="text-sm font-medium">{getNome(duel.challenger)} × {getNome(duel.challenged)}</p>
            <p className="text-2xl font-bold">{duel.challenger_rides_count ?? 0} × {duel.challenged_rides_count ?? 0}</p>
            {duel.prize_points > 0 && (
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Trophy className="h-3.5 w-3.5" /> Prêmio atual: {formatPoints(duel.prize_points)} pts
              </p>
            )}
          </div>

          {/* Wallet balance */}
          <div className="text-sm text-muted-foreground">
            Saldo da carteira: <span className="font-medium text-foreground">{formatPoints(walletBalance)} pts</span>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Valor do impulso (pontos)</Label>
            <Input
              type="number"
              placeholder="Ex: 500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={1}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading} className="gap-1">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Impulsionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
