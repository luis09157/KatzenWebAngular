const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { withDeadline } = require('../lib/callable-deadline.util');

describe('callable-deadline.util', () => {
  it('resuelve si la promesa llega antes del tope', async () => {
    const value = await withDeadline(Promise.resolve('ok'), 200, 'RTDB');
    assert.equal(value, 'ok');
  });

  it('rechaza unavailable si la promesa no termina', async () => {
    await assert.rejects(
      withDeadline(new Promise(() => undefined), 30, 'La base de datos'),
      (err) => {
        assert.equal(err.code, 'unavailable');
        assert.match(err.message, /base de datos/);
        return true;
      }
    );
  });
});
