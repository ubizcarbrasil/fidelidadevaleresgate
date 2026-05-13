import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { reproduzirAteIndice } from "../utils/utilitarios_reproducao";
import type { EventoLogConfronto } from "../types/tipos_log_eventos";

export type VelocidadeReproducao = 0.5 | 1 | 2 | 4;

interface Params {
  eventos: EventoLogConfronto[];
}

/**
 * Controla a reprodução temporal dos eventos. Os eventos devem chegar
 * ordenados do mais recente para o mais antigo (padrão do service);
 * internamente invertemos para cronológico (antigo → recente).
 */
export function useReproducaoCampeonato({ eventos }: Params) {
  const cronologicos = useMemo(
    () => [...eventos].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at)),
    [eventos],
  );

  const total = cronologicos.length;
  const [indice, setIndice] = useState(-1);
  const [tocando, setTocando] = useState(false);
  const [velocidade, setVelocidade] = useState<VelocidadeReproducao>(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Quando a lista de eventos muda (nova temporada ou chegada de novos),
  // ajusta o índice sem sair do limite.
  useEffect(() => {
    setIndice((atual) => {
      if (total === 0) return -1;
      if (atual >= total) return total - 1;
      return atual;
    });
  }, [total]);

  // Motor do play automático.
  useEffect(() => {
    if (!tocando) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    if (indice >= total - 1) {
      setTocando(false);
      return;
    }
    const intervaloMs = Math.round(900 / velocidade);
    timerRef.current = setTimeout(() => {
      setIndice((i) => Math.min(total - 1, i + 1));
    }, intervaloMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [tocando, indice, total, velocidade]);

  const snapshot = useMemo(
    () => reproduzirAteIndice(cronologicos, indice),
    [cronologicos, indice],
  );

  const ir = useCallback(
    (novoIndice: number) => {
      const clamped = Math.max(-1, Math.min(total - 1, novoIndice));
      setIndice(clamped);
    },
    [total],
  );

  const passoFrente = useCallback(() => ir(indice + 1), [indice, ir]);
  const passoAtras = useCallback(() => ir(indice - 1), [indice, ir]);
  const inicio = useCallback(() => {
    setTocando(false);
    ir(-1);
  }, [ir]);
  const fim = useCallback(() => {
    setTocando(false);
    ir(total - 1);
  }, [ir, total]);
  const tocar = useCallback(() => {
    if (total === 0) return;
    if (indice >= total - 1) setIndice(-1);
    setTocando(true);
  }, [total, indice]);
  const pausar = useCallback(() => setTocando(false), []);

  return {
    eventosCronologicos: cronologicos,
    total,
    indice,
    snapshot,
    tocando,
    velocidade,
    setVelocidade,
    ir,
    passoFrente,
    passoAtras,
    inicio,
    fim,
    tocar,
    pausar,
  };
}