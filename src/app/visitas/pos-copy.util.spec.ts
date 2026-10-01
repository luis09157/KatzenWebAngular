import { mensajeRequiereClientePara, origenLineaHint } from './pos-copy.util';
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
});
