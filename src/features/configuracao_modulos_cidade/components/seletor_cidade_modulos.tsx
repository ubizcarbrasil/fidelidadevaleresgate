import { Building2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BranchResumo } from "@/features/central_modulos/hooks/hook_city_overrides";

interface Props {
  branches: BranchResumo[];
  branchId: string;
  onChange: (id: string) => void;
  loading: boolean;
}

export function SeletorCidadeModulos({ branches, branchId, onChange, loading }: Props) {
  return (
    <Select value={branchId} onValueChange={onChange} disabled={loading || branches.length === 0}>
      <SelectTrigger className="md:w-[320px]">
        <SelectValue placeholder={loading ? "Carregando cidades…" : "Escolha uma cidade"} />
      </SelectTrigger>
      <SelectContent>
        {branches.map((b) => (
          <SelectItem key={b.id} value={b.id}>
            <span className="inline-flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5" />
              {b.name}{b.city ? ` — ${b.city}` : ""}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
