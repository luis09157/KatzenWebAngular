import {
  accionBloqueoHint,
  chipClienteLabel,
  cobrarBloqueoHint,
  cobrarLabel,
  guardarBloqueoHint,
  hintBloqueCliente,
  inventarioHint,
  puedeCobrarPos,
  puedeGuardarPos,
  subtituloPos,
  whatsappHint,
} from './pos-bloqueo.util';

const base: Parameters<typeof accionBloqueoHint>[0] = {
  soloLectura: false,
  modoMostrador: false,
  mensajeRequiereCliente: '',
  tieneClienteId: true,
  formInvalid: false,
  tieneFecha: true,
  lineasCount: 1,
  saldo: 100,
  pagado: 0,
};

describe('pos-bloqueo.util (076)', () => {
  it('hintBloqueCliente prioriza mensaje clínico', () => {
    expect(hintBloqueCliente('Falta mascota')).toBe('Falta mascota');
    expect(hintBloqueCliente('')).toContain('Opcional para productos');
  });

  it('subtituloPos / chipClienteLabel / whatsappHint', () => {
    expect(
      subtituloPos({
        resultadoCobro: { parcial: false },
        modoMostrador: false,
        cliente: 'Ana',
        paciente: 'Luna',
      })
    ).toBe('Venta cobrada · ticket en $0');
    expect(
      subtituloPos({
        resultadoCobro: null,
        modoMostrador: true,
        cliente: '',
        paciente: '',
      })
    ).toContain('Venta rápida');
    expect(chipClienteLabel({ modoMostrador: true, cliente: '', paciente: '' })).toContain('Sin cliente');
    expect(chipClienteLabel({ modoMostrador: false, cliente: 'Ana', paciente: 'Luna' })).toBe('Ana · Luna');
    expect(whatsappHint({ modoMostrador: true, telefonoCliente: '' })).toContain('mostrador');
    expect(whatsappHint({ modoMostrador: false, telefonoCliente: '' })).toContain('no tiene teléfono');
    expect(whatsappHint({ modoMostrador: false, telefonoCliente: '81' })).toContain('toca enviar');
  });

  it('accionBloqueoHint cubre caminos clave', () => {
    expect(accionBloqueoHint({ ...base, soloLectura: true })).toBe('');
    expect(accionBloqueoHint({ ...base, mensajeRequiereCliente: 'X' })).toBe('X');
    expect(accionBloqueoHint({ ...base, tieneClienteId: false })).toContain('sigue sin cliente');
    expect(accionBloqueoHint({ ...base, lineasCount: 0 })).toContain('Agrega un producto');
    expect(accionBloqueoHint({ ...base, saldo: 0 })).toContain('No hay saldo pendiente');
    expect(accionBloqueoHint(base)).toBe('');
  });

  it('guardar / cobrar bloqueo hints', () => {
    expect(guardarBloqueoHint({ ...base, soloLectura: true })).toContain('cerrado');
    expect(guardarBloqueoHint(base)).toBe('Guardar sin cobrar');
    expect(cobrarBloqueoHint({ ...base, lineasCount: 0 })).toContain('Agrega líneas');
    expect(cobrarBloqueoHint(base)).toBe('Confirmar cobro');
  });

  it('inventarioHint según líneas producto', () => {
    expect(
      inventarioHint({
        soloLectura: false,
        mostrandoProducto: true,
        lineas: [],
      })
    ).toContain('salida de inventario');
    expect(
      inventarioHint({
        soloLectura: false,
        mostrandoProducto: false,
        lineas: [{ categoria: 'venta_producto', movimientoInventarioId: undefined }],
      })
    ).toContain('1 producto(s)');
    expect(
      inventarioHint({
        soloLectura: false,
        mostrandoProducto: false,
        lineas: [{ categoria: 'venta_producto', movimientoInventarioId: 'm1' }],
      })
    ).toContain('ya tienen salida');
  });

  it('puedeGuardar / puedeCobrar / cobrarLabel', () => {
    expect(
      puedeGuardarPos({
        loading: false,
        soloLectura: false,
        tieneFecha: true,
        modoMostrador: true,
        formValid: false,
      })
    ).toBe(true);
    expect(
      puedeGuardarPos({
        loading: false,
        soloLectura: false,
        tieneFecha: true,
        modoMostrador: false,
        formValid: false,
      })
    ).toBe(false);
    expect(puedeCobrarPos(true, 10)).toBe(true);
    expect(puedeCobrarPos(true, 0)).toBe(false);
    const fmt = (n: number) => `$${n}`;
    expect(cobrarLabel(0, 0, fmt)).toBe('Cobrar');
    expect(cobrarLabel(50, 10, fmt)).toBe('Cobrar resto $50');
    expect(cobrarLabel(50, 0, fmt)).toBe('Cobrar $50');
  });
});
