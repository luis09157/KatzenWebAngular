import {
  buildMensajeWhatsappRecordatorio,
  buildTelUrl,
  buildWhatsappUrl,
  formatearFechaCortaEs,
  formatearFechaLargaEs,
  normalizarTelefonoMx,
  textoTipoRecordatorio,
  tieneTelefonoCapturado,
} from './recordatorio-whatsapp.util';

describe('recordatorio-whatsapp.util (spec 066)', () => {
  const hoy = new Date(2026, 8, 4); // 4 sep 2026

  describe('normalizarTelefonoMx', () => {
    it('quita espacios y guiones', () => {
      expect(normalizarTelefonoMx('55 1234-5678')).toBe('5512345678');
      expect(normalizarTelefonoMx('(81) 3602 4090')).toBe('8136024090');
    });

    it('recorta +52 / 52 / 521 duplicados', () => {
      expect(normalizarTelefonoMx('+52 55 1234 5678')).toBe('5512345678');
      expect(normalizarTelefonoMx('525512345678')).toBe('5512345678');
      expect(normalizarTelefonoMx('5215512345678')).toBe('5512345678');
    });

    it('devuelve null si no quedan 10 dígitos', () => {
      expect(normalizarTelefonoMx('551234')).toBeNull();
      expect(normalizarTelefonoMx('')).toBeNull();
      expect(normalizarTelefonoMx(null)).toBeNull();
      expect(normalizarTelefonoMx('sin numero')).toBeNull();
    });

    it('tieneTelefonoCapturado distingue vacío vs incompleto', () => {
      expect(tieneTelefonoCapturado('')).toBe(false);
      expect(tieneTelefonoCapturado(undefined)).toBe(false);
      expect(tieneTelefonoCapturado('551234')).toBe(true);
    });
  });

  describe('fechas en español', () => {
    it('formatea fecha larga «lunes 8 de septiembre» sin año si es el actual', () => {
      expect(formatearFechaLargaEs('2026-09-08T09:00', hoy)).toBe('martes 8 de septiembre');
      expect(formatearFechaLargaEs('2026-09-07', hoy)).toBe('lunes 7 de septiembre');
    });

    it('agrega el año cuando es distinto al actual y tolera fechas inválidas', () => {
      expect(formatearFechaLargaEs('2027-01-04', hoy)).toBe('lunes 4 de enero de 2027');
      expect(formatearFechaLargaEs('', hoy)).toBe('');
      expect(formatearFechaLargaEs('no-es-fecha', hoy)).toBe('');
    });

    it('fecha corta para el chip', () => {
      expect(formatearFechaCortaEs(new Date(2026, 8, 4, 12, 30).getTime(), hoy)).toBe('4 sep');
      expect(formatearFechaCortaEs(new Date(2025, 11, 24).getTime(), hoy)).toBe('24 dic 2025');
      expect(formatearFechaCortaEs(undefined, hoy)).toBe('');
    });
  });

  describe('mensaje y URL', () => {
    it('arma el mensaje con dueño, mascota, tipo, fecha, clínica y cierre', () => {
      const msg = buildMensajeWhatsappRecordatorio(
        {
          nombreDueno: 'Ana',
          nombreMascota: 'Luna',
          tipo: 'vacuna',
          fecha: '2026-09-08T09:00',
          titulo: 'Refuerzo — Rabia',
        },
        hoy
      );
      expect(msg).toBe(
        'Hola Ana, te saludamos de KatzenVet.\n' +
          'Te recordamos que Luna tiene vacuna el martes 8 de septiembre (Refuerzo — Rabia).\n' +
          'Responde este mensaje para confirmar.'
      );
    });

    it('usa textos naturales por tipo y fallbacks sin dueño ni fecha', () => {
      expect(textoTipoRecordatorio('desparasitacion')).toBe('desparasitación');
      expect(textoTipoRecordatorio('banio')).toBe('baño');
      expect(textoTipoRecordatorio('cualquier-cosa')).toBe('seguimiento');
      const msg = buildMensajeWhatsappRecordatorio({ tipo: 'consulta', clinica: 'Clínica Demo' }, hoy);
      expect(msg).toContain('Hola, te saludamos de Clínica Demo.');
      expect(msg).toContain('tu mascota tiene consulta pendiente.');
      expect(msg.endsWith('Responde este mensaje para confirmar.')).toBe(true);
    });

    it('construye wa.me con lada 52 y texto codificado; tel: para llamar', () => {
      const url = buildWhatsappUrl('5512345678', 'Hola Ana, ¿cómo estás?');
      expect(url.startsWith('https://wa.me/525512345678?text=')).toBe(true);
      expect(decodeURIComponent(url.split('?text=')[1])).toBe('Hola Ana, ¿cómo estás?');
      expect(buildTelUrl('5512345678')).toBe('tel:+525512345678');
    });
  });
});
