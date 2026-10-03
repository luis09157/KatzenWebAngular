import { omitUndefinedRtdb } from './omit-undefined-rtdb.util';

describe('omitUndefinedRtdb (core)', () => {
  it('quita solo undefined; conserva null/0/empty', () => {
    const cleaned = omitUndefinedRtdb({
      a: 1,
      b: undefined,
      c: null,
      d: 0,
      e: '',
    } as Record<string, unknown>);
    expect(cleaned).toEqual({ a: 1, c: null, d: 0, e: '' });
    expect('b' in cleaned).toBe(false);
  });
});
