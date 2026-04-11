import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
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
  const { currentBrandId, isRootAdmin } = useBrandGuard();
  const [aberto, setAberto] = useState(false);

  const { data: taxasConversao } = useQuery({
    queryKey: ["brand-points-per-real", currentBrandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("brand_settings_json")
        .eq("id", currentBrandId!)
        .single();
      if (error) throw error;
      const settings = data?.brand_settings_json as Record<string, any> | null;
      const rules = settings?.redemption_rules || {};
      const base = (rules.points_per_real as number) || 40;
      return {
        driver: (rules.points_per_real_driver as number) || base,
        customer: (rules.points_per_real_customer as number) || base,
        base,
      };
    },
    enabled: !!currentBrandId,
  });

  const taxa = taxasConversao?.base ?? 40;

  const getTaxaPorPublico = (redeemableBy: string): number => {
    if (!taxasConversao) return taxa;
    if (redeemableBy === "driver") return taxasConversao.driver;
    if (redeemableBy === "customer") return taxasConversao.customer;
    // "both" → use the higher rate
    return Math.max(taxasConversao.driver, taxasConversao.customer);
  };

  const recalcular = useMutation({
    mutationFn: async () => {
      let query = supabase
        .from("affiliate_deals")
        .select("id, price, redeemable_by")
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
        const taxaPublico = getTaxaPorPublico((deal as any).redeemable_by || "driver");
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
            Todos os produtos resgatáveis terão o custo recalculado usando a taxa atual de{" "}
            <strong>{taxa} pts por R$ 1,00</strong>. Valores editados manualmente serão sobrescritos.
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
