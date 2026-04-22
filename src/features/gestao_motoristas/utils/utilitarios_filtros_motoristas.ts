import type { StatusFiltro } from "../hooks/hook_listagem_motoristas";

const REGEX_PLACA = /^[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}$/i;

export const apenasDigitos = (s: string) => s.replace(/\D/g, "");

/**
 * Detecta se a busca tem formato de placa (Mercosul ou tradicional).
 * Ex: ABC1D23, ABC-1234, ABC1234
 */
export function ehBuscaPorPlaca(termo: string): boolean {
  const limpo = termo.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
  return REGEX_PLACA.test(limpo);
}

/**
 * Aplica o filtro de status usando a regra de negócio real:
 * - ATIVO: registration_status IS NULL OR registration_status ILIKE 'Ativo'
 * - INATIVO: registration_status ILIKE 'Inativo'
 * - BLOQUEADO: registration_status ILIKE 'Bloqueado'
 *
 * Retorna a query modificada (encadeável).
 */
export function aplicarFiltroStatus(query: any, status: StatusFiltro) {
  if (status === "ALL") return query;
  if (status === "ATIVO") {
    return query.or("registration_status.is.null,registration_status.ilike.Ativo");
  }
  if (status === "INATIVO") {
    return query.ilike("registration_status", "Inativo");
  }
  if (status === "BLOQUEADO") {
    return query.ilike("registration_status", "Bloqueado");
  }
  return query;
}

/**
 * Indica se o filtro atual exige consulta a driver_profiles.
 * - Status != ALL → sim
 * - Busca por placa → sim
 */
export function precisaPreFiltrarPorProfiles(
  status: StatusFiltro,
  buscaPorPlaca: boolean,
): boolean {
  return status !== "ALL" || buscaPorPlaca;
}
