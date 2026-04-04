/**
 * Hook for confirming a redemption (marking as USED) in the store owner panel.
 */
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRedeemCelebration } from "@/hooks/useRedeemCelebration";

interface ConfirmRedeemParams {
  redemptionId: string;
  purchaseValue: number | null;
  creditValueApplied: number;
  minPurchase: number;
}

export function useRedeemMutation(onSuccess?: () => void) {
  const { celebrate } = useRedeemCelebration();

  return useMutation({
    mutationFn: async ({ redemptionId, purchaseValue, creditValueApplied, minPurchase }: ConfirmRedeemParams) => {
      if (minPurchase > 0 && (purchaseValue ?? 0) < minPurchase) {
        throw new Error(`Compra mínima: R$ ${minPurchase.toFixed(2)}`);
      }

      const { error } = await supabase
        .from("redemptions")
        .update({
          status: "USED" as string,
          used_at: new Date().toISOString(),
          purchase_value: purchaseValue || null,
          credit_value_applied: creditValueApplied,
        } as Record<string, unknown>)
        .eq("id", redemptionId);

      if (error) throw error;
    },
    onSuccess: () => {
      celebrate({ title: "Resgate confirmado! 🎉", description: "Voucher utilizado com sucesso." });
      onSuccess?.();
    },
    onError: (e: Error) => {
      toast.error(e.message || "Erro ao confirmar resgate");
    },
  });
}
