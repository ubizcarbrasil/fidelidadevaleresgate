import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { DriverRow } from "@/pages/DriverManagementPage";
import { useMutationWithFeedback } from "@/hooks/useMutationWithFeedback";
import { queryKeys } from "@/lib/queryKeys";

interface Props {
  driver: DriverRow;
}

export default function DriverScoringToggle({ driver }: Props) {
  const qc = useQueryClient();

  const mutation = useMutationWithFeedback<void, Error, boolean>(
    async (disabled) => {
      const { error } = await (supabase as any)
        .from("customers")
        .update({ scoring_disabled: disabled })
        .eq("id", driver.id);
      if (error) throw error;
    },
    {
      successMessage: "Status de pontuação atualizado!",
      onSuccessCallback: () => qc.invalidateQueries({ queryKey: queryKeys.driverManagement.all }),
    },
  );

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Pontuação ativa</Label>
          <p className="text-xs text-muted-foreground">
            {driver.scoring_disabled
              ? "Este motorista não está acumulando pontos"
              : "Motorista acumula pontos normalmente"}
          </p>
        </div>
        <Switch
          checked={!driver.scoring_disabled}
          onCheckedChange={(checked) => mutation.mutate(!checked)}
          disabled={mutation.isPending}
        />
      </div>
    </div>
  );
}
