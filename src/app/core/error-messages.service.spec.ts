import { ErrorMessagesService } from './error-messages.service';

describe('ErrorMessagesService (spec 069)', () => {
  const svc = new ErrorMessagesService();

  it('failed-precondition indica qué hacer', () => {
    const msg = svc.getUserMessage({ code: 'failed-precondition' });
    expect(msg).toContain('inténtalo de nuevo');
    expect(msg).toContain('administración');
  });

  it('invalid-argument pide revisar los datos', () => {
    const msg = svc.getUserMessage({ code: 'invalid-argument' });
    expect(msg).toContain('inténtalo de nuevo');
    expect(msg).toContain('administración');
  });

  it('internal y functions/internal sugieren avisar si persiste', () => {
    const a = svc.getUserMessage({ code: 'internal' });
    const b = svc.getUserMessage({ code: 'functions/internal' });
    expect(a.toLowerCase()).toContain('inténtalo de nuevo');
    expect(a).toContain('administración');
    expect(b.toLowerCase()).toContain('inténtalo de nuevo');
    expect(b).toContain('administración');
  });
});
