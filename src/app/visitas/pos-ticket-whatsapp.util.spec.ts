import {
  folioCortoVisita,
  generarTextoTicketWhatsApp,
  normalizarTelefonoWhatsApp,
  totalesTicketWhatsApp,
  urlWhatsAppTicket,
} from './pos-ticket-whatsapp.util';

describe('pos-ticket-whatsapp (spec 065)', () => {
  const lineasBase = [
    { descripcion: 'Croquetas 2kg × 2', monto: 500, cantidad: 2 },
    { descripcion: 'Consulta general', monto: 350, cantidad: 1 },
  ];

  it('mostrador sin teléfono: texto con «Venta de mostrador» y sin URL', () => {
    const texto = generarTextoTicketWhatsApp({
      fecha: '2026-09-04',
      visitaId: '-OabcDEF123xyz',
      esMostrador: true,
      cliente: 'Mostrador / público',
      lineas: lineasBase,
      pagos: [{ metodo: 'efectivo', monto: 850 }],
    });
    expect(texto).toContain('*KatzenVet* — Ticket de venta');
    expect(texto).toContain('Fecha: 04/09/2026 · Folio 123XYZ');
    expect(texto).toContain('Cliente: Venta de mostrador');
    expect(texto).not.toContain('Mascota:');
    expect(texto).toContain('• 2 × Croquetas 2kg = $500.00');
    expect(texto).toContain('• 1 × Consulta general = $350.00');
    expect(texto).toContain('*Total: $850.00*');
    expect(texto).toContain('Pago: Efectivo $850.00');
    expect(texto).toContain('Gracias por su visita');
    expect(urlWhatsAppTicket('', texto)).toBeNull();
    expect(urlWhatsAppTicket('12345', texto)).toBeNull();
  });

  it('con cliente y mascota: incluye nombres y arma URL wa.me con lada 52', () => {
    const texto = generarTextoTicketWhatsApp({
      fecha: '2026-09-04',
      visitaId: 'v1',
      cliente: 'Ana López',
      paciente: 'Firulais',
      lineas: lineasBase,
      pagos: [{ metodo: 'tarjeta', monto: 850 }],
    });
    expect(texto).toContain('Cliente: Ana López');
    expect(texto).toContain('Mascota: Firulais');
    expect(texto).toContain('Pago: Tarjeta $850.00');
    const url = urlWhatsAppTicket('55 1234-5678', texto);
    expect(url).toBeTruthy();
    expect(url!.startsWith('https://wa.me/525512345678?text=')).toBeTrue();
    expect(decodeURIComponent(url!.split('?text=')[1])).toBe(texto);
  });

  it('pago mixto: lista cada método con su monto', () => {
    const texto = generarTextoTicketWhatsApp({
      fecha: '2026-09-04',
      cliente: 'Ana López',
      lineas: lineasBase,
      pagos: [
        { metodo: 'efectivo', monto: 500 },
        { metodo: 'transferencia', monto: 350 },
      ],
    });
    expect(texto).toContain('Pago mixto:');
    expect(texto).toContain('  - Efectivo: $500.00');
    expect(texto).toContain('  - Transferencia: $350.00');
  });

  it('con devolución: marca la línea, la excluye del total y muestra devoluciones', () => {
    const lineas = [...lineasBase, { descripcion: 'Shampoo', monto: 120, cantidad: 1, fueDevuelto: true }];
    const t = totalesTicketWhatsApp(lineas);
    expect(t.total).toBe(850);
    expect(t.devuelto).toBe(120);
    const texto = generarTextoTicketWhatsApp({
      fecha: '2026-09-04',
      esMostrador: true,
      lineas,
      pagos: [{ metodo: 'efectivo', monto: 850 }],
    });
    expect(texto).toContain('• 1 × Shampoo = $120.00 (devuelto)');
    expect(texto).toContain('Devoluciones: -$120.00');
    expect(texto).toContain('*Total: $850.00*');
  });

  it('IVA, descuento, cambio y saldo pendiente cuando el modelo los trae', () => {
    const texto = generarTextoTicketWhatsApp({
      fecha: '2026-09-04',
      cliente: 'Ana López',
      lineas: [{ descripcion: 'Antipulgas', monto: 232, cantidad: 1, iva: 32, aplicaIva: true }],
      pagos: [{ metodo: 'efectivo', monto: 200 }],
      descuento: 32,
      recibido: 500,
      cambio: 300,
      saldoPendiente: 0,
    });
    expect(texto).toContain('IVA incluido: $32.00');
    expect(texto).toContain('Descuento: -$32.00');
    expect(texto).toContain('*Total: $200.00*');
    expect(texto).toContain('Recibido: $500.00');
    expect(texto).toContain('Cambio: $300.00');
    expect(texto).not.toContain('Saldo pendiente');

    const parcial = generarTextoTicketWhatsApp({
      fecha: '2026-09-04',
      cliente: 'Ana López',
      lineas: lineasBase,
      pagos: [{ metodo: 'efectivo', monto: 300 }],
      saldoPendiente: 550,
    });
    expect(parcial).toContain('Saldo pendiente: $550.00');
  });

  it('normaliza teléfonos MX (espacios, guiones, +52, 521)', () => {
    expect(normalizarTelefonoWhatsApp('55 1234 5678')).toBe('5512345678');
    expect(normalizarTelefonoWhatsApp('(55) 1234-5678-90')).toBeNull();
    expect(normalizarTelefonoWhatsApp('123 456')).toBeNull();
    expect(normalizarTelefonoWhatsApp('55-1234-5678')).toBe('5512345678');
    expect(normalizarTelefonoWhatsApp('5512345678')).toBe('5512345678');
    expect(normalizarTelefonoWhatsApp('+52 55 1234 5678')).toBe('5512345678');
    expect(normalizarTelefonoWhatsApp('521 55 1234 5678')).toBe('5512345678');
    expect(normalizarTelefonoWhatsApp('abc')).toBeNull();
    expect(normalizarTelefonoWhatsApp(null)).toBeNull();
  });

  it('folio corto: últimos 6 alfanuméricos en mayúsculas', () => {
    expect(folioCortoVisita('-OabcDEF123xyz')).toBe('123XYZ');
    expect(folioCortoVisita('ab')).toBe('AB');
    expect(folioCortoVisita('')).toBe('');
    expect(folioCortoVisita(null)).toBe('');
  });

  it('folio persistido 071 gana sobre el id', () => {
    const texto = generarTextoTicketWhatsApp({
      fecha: '2026-09-04',
      visitaId: '-OabcDEF123xyz',
      folio: 'KV-20260904-007',
      esMostrador: true,
      lineas: lineasBase,
      pagos: [{ metodo: 'efectivo', monto: 850 }],
    });
    expect(texto).toContain('Folio KV-20260904-007');
    expect(texto).not.toContain('Folio 123XYZ');
  });
});
