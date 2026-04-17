import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useRegrasResgateCidade } from "@/compartilhados/hooks/hook_regras_resgate_cidade";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Calculator, Loader2 } from "lucide-react";

export default function BotaoRecalcularPontos() {
  const qc = useQueryClient();
  const { currentBrandId, currentBranchId, isRootAdmin } = useBrandGuard();
  const [aberto, setAberto] = useState(false);

  // Effective rates: city > brand > defaults
  const { data: regrasEfetivas } = useRegrasResgateCidade(currentBrandId, currentBranchId);

  const taxa = regrasEfetivas?.points_per_real ?? 40;

  const getTaxaPorPublico = (redeemableBy: string): number => {
    if (!regrasEfetivas) return taxa;
    if (redeemableBy === "driver") return regrasEfetivas.points_per_real_driver;
    if (redeemableBy === "customer") return regrasEfetivas.points_per_real_customer;
    // "both" → use the higher rate
    return Math.max(regrasEfetivas.points_per_real_driver, regrasEfetivas.points_per_real_customer);
  };

  const recalcular = useMutation({
    mutationFn: async () => {
      let query = supabase
        .from("affiliate_deals")
        .select("id, price, redeemable_by, custom_points_per_real")
        .eq("is_redeemable", true)
        .not("price", "is", null)
        .gt("price", 0);

      if (!isRootAdmin && currentBrandId) {
        query = query.eq("brand_id", currentBrandId);
      }

      const { data: deals, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      if (!deals?.length) return 0;

      let count = 0;
      for (const deal of deals) {
        const customRate = (deal as any).custom_points_per_real as number | null;
        const taxaPublico = customRate && customRate > 0
          ? customRate
          : getTaxaPorPublico((deal as any).redeemable_by || "driver");
        const novoCusto = Math.ceil((deal.price as number) * taxaPublico);
        const { error } = await supabase
          .from("affiliate_deals")
          .update({ redeem_points_cost: novoCusto } as any)
          .eq("id", deal.id);
        if (!error) count++;
      }
      return count;
    },
    onSuccess: (count) => {
      toast.success(`Pontos recalculados em ${count} produto(s) com taxa ${taxa} pts/R$`);
      qc.invalidateQueries({ queryKey: ["produtos-resgate"] });
      qc.invalidateQueries({ queryKey: ["produtos-resgate-kpis"] });
      setAberto(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AlertDialog open={aberto} onOpenChange={setAberto}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Calculator className="h-4 w-4 mr-1" />
          Recalcular Pontos
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Recalcular custo em pontos?</AlertDialogTitle>
          <AlertDialogDescription>
            Todos os produtos resgatáveis terão o custo recalculado usando a taxa do público-alvo:{" "}
            <strong>Motorista: {regrasEfetivas?.points_per_real_driver ?? taxa} pts/R$</strong>,{" "}
            <strong>Passageiro: {regrasEfetivas?.points_per_real_customer ?? taxa} pts/R$</strong>.
            Valores editados manualmente serão sobrescritos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              recalcular.mutate();
            }}
            disabled={recalcular.isPending}
          >
            {recalcular.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Recalcular
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
