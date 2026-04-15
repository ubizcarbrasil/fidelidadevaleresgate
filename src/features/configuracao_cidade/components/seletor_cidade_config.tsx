import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CidadeOption } from "../hooks/hook_configuracao_cidade";

interface Props {
  cidades: CidadeOption[];
  cidadeSelecionada: string | null;
  onSelecionar: (id: string) => void;
}

export function SeletorCidadeConfig({ cidades, cidadeSelecionada, onSelecionar }: Props) {
  return (
    <div className="w-full max-w-sm">
      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Selecione a cidade</label>
      <Select value={cidadeSelecionada ?? ""} onValueChange={onSelecionar}>
        <SelectTrigger>
          <SelectValue placeholder="Escolha uma cidade…" />
        </SelectTrigger>
        <SelectContent>
          {cidades.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
