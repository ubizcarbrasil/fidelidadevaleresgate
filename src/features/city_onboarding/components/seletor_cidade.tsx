import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Props {
  value: string | null;
  onChange: (id: string) => void;
}

export function SeletorCidade({ value, onChange }: Props) {
  const { currentBrandId } = useBrandGuard();

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["onboarding-branches", currentBrandId],
    enabled: !!currentBrandId,
    queryFn: async () => {
      const { data } = await supabase
        .from("branches")
        .select("id, name, city, state, is_active")
        .eq("brand_id", currentBrandId!)
        .order("name");
      return data ?? [];
    },
  });

  return (
    <Select value={value ?? ""} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-[280px]">
        <SelectValue placeholder={isLoading ? "Carregando…" : "Selecione uma cidade"} />
      </SelectTrigger>
      <SelectContent>
        {branches.map((b) => (
          <SelectItem key={b.id} value={b.id}>
            <span className="flex items-center gap-2">
              <span>{b.name}</span>
              {!b.is_active && (
                <span className="text-[10px] text-muted-foreground">(inativa)</span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
