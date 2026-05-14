import type { BrowserContext } from "@playwright/test";
import {
  E2E_BRAND_ID,
  E2E_DRIVER_CPF,
  driverSessionStorageKey,
} from "../fixtures/constants";

/**
 * Injeta a sessão do motorista no localStorage ANTES de qualquer script da
 * página rodar. O DriverSessionContext lê esta chave durante a hidratação e
 * dispara `lookup_driver_by_cpf` (RPC SECURITY DEFINER) para reconstruir o
 * driver. Como o seed cria o customer com este CPF, o login é automático.
 */
export async function seedDriverSession(
  context: BrowserContext,
  brandId: string = E2E_BRAND_ID,
  cpf: string = E2E_DRIVER_CPF,
): Promise<void> {
  await context.addInitScript(
    ({ key, value }) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        /* contexto sem storage */
      }
    },
    { key: driverSessionStorageKey(brandId), value: cpf },
  );
}

/** Helper para forçar logout (limpa storage) — útil em testes de guarda. */
export async function clearDriverSession(
  context: BrowserContext,
  brandId: string = E2E_BRAND_ID,
): Promise<void> {
  await context.addInitScript((key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }, driverSessionStorageKey(brandId));
}