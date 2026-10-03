import { resolvePwaManifestKind } from './pwa-manifest.util';

describe('resolvePwaManifestKind', () => {
  it('usa admin en login staff y rutas admin/auth', () => {
    expect(resolvePwaManifestKind('/admin/login')).toBe('admin');
    expect(resolvePwaManifestKind('/admin/inicio')).toBe('admin');
    expect(resolvePwaManifestKind('/auth')).toBe('admin');
    expect(resolvePwaManifestKind('/auth/contexto')).toBe('admin');
    expect(resolvePwaManifestKind('/login')).toBe('admin');
    expect(resolvePwaManifestKind('/admin/login?x=1')).toBe('admin');
  });

  it('usa portal en portal y landing', () => {
    expect(resolvePwaManifestKind('/portal/mascotas')).toBe('portal');
    expect(resolvePwaManifestKind('/portal/login')).toBe('portal');
    expect(resolvePwaManifestKind('/')).toBe('portal');
    expect(resolvePwaManifestKind('/contacto')).toBe('portal');
  });
});
