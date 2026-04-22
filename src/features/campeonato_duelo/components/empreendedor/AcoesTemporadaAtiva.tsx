import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Settings2,
  Pause,
  Play,
  X,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import {
  usePausarTemporada,
  useRetomarTemporada,
} from "../../hooks/hook_mutations_campeonato";
import ModalCancelarTemporada from "./ModalCancelarTemporada";
import ModalAjustarPremio from "./ModalAjustarPremio";
import ModalIncluirMotorista from "./ModalIncluirMotorista";
import DistribuicaoManualView from "./DistribuicaoManualView";

interface Props {
  brandId: string;
  seasonId: string;
  seasonName: string;
  pausada: boolean;
  fase: string;
  tiers: Array<{ tier_id: string; tier_name: string }>;
}

export default function AcoesTemporadaAtiva({
  brandId,
  seasonId,
  seasonName,
  pausada,
  fase,
  tiers,
}: Props) {
  const [modalCancelar, setModalCancelar] = useState(false);
  const [modalPremio, setModalPremio] = useState(false);
  const [modalMotorista, setModalMotorista] = useState(false);
  const [modalDistribuir, setModalDistribuir] = useState(false);
  const pausar = usePausarTemporada(brandId);
  const retomar = useRetomarTemporada(brandId);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings2 className="mr-2 h-4 w-4" /> Ações
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {pausada ? (
            <DropdownMenuItem
              onClick={() => retomar.mutate(seasonId)}
              disabled={retomar.isPending}
            >
              <Play className="mr-2 h-4 w-4" /> Retomar temporada
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => pausar.mutate(seasonId)}
              disabled={pausar.isPending}
            >
              <Pause className="mr-2 h-4 w-4" /> Pausar temporada
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setModalMotorista(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Incluir motorista
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setModalDistribuir(true)}>
            <Users className="mr-2 h-4 w-4" /> Distribuir motoristas
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setModalPremio(true)}>
            <Trophy className="mr-2 h-4 w-4" /> Ajustar prêmio
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setModalCancelar(true)}
            className="text-destructive focus:text-destructive"
          >
            <X className="mr-2 h-4 w-4" /> Cancelar temporada
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ModalCancelarTemporada
        open={modalCancelar}
        onClose={() => setModalCancelar(false)}
        seasonId={seasonId}
        seasonName={seasonName}
        brandId={brandId}
      />
      <ModalAjustarPremio
        open={modalPremio}
        onClose={() => setModalPremio(false)}
        brandId={brandId}
        tiers={tiers.map((t) => t.tier_name)}
      />
      <ModalIncluirMotorista
        open={modalMotorista}
        onClose={() => setModalMotorista(false)}
        brandId={brandId}
        seasonId={seasonId}
        tiers={tiers}
      />
      <DistribuicaoManualView
        open={modalDistribuir}
        onClose={() => setModalDistribuir(false)}
        brandId={brandId}
        seasonId={seasonId}
        fase={fase}
      />
    </>
  );
}
