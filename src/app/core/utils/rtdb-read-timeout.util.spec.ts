import { fakeAsync, tick } from '@angular/core/testing';
import { NEVER, of } from 'rxjs';
import {
  firstRtdbValue,
  isRtdbReadTimeout,
  isRtdbUnavailableError,
  LOGIN_ROUTE_DEADLINE,
  rtdbUnavailableError,
  settleLoginRoute,
} from './rtdb-read-timeout.util';

describe('rtdb-read-timeout.util', () => {
  it('resuelve la primera emisión', async () => {
    await expectAsync(firstRtdbValue(of({ role: 'staff' }), 500)).toBeResolvedTo({ role: 'staff' });
  });

  it('rechaza con timeout si el socket no emite', async () => {
    try {
      await firstRtdbValue(NEVER, 40);
      fail('debio rechazar');
    } catch (error) {
      expect(isRtdbReadTimeout(error)).toBeTrue();
    }
  });

  it('marca el error de login cuando no hay perfil ni claims', () => {
    const error = rtdbUnavailableError();
    expect(isRtdbUnavailableError(error)).toBeTrue();
    expect(isRtdbReadTimeout(error)).toBeFalse();
  });

  it('abre la ruta si el trabajo no termina', fakeAsync(() => {
    let result: unknown;
    void settleLoginRoute(() => new Promise<boolean>(() => {}), 40).then((value) => {
      result = value;
    });
    tick(39);
    expect(result).toBeUndefined();
    tick(1);
    expect(result).toBe(LOGIN_ROUTE_DEADLINE);
  }));

  it('no navega si el trabajo responde después del plazo', fakeAsync(() => {
    let finish!: (value: boolean) => void;
    let navigated = false;
    let result: unknown;
    void settleLoginRoute(
      (cancelled) =>
        new Promise<boolean>((resolve) => {
          finish = (value) => {
            if (!cancelled()) {
              navigated = true;
            }
            resolve(value);
          };
        }),
      40
    ).then((value) => {
      result = value;
    });
    tick(40);
    expect(result).toBe(LOGIN_ROUTE_DEADLINE);
    finish(true);
    tick(0);
    expect(navigated).toBeFalse();
  }));
});
