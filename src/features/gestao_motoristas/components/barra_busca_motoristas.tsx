import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StatusFiltro } from "../hooks/hook_listagem_motoristas";

interface Props {
  busca: string;
  onBuscaChange: (v: string) => void;
  status: StatusFiltro;
  onStatusChange: (v: StatusFiltro) => void;
}

export default function BarraBuscaMotoristas({
  busca,
  onBuscaChange,
  status,
  onStatusChange,
}: Props) {
  const temFiltro = busca.trim() !== "" || status !== "ALL";
  const limparFiltros = () => {
    onBuscaChange("");
    onStatusChange("ALL");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 flex-1 max-w-2xl">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          placeholder="Nome, CPF, telefone ou e-mail..."
          className="pl-9"
        />
      </div>
      <Select value={status} onValueChange={(v) => onStatusChange(v as StatusFiltro)}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos status</SelectItem>
          <SelectItem value="ATIVO">Ativo</SelectItem>
          <SelectItem value="INATIVO">Inativo</SelectItem>
          <SelectItem value="BLOQUEADO">Bloqueado</SelectItem>
        </SelectContent>
      </Select>
      {temFiltro && (
        <Button
          variant="ghost"
          size="sm"
          onClick={limparFiltros}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          title="Limpar filtros"
        >
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  );
}
