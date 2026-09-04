/** Debe coincidir con `PORTAL_CACHE` en `src/firebase-messaging-sw.js`. */
export const FCM_SW_CACHE_VERSION = 4;
export const PORTAL_CACHE_NAME = `katzen-portal-v${FCM_SW_CACHE_VERSION}`;
export const FCM_SW_URL = `/firebase-messaging-sw.js?v=${FCM_SW_CACHE_VERSION}`;

function messagingScriptUrl(reg: ServiceWorkerRegistration): string {
  return reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL || '';
}

/** Borra caches `katzen-portal-v*` viejos y SW sin el query `?v=` actual. */
export async function refreshFirebaseMessagingSw(): Promise<ServiceWorkerRegistration | undefined> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return undefined;
  }

  if (typeof caches !== 'undefined') {
    try {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('katzen-portal-') && key !== PORTAL_CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    } catch {
      /* best-effort */
    }
  }

  const regs = await navigator.serviceWorker.getRegistrations();
  let hadMessagingSw = false;
  let current: ServiceWorkerRegistration | undefined;

  await Promise.all(
    regs.map(async (reg) => {
      const scriptURL = messagingScriptUrl(reg);
      if (!scriptURL.includes('firebase-messaging-sw.js')) {
        return;
      }
      hadMessagingSw = true;
      if (scriptURL.includes(`v=${FCM_SW_CACHE_VERSION}`)) {
        current = reg;
        return;
      }
      await reg.unregister();
    })
  );

  if (current) {
    return current;
  }
  if (hadMessagingSw) {
    return navigator.serviceWorker.register(FCM_SW_URL);
  }
  return undefined;
}

export async function registerFirebaseMessagingSw(): Promise<ServiceWorkerRegistration> {
  await refreshFirebaseMessagingSw();
  return navigator.serviceWorker.register(FCM_SW_URL);
}
