import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Plus, Loader2 } from "lucide-react";
import { useCampanhasPremio } from "../hooks/hook_campanhas_premio";
import CardCampanhaPremio from "./card_campanha_premio";
import FormularioCampanhaPremio from "./formulario_campanha_premio";
import type { CampanhaPremio } from "../types/tipos_configuracao_duelo";

interface Props { branchId: string; brandId: string; }

export default function AbaCampanhasPremio({ branchId, brandId }: Props) {
  const { data: campanhas, isLoading } = useCampanhasPremio(branchId);
  const [filtroStatus, setFiltroStatus] = useState<string>("all");
  const [editando, setEditando] = useState<CampanhaPremio | null>(null);
  const [open, setOpen] = useState(false);

  const lista = (campanhas ?? []).filter((c) => filtroStatus === "all" || c.status === filtroStatus);

  const abrirNovo = () => { setEditando(null); setOpen(true); };
  const abrirEdicao = (c: CampanhaPremio) => { setEditando(c); setOpen(true); };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <CardTitle className="text-base flex items-center gap-2 flex-1">
            <Trophy className="h-4 w-4 text-primary" /> Campanhas de Prêmio
          </CardTitle>
          <div className="flex gap-2">
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="paused">Pausadas</SelectItem>
                <SelectItem value="ended">Encerradas</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={abrirNovo}>
              <Plus className="h-4 w-4 mr-1" /> Nova
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" /> Carregando...
          </div>
        ) : lista.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            Nenhuma campanha {filtroStatus !== "all" ? "neste filtro" : "criada"}.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lista.map((c) => (
              <CardCampanhaPremio key={c.id} campanha={c} branchId={branchId} onEditar={abrirEdicao} />
            ))}
          </div>
        )}

        <FormularioCampanhaPremio
          open={open}
          onClose={() => setOpen(false)}
          branchId={branchId}
          brandId={brandId}
          campanha={editando}
        />
      </CardContent>
    </Card>
  );
}