/**
 * Wrappers seguros para localStorage/sessionStorage.
 * Em Safari Private Mode ou navegadores com storage desabilitado, as APIs
 * nativas lançam exceção; estas funções engolem o erro e retornam fallback.
 */

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage indisponível — falha silenciosa proposital
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // noop
  }
}

export function safeSessionGetItem(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSessionSetItem(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // noop
  }
}
