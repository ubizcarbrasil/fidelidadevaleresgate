export function formatPoints(value: number | null | undefined): string {
  if (value == null) return "0";
  return Number(value).toLocaleString("pt-BR");
}
