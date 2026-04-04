export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  OFFERS_PAGE_SIZE: 12,
  REDEMPTIONS_PAGE_SIZE: 20,
  WALLET_PAGE_SIZE: 30,
  AUDIT_PAGE_SIZE: 30,
} as const;

export const CACHE = {
  STALE_TIME_SHORT: 30 * 1000,       // 30 segundos
  STALE_TIME_MEDIUM: 5 * 60 * 1000,  // 5 minutos
  STALE_TIME_LONG: 30 * 60 * 1000,   // 30 minutos
  GC_TIME: 10 * 60 * 1000,           // 10 minutos
  PREFETCH_STALE_TIME: 30 * 1000,    // 30 segundos
} as const;

export const TIMEOUTS = {
  BOOT_TIMEOUT_MS: 30_000,
  DEBOUNCE_SEARCH_MS: 300,
  TOAST_DURATION_MS: 4000,
  OFFLINE_BANNER_HIDE_MS: 3000,
} as const;

export const LIMITS = {
  MAX_IMAGE_SIZE_MB: 5,
  MAX_UPLOAD_SIZE_BYTES: 5 * 1024 * 1024,
  MIN_PASSWORD_LENGTH: 8,
  RATE_LIMIT_WINDOW_MS: 60_000,
} as const;
