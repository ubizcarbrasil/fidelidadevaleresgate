import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MapPin } from "lucide-react";
import type { DriverRow } from "@/pages/DriverManagementPage";

interface Props {
  driver: DriverRow;
  brandId: string;
}

export default function DriverBranchEditor({ driver, brandId }: Props) {
  const qc = useQueryClient();

  const { data: branches } = useQuery({
    queryKey: ["branches-list", brandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name")
        .eq("brand_id", brandId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!brandId,
  });

  const mutation = useMutation({
    mutationFn: async (branchId: string) => {
      const { error } = await supabase
        .from("customers")
        .update({ branch_id: branchId } as any)
        .eq("id", driver.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cidade atualizada!");
      qc.invalidateQueries({ queryKey: ["driver-management"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-lg border border-border p-3 space-y-2">
      <Label className="text-sm font-medium flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5" />
        Cidade / Filial
      </Label>
      <Select
        value={driver.branch_id || ""}
        onValueChange={(val) => mutation.mutate(val)}
        disabled={mutation.isPending}
      >
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Selecione uma cidade" />
        </SelectTrigger>
        <SelectContent>
          {branches?.map((b) => (
            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
