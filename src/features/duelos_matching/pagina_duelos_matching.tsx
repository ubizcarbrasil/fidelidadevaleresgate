import { useState, useCallback } from "react";
import ListaSugestoesDuelo, { chaveDoPar } from "./components/lista_sugestoes_duelo";
import ModalCriarDuelosLote from "./components/modal_criar_duelos_lote";
import type { ParSugerido, ToleranciaMatching } from "./types/tipos_duelos_matching";

interface Props {
  branchId: string;
  brandId: string;
  /** Callback para criar duelo individual usando o modal padrão já existente. */
  onCriarDueloIndividual?: (par: ParSugerido) => void;
}

/**
 * Página/aba de matching e criação em massa de duelos.
 * Mantém o estado de seleção e orquestra a lista + modal de lote.
 */
export default function PaginaDuelosMatching({ branchId, brandId, onCriarDueloIndividual }: Props) {
  const [selecionados, setSelecionados] = useState<Map<string, ParSugerido>>(new Map());
  const [modalLoteAberto, setModalLoteAberto] = useState(false);
  const [tolerancia, setTolerancia] = useState<ToleranciaMatching>("media");

  const handleToggle = useCallback((key: string, par: ParSugerido) => {
    setSelecionados(prev => {
      const novo = new Map(prev);
      if (novo.has(key)) novo.delete(key);
      else novo.set(key, par);
      return novo;
    });
  }, []);

  const handleSelecionarTodos = useCallback((pares: ParSugerido[]) => {
    setSelecionados(new Map(pares.map(p => [chaveDoPar(p), p])));
  }, []);

  const handleLimpar = useCallback(() => setSelecionados(new Map()), []);

  const setSelecionadosKeys = new Set(selecionados.keys());
  const paresSelecionados = Array.from(selecionados.values());

  return (
    <>
      <ListaSugestoesDuelo
        branchId={branchId}
        selecionados={setSelecionadosKeys}
        onToggleSelecao={handleToggle}
        onSelecionarTodos={handleSelecionarTodos}
        onLimparSelecao={handleLimpar}
        onCriarUnico={(par) => onCriarDueloIndividual?.(par) ?? setModalLoteAberto(true)}
        onAbrirCriarLote={() => setModalLoteAberto(true)}
        toleranciaSelecionada={tolerancia}
        onMudarTolerancia={setTolerancia}
      />

      <ModalCriarDuelosLote
        open={modalLoteAberto}
        onClose={() => setModalLoteAberto(false)}
        branchId={branchId}
        brandId={brandId}
        pares={paresSelecionados}
        onSuccess={() => setSelecionados(new Map())}
      />
    </>
  );
}