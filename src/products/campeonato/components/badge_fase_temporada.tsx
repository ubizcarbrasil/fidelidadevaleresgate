import { Badge } from "@/components/ui/badge";
import { CORES_FASE, ROTULOS_FASE } from "../constants/constantes_campeonato";
import type { FaseCampeonato } from "../types/tipos_campeonato";

interface Props {
  fase: FaseCampeonato;
}

export default function BadgeFaseTemporada({ fase }: Props) {
  return (
    <Badge variant="outline" className={`${CORES_FASE[fase]} border-transparent`}>
      {ROTULOS_FASE[fase]}
    </Badge>
  );
}