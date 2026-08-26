import {
  CITA_DURACION_DEFAULT_MIN,
  findVeterinarioOverlap,
  intervalsOverlap,
  resolveCitaStartMs,
  resolveDuracionMinutos
} from './cita-agenda.util';
import { MOCK_CITA, MOCK_CLIENTE, MOCK_MASCOTA } from '../core/testing/mock-data';

describe('cita-agenda.util', () => {
  describe('resolveDuracionMinutos', () => {
    it('usa default 30 si falta o es inválido', () => {
      expect(resolveDuracionMinutos({})).toBe(CITA_DURACION_DEFAULT_MIN);
      expect(resolveDuracionMinutos({ duracion_minutos: 2 })).toBe(CITA_DURACION_DEFAULT_MIN);
      expect(resolveDuracionMinutos({ duracion_minutos: 'abc' })).toBe(CITA_DURACION_DEFAULT_MIN);
    });

    it('respeta duración válida', () => {
      expect(resolveDuracionMinutos({ duracion_minutos: 45 })).toBe(45);
      expect(resolveDuracionMinutos({ duracion_minutos: '60' })).toBe(60);
    });
  });

  describe('intervalsOverlap', () => {
    it('detecta solape y adyacencia sin solape', () => {
      expect(intervalsOverlap(0, 30, 15, 45)).toBeTrue();
      expect(intervalsOverlap(0, 30, 30, 60)).toBeFalse();
      expect(intervalsOverlap(0, 30, 30, 30)).toBeFalse();
    });
  });

  describe('findVeterinarioOverlap', () => {
    const base = {
      ...MOCK_CITA,
      veterinario: 'Dra. Ana',
      fecha: '2026-09-01T10:00:00.000Z',
      hora: '10:00',
      duracion_minutos: 30,
      estado: 'pendiente',
      activo: true
    };

    it('rechaza mismo vet en ventana solapada', () => {
      const existentes = [
        {
          id: 'otra',
          veterinario: 'Dra. Ana',
          fecha: '2026-09-01T10:15:00.000Z',
          hora: '10:15',
          duracion_minutos: 30,
          estado: 'confirmada',
          activo: true,
          cliente_id: MOCK_CLIENTE.id,
          paciente_id: MOCK_MASCOTA.id
        }
      ];
      const conflicto = findVeterinarioOverlap({ ...base, id: 'nueva' }, existentes);
      expect(conflicto).toBeTruthy();
      expect(conflicto?.id).toBe('otra');
    });

    it('permite paralelo con otro veterinario', () => {
      const existentes = [
        {
          id: 'otra',
          veterinario: 'Dr. Luis',
          fecha: '2026-09-01T10:00:00.000Z',
          hora: '10:00',
          duracion_minutos: 30,
          estado: 'pendiente',
          activo: true
        }
      ];
      expect(findVeterinarioOverlap({ ...base, id: 'nueva' }, existentes)).toBeNull();
    });

    it('ignora canceladas e inactivas', () => {
      const existentes = [
        {
          id: 'cancel',
          veterinario: 'Dra. Ana',
          fecha: '2026-09-01T10:00:00.000Z',
          hora: '10:00',
          duracion_minutos: 30,
          estado: 'cancelada',
          activo: true
        },
        {
          id: 'baja',
          veterinario: 'Dra. Ana',
          fecha: '2026-09-01T10:00:00.000Z',
          hora: '10:00',
          duracion_minutos: 30,
          estado: 'pendiente',
          activo: false
        }
      ];
      expect(findVeterinarioOverlap({ ...base, id: 'nueva' }, existentes)).toBeNull();
    });

    it('excluye la misma cita al editar', () => {
      const existentes = [{ ...base, id: 'mock-cita-001' }];
      expect(findVeterinarioOverlap({ ...base, id: 'mock-cita-001' }, existentes)).toBeNull();
    });
  });

  describe('resolveCitaStartMs', () => {
    it('combina fecha ISO y hora', () => {
      const ms = resolveCitaStartMs({
        fecha: '2026-09-01T00:00:00.000Z',
        hora: '14:30'
      });
      expect(ms).not.toBeNull();
      const d = new Date(ms!);
      expect(d.getHours()).toBe(14);
      expect(d.getMinutes()).toBe(30);
    });
  });
});
