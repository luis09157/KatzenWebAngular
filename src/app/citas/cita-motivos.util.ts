/**
 * Motivos de cita (Luis, 2026-10-26).
 * - Sin «Grooming»: peluquería tiene su propio menú.
 * - Sin «Emergencia»: las emergencias no se agendan como cita.
 * - Sin especialidades que la clínica no hace (cardiología, neurología, oncología…): usar «Otro» + notas.
 * - Cirugías que sí se hacen: esterilización, enucleación, otohematoma, retiro de tumores, tejido blando.
 *
 * El valor guardado en RTDB es el texto (`motivo`), igual que antes; no hay migración.
 * Citas viejas con un motivo que ya no está en la lista lo siguen mostrando (grupo «Motivo anterior»).
 */

export interface GrupoMotivoCita {
  nombre: string;
  motivos: string[];
}

export const GRUPOS_MOTIVO_CITA: ReadonlyArray<GrupoMotivoCita> = [
  {
    nombre: 'Consulta',
    motivos: [
      'Consulta General',
      'Control Post-operatorio',
      'Revisión de Heridas',
      'Dermatología',
      'Tratamiento Dental',
    ],
  },
  { nombre: 'Prevención', motivos: ['Vacunación', 'Desparasitación'] },
  {
    nombre: 'Cirugía',
    motivos: [
      'Esterilización/Castración',
      'Enucleación',
      'Otohematoma',
      'Retiro de tumores',
      'Tejido blando (otras cirugías)',
    ],
  },
  { nombre: 'Estudios', motivos: ['Análisis de Sangre', 'Radiografía', 'Ecografía'] },
  { nombre: 'Otro', motivos: ['Otro'] },
];

export function motivosCitaPlano(): string[] {
  return GRUPOS_MOTIVO_CITA.flatMap((g) => g.motivos);
}

/** Grupos para el select; si la cita trae un motivo viejo que ya no está, se agrega al final para no perderlo. */
export function gruposMotivoCita(motivoActual?: string | null): GrupoMotivoCita[] {
  const grupos = GRUPOS_MOTIVO_CITA.map((g) => ({ nombre: g.nombre, motivos: [...g.motivos] }));
  const actual = String(motivoActual || '').trim();
  if (actual && !motivosCitaPlano().includes(actual)) {
    grupos.push({ nombre: 'Motivo anterior', motivos: [actual] });
  }
  return grupos;
}
