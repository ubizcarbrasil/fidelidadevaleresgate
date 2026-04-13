function buildCacheBustedUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("v", String(Date.now()));
  return url.toString();
}

export async function clearRuntimeCaches() {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister().catch(() => false)));
  }

  if ("caches" in window) {
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey).catch(() => false)));
  }
}

export async function recoverFromChunkError() {
  try {
    await clearRuntimeCaches();
  } finally {
    window.location.replace(buildCacheBustedUrl());
  }
}

export function disableRuntimeCachesOnBoot() {
  void clearRuntimeCaches();
}