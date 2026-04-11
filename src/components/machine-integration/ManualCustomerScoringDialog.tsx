import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Coins, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: { id: string; name: string | null; branch_id?: string } | null;
  brandId: string;
}

export default function ManualCustomerScoringDialog({ open, onOpenChange, customer, brandId }: Props) {
  const qc = useQueryClient();
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!customer) throw new Error("Cliente não selecionado");
      const amount = parseInt(points);
      if (!amount || amount <= 0) throw new Error("Informe uma quantidade válida de pontos");

      const { error: ledgerErr } = await (supabase as any).from("points_ledger").insert({
        brand_id: brandId,
        branch_id: customer.branch_id || null,
        customer_id: customer.id,
        entry_type: "CREDIT",
        points_amount: amount,
        money_amount: 0,
        reason: reason.trim() || "Bonificação manual - Passageiro",
        reference_type: "MANUAL_ADJUSTMENT",
      });
      if (ledgerErr) throw ledgerErr;

      const { data: current } = await (supabase as any)
        .from("customers")
        .select("points_balance")
        .eq("id", customer.id)
        .single();

      await (supabase as any)
        .from("customers")
        .update({ points_balance: (current?.points_balance || 0) + amount })
        .eq("id", customer.id);
    },
    onSuccess: () => {
      toast.success(`${points} pontos creditados com sucesso!`);
      qc.invalidateQueries({ queryKey: ["scored-customers"] });
      qc.invalidateQueries({ queryKey: ["customer-ledger-machine"] });
      setPoints("");
      setReason("");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Bonificar Cliente
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {customer && (
            <div className="text-sm text-muted-foreground">
              Creditando pontos para <span className="font-medium text-foreground">{customer.name || "Cliente"}</span>
            </div>
          )}
          <div className="space-y-2">
            <Label>Quantidade de pontos</Label>
            <Input
              type="number"
              min={1}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="Ex: 50"
            />
          </div>
          <div className="space-y-2">
            <Label>Motivo (opcional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Bonificação por indicação"
              rows={2}
            />
          </div>
          <Button
            className="w-full"
            onClick={() => mutation.mutate()}
            disabled={!points || mutation.isPending}
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Coins className="h-4 w-4 mr-2" />}
            Creditar Pontos
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
