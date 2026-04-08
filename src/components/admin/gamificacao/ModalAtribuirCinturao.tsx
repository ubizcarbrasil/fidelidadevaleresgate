import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  branchId: string;
  brandId: string;
  open: boolean;
  onClose: () => void;
}

export default function ModalAtribuirCinturao({ branchId, brandId, open, onClose }: Props) {
  const [customerId, setCustomerId] = useState("");
  const [recordValue, setRecordValue] = useState("");
  const [prizePoints, setPrizePoints] = useState("");
  const qc = useQueryClient();

  const { data: motoristas, isLoading: loadingMotoristas } = useQuery({
    queryKey: ["motoristas-cinturao", branchId],
    enabled: open && !!branchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name")
        .eq("branch_id", branchId)
        .ilike("name", "%[MOTORISTA]%")
        .eq("is_active", true)
        .order("name")
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const atribuir = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("assign_city_belt_manual", {
        p_branch_id: branchId,
        p_brand_id: brandId,
        p_customer_id: customerId,
        p_record_value: parseInt(recordValue),
        p_prize_points: parseInt(prizePoints) || 0,
      });
      if (error) throw error;
      return data as any;
    },
    onSuccess: () => {
      toast.success("Cinturão atribuído com sucesso!");
      qc.invalidateQueries({ queryKey: ["city-belt-champion", branchId] });
      resetAndClose();
    },
    onError: () => toast.error("Erro ao atribuir cinturão"),
  });

  const resetAndClose = () => {
    setCustomerId("");
    setRecordValue("");
    setPrizePoints("");
    onClose();
  };

  const nomeMotorista = (name: string) =>
    name.replace(/\[MOTORISTA\]\s*/gi, "").trim();

  const isValid = customerId && recordValue && parseInt(recordValue) > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && resetAndClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-400" />
            Atribuir Cinturão
          </DialogTitle>
          <DialogDescription>
            Defina manualmente o portador do cinturão, seu recorde e a recompensa para quem superá-lo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Motorista</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder={loadingMotoristas ? "Carregando..." : "Selecione o motorista"} />
              </SelectTrigger>
              <SelectContent>
                {motoristas?.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {nomeMotorista(m.name || "")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Recorde do portador (nº de corridas)</Label>
            <Input
              type="number"
              min={1}
              placeholder="Ex: 120"
              value={recordValue}
              onChange={(e) => setRecordValue(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Recompensa por tomada (pontos)</Label>
            <Input
              type="number"
              min={0}
              placeholder="Ex: 500 (0 = sem prêmio)"
              value={prizePoints}
              onChange={(e) => setPrizePoints(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Quem superar o recorde recebe esses pontos automaticamente.
            </p>
          </div>

          <Button
            className="w-full"
            disabled={!isValid || atribuir.isPending}
            onClick={() => atribuir.mutate()}
          >
            {atribuir.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Crown className="h-4 w-4 mr-2" />
            )}
            Confirmar Atribuição
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
