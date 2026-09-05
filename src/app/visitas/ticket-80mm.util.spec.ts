import { TICKET_80_ANCHO_MM, TICKET_80_UTIL_MM, buildTicket80View, folioParaTicket } from './ticket-80mm.util';

describe('ticket-80mm.util (spec 071)', () => {
  it('ancho térmico 80 / 72 mm útil', () => {
    expect(TICKET_80_ANCHO_MM).toBe(80);
    expect(TICKET_80_UTIL_MM).toBe(72);
  });

  it('prefiere folio persistido sobre el corto del id', () => {
    expect(folioParaTicket({ folio: 'KV-20260904-001', visitaId: '-OabcDEF123xyz' })).toBe('KV-20260904-001');
    expect(folioParaTicket({ visitaId: '-OabcDEF123xyz' })).toBe('123XYZ');
  });

  it('desglose alineado a WhatsApp: líneas, IVA, mixto, cambio', () => {
    const v = buildTicket80View({
      fecha: '2026-09-04',
      folio: 'KV-20260904-002',
      cliente: 'Ana López',
      paciente: 'Luna',
      lineas: [
        { descripcion: 'Consulta', monto: 350, cantidad: 1, iva: 48.28, aplicaIva: true },
        { descripcion: 'Shampoo', monto: 80, cantidad: 1, fueDevuelto: true },
      ],
      pagos: [
        { metodo: 'efectivo', monto: 200 },
        { metodo: 'tarjeta', monto: 150 },
      ],
      recibido: 200,
      cambio: 0,
      saldoPendiente: 0,
    });
    expect(v.clinica).toBe('KatzenVet');
    expect(v.folio).toBe('KV-20260904-002');
    expect(v.fecha).toBe('04/09/2026');
    expect(v.cliente).toBe('Ana López');
    expect(v.paciente).toBe('Luna');
    expect(v.lineas[0].nombre).toBe('Consulta');
    expect(v.iva).toBe('$48.28');
    expect(v.devuelto).toContain('$80.00');
    expect(v.total).toBe('$350.00');
    expect(v.pagos.length).toBe(2);
    expect(v.recibido).toBe('$200.00');
    expect(v.cambio).toBe('');
  });

  it('mostrador sin cliente y cambio en efectivo', () => {
    const v = buildTicket80View({
      fecha: '2026-09-04',
      esMostrador: true,
      lineas: [{ descripcion: 'Croquetas', monto: 380, cantidad: 1 }],
      pagos: [{ metodo: 'efectivo', monto: 380 }],
      recibido: 500,
      cambio: 120,
    });
    expect(v.cliente).toBe('Venta de mostrador');
    expect(v.paciente).toBe('');
    expect(v.pagoUnico).toContain('Efectivo');
    expect(v.cambio).toBe('$120.00');
  });
});
