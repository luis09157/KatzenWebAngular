import { hintFcmIos, mensajeFcmHumano } from './portal-fcm-copy.util';

describe('portal-fcm-copy.util (074)', () => {
  const statuses = ['unsupported', 'no_vapid', 'denied', 'registered', 'error', 'idle'] as const;

  it('nunca menciona FCM, token, VAPID ni Firebase', () => {
    for (const status of statuses) {
      const msg = mensajeFcmHumano(status, { iosSafari: true });
      expect(msg).not.toMatch(/FCM|token|VAPID|Firebase|claims/i);
    }
  });

  it('en iPhone sin PWA explica Compartir → Añadir a inicio', () => {
    const msg = mensajeFcmHumano('error', { iosSafari: true, standalone: false });
    expect(msg).toContain('Compartir');
    expect(msg).toContain('Añadir a inicio');
    expect(hintFcmIos({ iosSafari: true, standalone: false })).toContain('Activar avisos');
  });

  it('registered es afirmativo y humano', () => {
    expect(mensajeFcmHumano('registered')).toContain('Avisos activados');
  });
});
