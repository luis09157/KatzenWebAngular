import {
  buildTicketDigitalView,
  cssTicketDigital,
  documentoTicketDigital,
  htmlCuerpoTicketDigital,
  nombreArchivoPdfTicket,
  generarPdfTicketBlob,
  textoWhatsAppConAvisoPdf,
} from './ticket-digital.util';

describe('ticket-digital.util (spec 092)', () => {
  const inputBase = {
    fecha: '2026-10-02',
    folio: 'KV-20261002-001',
    cliente: 'Luis Niño Martínez',
    paciente: 'Oreon',
    lineas: [
      {
        descripcion: 'Pensión · Pequeño (0-10 kg · chico o gato) · $250/día · Oreon',
        monto: 3000,
        cantidad: 1,
      },
    ],
    pagos: [{ metodo: 'efectivo' as const, monto: 3000 }],
    recibido: 3000,
  };

  it('HTML digital incluye marca, folio, líneas y total (no monospace térmico)', () => {
    const view = buildTicketDigitalView(inputBase);
    const html = htmlCuerpoTicketDigital(view);
    expect(html).toContain('ticket-digital');
    expect(html).toContain('KatzenVet');
    expect(html).toContain('Ticket de venta');
    expect(html).toContain('KV-20261002-001');
    expect(html).toContain('Luis Niño Martínez');
    expect(html).toContain('Oreon');
    expect(html).toContain('$3,000.00');
    expect(html).toContain('Gracias por su visita');
    expect(cssTicketDigital()).toContain('#0A969B');
    const doc = documentoTicketDigital(view);
    expect(doc).toContain('<!DOCTYPE html>');
    expect(doc).toContain(cssTicketDigital().slice(0, 40));
  });

  it('escapea HTML peligroso en nombres', () => {
    const view = buildTicketDigitalView({
      ...inputBase,
      cliente: '<script>x</script>',
      lineas: [{ descripcion: 'A & B <C>', monto: 10, cantidad: 1 }],
      pagos: [{ metodo: 'efectivo', monto: 10 }],
    });
    const html = htmlCuerpoTicketDigital(view);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('A &amp; B &lt;C&gt;');
  });

  it('nombre de archivo PDF usa folio', () => {
    expect(nombreArchivoPdfTicket({ folio: 'KV-20261002-001', fecha: '02/10/2026' })).toBe(
      'ticket-KV-20261002-001.pdf'
    );
  });

  it('genera Blob PDF no vacío', async () => {
    const view = buildTicketDigitalView(inputBase);
    const blob = await generarPdfTicketBlob(view);
    expect(blob).toBeTruthy();
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(100);
  });

  it('texto WhatsApp incluye aviso de PDF adjunto', () => {
    const t = textoWhatsAppConAvisoPdf(inputBase);
    expect(t).toContain('KatzenVet');
    expect(t).toContain('Total:');
    expect(t).toContain('PDF');
  });
});
