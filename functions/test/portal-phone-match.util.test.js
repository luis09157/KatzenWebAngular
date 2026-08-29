const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const util = require('../lib/portal-phone-match.util');

describe('portal-phone-match.util (047 ola 3)', () => {
  it('normalizeMxPhone: 10 dígitos, +52 y espacios', () => {
    assert.equal(util.normalizeMxPhone('8136024090'), '8136024090');
    assert.equal(util.normalizeMxPhone('+52 81 3602 4090'), '8136024090');
    assert.equal(util.normalizeMxPhone('52-813-602-4090'), '8136024090');
    assert.equal(util.normalizeMxPhone('(81) 3602-4090'), '8136024090');
  });

  it('normalizeMxPhone: 044/045 legacy y 521', () => {
    assert.equal(util.normalizeMxPhone('0448136024090'), '8136024090');
    assert.equal(util.normalizeMxPhone('5218136024090'), '8136024090');
  });

  it('normalizeMxPhone rechaza basura y no-MX', () => {
    assert.equal(util.normalizeMxPhone(''), null);
    assert.equal(util.normalizeMxPhone('n/p'), null);
    assert.equal(util.normalizeMxPhone('12345'), null);
    assert.equal(util.normalizeMxPhone('0123456789'), null);
  });

  it('maskMxPhone deja últimos 4', () => {
    assert.equal(util.maskMxPhone('8136024090'), '***4090');
  });

  it('petNamesEquivalent ignora acentos y apodo entre paréntesis', () => {
    assert.equal(util.petNamesEquivalent('Luna', 'luna'), true);
    assert.equal(util.petNamesEquivalent('José', 'Jose'), true);
    assert.equal(util.petNamesEquivalent('Luna (gata)', 'Luna'), true);
    assert.equal(util.petNamesEquivalent('Luna Belle', 'Luna'), true);
    assert.equal(util.petNamesEquivalent('Max', 'Toby'), false);
    assert.equal(util.petNamesEquivalent('Max', 'Maximiliano'), false);
  });

  it('mascotaPerteneceACliente respeta idCliente y cliente_id', () => {
    assert.equal(util.mascotaPerteneceACliente({ idCliente: 'c1' }, 'c1'), true);
    assert.equal(util.mascotaPerteneceACliente({ cliente_id: 'c1' }, 'c1'), true);
    assert.equal(util.mascotaPerteneceACliente({ idCliente: 'c1' }, 'c2'), false);
  });

  it('isClienteLinkableForPortal excluye inactivos y portal ya activo', () => {
    assert.equal(util.isClienteLinkableForPortal({ activo: true }), true);
    assert.equal(util.isClienteLinkableForPortal({ activo: false }), false);
    assert.equal(
      util.isClienteLinkableForPortal({ portalActivo: true, authUid: 'u1' }),
      false
    );
    assert.equal(util.isClienteLinkableForPortal({ portalActivo: true }), true);
  });

  it('resolvePhoneMatch: 0 candidatos → none', () => {
    assert.deepEqual(util.resolvePhoneMatch([]), { kind: 'none' });
  });

  it('resolvePhoneMatch: único → suggest (no auto-vínculo)', () => {
    assert.deepEqual(util.resolvePhoneMatch([{ id: 'c1', petNames: ['Luna'] }]), {
      kind: 'suggest',
      clienteId: 'c1'
    });
  });

  it('resolvePhoneMatch: único + mascota que no coincide → none', () => {
    assert.deepEqual(
      util.resolvePhoneMatch([{ id: 'c1', petNames: ['Luna'] }], 'Toby'),
      { kind: 'none' }
    );
  });

  it('resolvePhoneMatch: varios sin mascota → needs_pet_name', () => {
    assert.deepEqual(
      util.resolvePhoneMatch([
        { id: 'a', petNames: ['Luna'] },
        { id: 'b', petNames: ['Max'] }
      ]),
      { kind: 'needs_pet_name' }
    );
  });

  it('resolvePhoneMatch: varios + mascota única → suggest', () => {
    assert.deepEqual(
      util.resolvePhoneMatch(
        [
          { id: 'a', petNames: ['Luna'] },
          { id: 'b', petNames: ['Max'] }
        ],
        'luna'
      ),
      { kind: 'suggest', clienteId: 'a' }
    );
  });

  it('resolvePhoneMatch: varios + mascota ambigua → ambiguous', () => {
    assert.deepEqual(
      util.resolvePhoneMatch(
        [
          { id: 'a', petNames: ['Luna'] },
          { id: 'b', petNames: ['Luna'] }
        ],
        'Luna'
      ),
      { kind: 'ambiguous' }
    );
  });

  it('buildPhoneConfirmMessage incluye mascota y teléfono enmascarado', () => {
    const msg = util.buildPhoneConfirmMessage(['Luna', 'Max'], '8136024090');
    assert.match(msg, /Luna y Max/);
    assert.match(msg, /\*\*\*4090/);
    assert.match(msg, /Confirma/);
  });
});
