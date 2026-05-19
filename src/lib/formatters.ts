/**
 * Formatadores centralizados — consolida implementações inline duplicadas
 * pelo codebase.
 *
 * Convenção:
 * - `formatBRL(value)` → string ("R$ 99,90") sempre; 0 vira "R$ 0,00"
 * - `formatBRLOrNull(value)` → null se value <= 0 ou null (UI hide)
 * - `formatCPF(raw)` → "000.000.000-00" (aceita parcial pra inputs)
 * - `formatCPFDisplay(raw, fallback)` → formato completo, retorna fallback se vazio
 * - `formatPhone(raw)` → "(00) 00000-0000"
 */

export function formatBRL(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return "R$ 0,00";
  try {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  } catch {
    return `R$ ${n.toFixed(2).replace(".", ",")}`;
  }
}

export function formatBRLOrNull(value: number | null | undefined): string | null {
  if (value == null || Number(value) <= 0) return null;
  return formatBRL(value);
}

/**
 * Formata CPF aceitando string parcial (pra inputs com formatação on-the-fly).
 * "12345678910" → "123.456.789-10"
 */
export function formatCPF(raw: string | null | undefined): string {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/**
 * Formata CPF pra exibição em tabelas/cards. Diferente de formatCPF:
 * - Retorna `fallback` (default "—") se entrada é null/vazia
 * - Não formata parcial (espera 11 dígitos; senão retorna como-está)
 */
export function formatCPFDisplay(raw: string | null | undefined, fallback = "—"): string {
  if (!raw) return fallback;
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length !== 11) return raw;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function isCPFFormatValid(raw: string | null | undefined): boolean {
  if (!raw) return false;
  return String(raw).replace(/\D/g, "").length === 11;
}

export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
