import { mensajeRequiereClientePara, origenLineaHint, partesDescripcionLineaTicket } from './pos-copy.util';
import { VisitaLinea } from './visitas.models';

describe('pos-copy.util', () => {
  describe('mensajeRequiereClientePara', () => {
    it('pide dueño+mascota si no hay cliente (consulta)', () => {
      const msg = mensajeRequiereClientePara('consulta', {
        tieneClienteReal: false,
        tienePaciente: false,
      });
      expect(msg).toContain('consulta');
      expect(msg).toContain('dueño');
    });

    it('pide mascota si hay dueño sin paciente (baño)', () => {
      const msg = mensajeRequiereClientePara('peluqueria', {
        tieneClienteReal: true,
        tienePaciente: false,
        nombreDueno: 'Ana',
      });
      expect(msg).toContain('Ana');
      expect(msg).toContain('baño');
    });

    it('pide dueño+mascota para pensión', () => {
      const msg = mensajeRequiereClientePara('pension', {
        tieneClienteReal: false,
        tienePaciente: false,
      });
      expect(msg.toLowerCase()).toContain('pensión');
    });
  });

  describe('origenLineaHint', () => {
    it('prioriza salida de inventario', () => {
      const linea: VisitaLinea = {
        id: '1',
        descripcion: 'X',
        monto: 1,
        categoria: 'venta_producto',
        movimientoInventarioId: 'm1',
        productoId: 'p1',
      };
      expect(origenLineaHint(linea)).toContain('salida de inventario');
    });

    it('producto manual sin movimiento', () => {
      const linea: VisitaLinea = {
        id: '1',
        descripcion: 'X',
        monto: 1,
        categoria: 'venta_producto',
        productoId: 'p1',
      };
      expect(origenLineaHint(linea)).toContain('descontará stock');
    });

    it('vacío sin ids', () => {
      const linea: VisitaLinea = {
        id: '1',
        descripcion: 'X',
        monto: 1,
        categoria: 'otro',
      };
      expect(origenLineaHint(linea)).toBe('');
    });
  });

  describe('partesDescripcionLineaTicket', () => {
    it('parte pensión en título + meta', () => {
      const r = partesDescripcionLineaTicket('Pensión · Pequeño (0-10 kg - chico o gato) · $250/día · Oreon');
      expect(r.titulo).toBe('Pensión');
      expect(r.meta).toContain('Pequeño');
      expect(r.meta).toContain('Oreon');
      expect(r.meta).not.toContain('Pensión ·');
    });

    it('sin separador deja todo en título', () => {
      expect(partesDescripcionLineaTicket('Shampoo')).toEqual({ titulo: 'Shampoo', meta: '' });
    });
  });
});
