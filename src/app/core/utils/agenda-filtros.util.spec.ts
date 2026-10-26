import {
  ClasificadorAgenda,
  contarFiltrosAgenda,
  filtrarAgenda,
  seccionesPendientesAgenda,
  tituloDiaAgenda,
} from './agenda-filtros.util';

interface Fila {
  id: string;
  fecha: string;
  hora?: string;
  estado: 'programado' | 'completado' | 'cancelado' | 'activa';
  pagado?: boolean;
}

const c: ClasificadorAgenda<Fila> = {
  fechaIso: (r) => r.fecha,
  horaOrden: (r) => r.hora || '',
  esPendiente: (r) => r.estado === 'programado' || r.estado === 'activa',
  esHecho: (r) => r.estado === 'completado',
  esPagado: (r) => !!r.pagado,
  vaEnHoy: (r) => r.estado === 'activa',
};

// Lunes 26/10/2026
const now = new Date(2026, 9, 26, 10, 0);

const filas: Fila[] = [
  { id: 'atrasado', fecha: '2026-10-19', estado: 'programado' },
  { id: 'hoy-tarde', fecha: '2026-10-26', hora: '16:00', estado: 'programado' },
  { id: 'hoy-temprano', fecha: '2026-10-26', hora: '09:00', estado: 'programado' },
  { id: 'manana-pagado', fecha: '2026-10-27', estado: 'programado', pagado: true },
  { id: 'miercoles', fecha: '2026-10-28', estado: 'programado' },
  { id: 'noviembre', fecha: '2026-11-15', estado: 'programado' },
  { id: 'hecho-sin-pagar', fecha: '2026-10-20', estado: 'completado' },
  { id: 'hecho-pagado', fecha: '2026-10-22', estado: 'completado', pagado: true },
  { id: 'cancelado', fecha: '2026-10-21', estado: 'cancelado' },
  { id: 'activa-vieja', fecha: '2026-10-30', estado: 'activa' },
  { id: 'sin-fecha', fecha: '', estado: 'programado' },
];

describe('agenda-filtros.util', () => {
  it('cuenta cada filtro por separado (hecho y pagado no se mezclan)', () => {
    expect(contarFiltrosAgenda(filas, c)).toEqual({
      pendientes: 8,
      hechos: 2,
      por_cobrar: 1,
      pagados: 2,
      todos: 11,
    });
  });

  it('pendientes: Atrasados → Hoy → Mañana → un bloque por día → Sin fecha', () => {
    const s = seccionesPendientesAgenda(filas, c, { now });
    expect(s.map((x) => x.id)).toEqual(['atrasados', 'hoy', 'manana', '2026-10-28', '2026-11-15', 'sin_fecha']);
    expect(s[0].filas.map((f) => f.id)).toEqual(['atrasado']);
    // Hoy ordenado por hora; la estancia activa también va en Hoy.
    expect(s[1].filas.map((f) => f.id)).toEqual(['hoy-temprano', 'hoy-tarde', 'activa-vieja']);
    expect(s[2].filas.map((f) => f.id)).toEqual(['manana-pagado']);
    expect(s[3].titulo).toBe('Miércoles 28/10');
  });

  it('Hoy y Mañana siempre aparecen aunque estén vacíos; Atrasados solo si hay', () => {
    const s = seccionesPendientesAgenda([{ id: 'x', fecha: '2026-11-01', estado: 'programado' }], c, { now });
    expect(s.map((x) => x.id)).toEqual(['hoy', 'manana', '2026-11-01']);
  });

  it('hechos/pagados: lo más reciente primero', () => {
    expect(filtrarAgenda(filas, 'hechos', c).map((f) => f.id)).toEqual(['hecho-pagado', 'hecho-sin-pagar']);
    expect(filtrarAgenda(filas, 'por_cobrar', c).map((f) => f.id)).toEqual(['hecho-sin-pagar']);
  });

  it('título del día en español', () => {
    expect(tituloDiaAgenda('2026-10-26')).toBe('Lunes 26/10');
  });
});
