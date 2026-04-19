/**
 * SeletorCidadeOverrides — Sub-fase 5.6
 * Select com as branches da marca, usado pelo brand_admin para
 * escolher qual cidade está editando.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin } from "lucide-react";

export interface BranchOption {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
}

interface Props {
  brandId: string;
  selectedBranchId: string | null;
  onChange: (branchId: string) => void;
}

export default function SeletorCidadeOverrides({
  brandId,
  selectedBranchId,
  onChange,
}: Props) {
  const { data: branches, isLoading } = useQuery({
    queryKey: ["overrides-branches", brandId] as const,
    enabled: !!brandId,
    staleTime: 60_000,
    queryFn: async (): Promise<BranchOption[]> => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name, city, state")
        .eq("brand_id", brandId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []) as BranchOption[];
    },
  });

  if (isLoading) {
    return <Skeleton className="h-10 w-full max-w-sm" />;
  }

  if (!branches || branches.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma cidade ativa encontrada para esta marca.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2 max-w-sm">
      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
      <Select value={selectedBranchId ?? ""} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione a cidade" />
        </SelectTrigger>
        <SelectContent>
          {branches.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
