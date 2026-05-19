/**
 * Formatadores centralizados — consolida implementações inline duplicadas
 * de formatPrice/formatCpf/formatPhone espalhadas pelo codebase.
 *
 * Convenção:
 * - `formatBRL(value)` → string ("R$ 99,90") sempre; 0 vira "R$ 0,00"
 * - `formatBRLOrNull(value)` → null se value <= 0 ou null (UI hide)
 * - `formatCPF(digits)` → "000.000.000-00" (aceita parcial pra inputs)
 * - `formatPhone(digits)` → "(00) 00000-0000"
 */

/**
 * Formata valor numérico em moeda BRL. Sempre retorna string,
 * mesmo pra zero ("R$ 0,00"). Use quando quer mostrar o preço
 * de forma estável (cards, tabelas).
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

/**
 * Mesma coisa, mas retorna null se value for null/undefined/0.
 * Usado em UIs que escondem o preço quando não há (ex: "preço sob
 * consulta" vs "R$ 0,00").
 */
export function formatBRLOrNull(value: number | null | undefined): string | null {
  if (value == null || Number(value) <= 0) return null;
  return formatBRL(value);
}

/**
 * Formata CPF aceitando string parcial (pra usar em inputs com
 * formatação on-the-fly). Aceita só dígitos e formata progressivamente.
 * Aceita null/undefined retornando "".
 *
 * "123" → "123"
 * "123456" → "123.456"
 * "12345678" → "123.456.78"
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
 * Valida que a string contém exatamente 11 dígitos numéricos.
 * NÃO valida dígitos verificadores (apenas formato).
 */
export function isCPFFormatValid(raw: string | null | undefined): boolean {
  if (!raw) return false;
  return String(raw).replace(/\D/g, "").length === 11;
}

/**
 * Formata telefone brasileiro. Aceita 10 ou 11 dígitos.
 *
 * "11999998888" → "(11) 99999-8888"
 * "1133334444" → "(11) 3333-4444"
 */
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
