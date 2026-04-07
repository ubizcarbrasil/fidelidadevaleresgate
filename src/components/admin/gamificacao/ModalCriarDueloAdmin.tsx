import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Swords } from "lucide-react";
import { formatPoints } from "@/lib/formatPoints";
import { format, addDays } from "date-fns";

interface Props {
  branchId: string;
  brandId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalCriarDueloAdmin({ branchId, brandId, open, onClose, onSuccess }: Props) {
  const [challengerId, setChallengerId] = useState("");
  const [challengedId, setChallengedId] = useState("");
  const [startAt, setStartAt] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [endAt, setEndAt] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"));
  const [prizePoints, setPrizePoints] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: participantes } = useQuery({
    queryKey: ["admin-duel-participants", branchId],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("driver_duel_participants")
        .select("customer_id, public_nickname, customer:customers!driver_duel_participants_customer_id_fkey(name)")
        .eq("branch_id", branchId)
        .eq("duels_enabled", true)
        .order("public_nickname");
      if (error) throw error;
      return data || [];
    },
  });

  const walletQuery = useQuery({
    queryKey: ["branch-wallet-admin", branchId],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase.from("branch_points_wallet").select("balance").eq("branch_id", branchId).single();
      return data?.balance ?? 0;
    },
  });

  const getNome = (p: any) => p?.public_nickname || p?.customer?.name || "Motorista";

  const handleSubmit = async () => {
    if (!challengerId || !challengedId) {
      toast.error("Selecione os dois motoristas");
      return;
    }
    if (challengerId === challengedId) {
      toast.error("Selecione motoristas diferentes");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("admin_create_duel", {
        p_challenger_customer_id: challengerId,
        p_challenged_customer_id: challengedId,
        p_branch_id: branchId,
        p_brand_id: brandId,
        p_start_at: new Date(startAt).toISOString(),
        p_end_at: new Date(endAt).toISOString(),
        p_prize_points: parseInt(prizePoints) || 0,
      });

      if (error) throw error;
      const result = data as any;
      if (!result?.success) {
        toast.error(result?.error || "Erro ao criar duelo");
        return;
      }

      toast.success("Duelo criado com sucesso!");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar duelo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" /> Criar Duelo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Challenger */}
          <div className="space-y-2">
            <Label>Desafiante</Label>
            <Select value={challengerId} onValueChange={setChallengerId}>
              <SelectTrigger><SelectValue placeholder="Selecione o motorista" /></SelectTrigger>
              <SelectContent>
                {participantes?.filter((p: any) => p.customer_id !== challengedId).map((p: any) => (
                  <SelectItem key={p.customer_id} value={p.customer_id}>{getNome(p)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Challenged */}
          <div className="space-y-2">
            <Label>Desafiado</Label>
            <Select value={challengedId} onValueChange={setChallengedId}>
              <SelectTrigger><SelectValue placeholder="Selecione o adversário" /></SelectTrigger>
              <SelectContent>
                {participantes?.filter((p: any) => p.customer_id !== challengerId).map((p: any) => (
                  <SelectItem key={p.customer_id} value={p.customer_id}>{getNome(p)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Início</Label>
              <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fim</Label>
              <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
            </div>
          </div>

          {/* Prize */}
          <div className="space-y-2">
            <Label>Prêmio da plataforma (pontos)</Label>
            <Input
              type="number"
              placeholder="0 = sem prêmio extra"
              value={prizePoints}
              onChange={(e) => setPrizePoints(e.target.value)}
              min={0}
            />
            <p className="text-xs text-muted-foreground">
              Saldo da carteira: {formatPoints(walletQuery.data ?? 0)} pts
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading} className="gap-1">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
            Criar Duelo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
