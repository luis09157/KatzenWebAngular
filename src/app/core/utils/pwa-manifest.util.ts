/** Kind de PWA instalable (spec 087). */
export type PwaManifestKind = 'portal' | 'admin';

export const PWA_MANIFEST_HREF: Record<PwaManifestKind, string> = {
  portal: 'manifest.webmanifest',
  admin: 'manifest-admin.webmanifest',
};

export const PWA_APPLE_TITLE: Record<PwaManifestKind, string> = {
  portal: 'KatzenVet',
  admin: 'KV Clínica',
};

/**
 * Elige manifest según la URL actual.
 * `/admin/*`, `/auth/*`, `/login` → clínica; resto (portal + landing) → portal.
 */
export function resolvePwaManifestKind(url: string): PwaManifestKind {
  const path = (url || '/').split('?')[0].split('#')[0] || '/';
  if (path === '/login' || path.startsWith('/admin') || path.startsWith('/auth')) {
    return 'admin';
  }
  return 'portal';
}
