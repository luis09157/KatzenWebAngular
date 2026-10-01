import { hintFcmIos, mensajeFcmHumano } from './fcm-copy.util';

describe('fcm-copy.util (076)', () => {
  it('iOS Safari sin standalone → hint iPhone en estados sensibles', () => {
    for (const status of ['denied', 'unsupported', 'error'] as const) {
      const msg = mensajeFcmHumano(status, { iosSafari: true });
      expect(msg).toContain('iPhone');
    }
  });

  it('error iOS', () => {
    const msg = mensajeFcmHumano('error', { iosSafari: true, standalone: false });
    expect(msg).toContain('iPhone');
  });

  it('registered sin jerga técnica', () => {
    expect(mensajeFcmHumano('registered')).toContain('Avisos activados');
    expect(mensajeFcmHumano('registered').toLowerCase()).not.toContain('fcm');
  });

  it('hintFcmIos', () => {
    expect(hintFcmIos({ iosSafari: true, standalone: false })).toContain('iPhone');
    expect(hintFcmIos({ iosSafari: true, standalone: true })).toBe('');
  });
});
