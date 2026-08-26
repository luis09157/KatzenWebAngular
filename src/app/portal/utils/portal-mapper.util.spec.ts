import {
  isActiveRecord,
  isVisibleInClientPortal,
  mapBanio,
  mapHistorial,
  mapMascota
} from './portal-mapper.util';

describe('portal-mapper.util', () => {
  describe('isActiveRecord', () => {
    it('accepts active records', () => {
      expect(isActiveRecord({ activo: true })).toBeTrue();
    });

    it('rejects inactive records', () => {
      expect(isActiveRecord({ activo: false })).toBeFalse();
    });
  });

  describe('isVisibleInClientPortal', () => {
    it('hides oculto_portal records', () => {
      expect(isVisibleInClientPortal({ oculto_portal: true })).toBeFalse();
    });

    it('hides ocultoPortal records', () => {
      expect(isVisibleInClientPortal({ ocultoPortal: true })).toBeFalse();
    });

    it('shows normal records', () => {
      expect(isVisibleInClientPortal({ diagnostico: 'OK' })).toBeTrue();
    });
  });

  describe('mapMascota', () => {
    it('maps idCliente and activo', () => {
      const m = mapMascota('m1', {
        nombre: 'Oreon',
        especie: 'Felino',
        idCliente: 'c1',
        activo: true
      });
      expect(m.id).toBe('m1');
      expect(m.nombre).toBe('Oreon');
      expect(m.idCliente).toBe('c1');
      expect(m.activo).toBeTrue();
    });

    it('defaults activo to true', () => {
      expect(mapMascota('m1', { nombre: 'X' }).activo).toBeTrue();
    });
  });

  describe('mapBanio (028 portal read-only)', () => {
    it('maps visible fields and hides cost/caja', () => {
      const mapped = mapBanio('b1', {
        paciente_id: 'm1',
        fecha_banio: '2026-08-20',
        hora_banio: '11:00',
        tipo_servicio: 'baño_completo',
        estado: 'completado',
        peluquero: 'Ana',
        observaciones: 'OK',
        precio_total: 450,
        costoEstimado: 120,
        cajaMovimientoId: 'caja-1'
      }) as Record<string, unknown>;

      expect(mapped['tipo_servicio_label']).toBe('Baño completo');
      expect(Object.prototype.hasOwnProperty.call(mapped, 'precio_total')).toBeFalse();
      expect(Object.prototype.hasOwnProperty.call(mapped, 'costoEstimado')).toBeFalse();
      expect(Object.prototype.hasOwnProperty.call(mapped, 'cajaMovimientoId')).toBeFalse();
    });
  });

  describe('mapHistorial (010 notas_internas)', () => {
    it('never exposes notas_internas to portal payload', () => {
      const mapped = mapHistorial('h1', {
        diagnostico: 'Otitis',
        notas: 'Nota dueño',
        notas_internas: 'SECRETO STAFF — no al portal',
        medico_atendio: 'Dra. Test'
      }) as Record<string, unknown>;

      expect(mapped['diagnostico']).toBe('Otitis');
      expect(Object.prototype.hasOwnProperty.call(mapped, 'notas_internas')).toBeFalse();
      expect(JSON.stringify(mapped)).not.toContain('SECRETO STAFF');
    });
  });
});
