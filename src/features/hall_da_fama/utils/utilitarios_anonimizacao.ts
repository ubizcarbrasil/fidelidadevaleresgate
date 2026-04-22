/**
 * Utilitários de fallback no frontend. A anonimização principal já é feita
 * no servidor pela RPC `public_get_hall_fama` (padrão "João S.").
 * Estes helpers servem apenas para formatar números de meses e similares.
 */

const MESES_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function formatarMesAno(month: number, year: number): string {
  const idx = Math.max(1, Math.min(12, month)) - 1;
  return `${MESES_PT[idx]} ${year}`;
}

export function inicialOuTraco(name: string | null | undefined): string {
  if (!name || name.trim().length === 0) return "—";
  return name;
}