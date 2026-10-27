/**
 * 2026-10-27 — Un dueño trae varias mascotas al baño: se crea un baño por mascota
 * con el mismo servicio, fecha y hora. El precio de cada una se pone al terminar.
 */

export interface MascotaDelDueno {
  id: string;
  nombre: string;
  raw: Record<string, any>;
}

/** Las otras mascotas activas del mismo dueño (sin la que ya se eligió), por nombre. */
export function otrasMascotasDelDueno(
  pacientes: ReadonlyArray<Record<string, any>> | null | undefined,
  pacienteIdPrincipal: string | null | undefined
): MascotaDelDueno[] {
  const principal = String(pacienteIdPrincipal || '');
  const vistos = new Set<string>();
  const out: MascotaDelDueno[] = [];
  for (const p of pacientes || []) {
    const id = String(p?.['id'] || '');
    if (!id || id === principal || vistos.has(id)) continue;
    if (p?.['activo'] === false) continue;
    vistos.add(id);
    out.push({ id, nombre: String(p?.['nombre'] || 'Sin nombre'), raw: p as Record<string, any> });
  }
  return out.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

function tamanoDe(p: Record<string, any>): string {
  const raw = String(p?.['tamano_perro'] || p?.['tamano'] || '').toLowerCase();
  if (raw === 'pequeno' || raw === 'chico') return 'pequeno';
  if (raw === 'mediano' || raw === 'grande' || raw === 'xl') return raw;
  if (raw === 'gigante' || raw === 'extra' || raw === 'extragrande') return 'xl';
  return '';
}

/**
 * Datos del baño de una mascota extra a partir del baño principal.
 * Sin precio (cada mascota cuesta distinto), sin domicilio (es un solo viaje) y con sus propias alergias.
 */
export function datosBanioMascotaExtra(
  base: Record<string, any>,
  mascota: MascotaDelDueno,
  alergias: string[]
): Record<string, any> {
  const datos: Record<string, any> = {
    ...base,
    paciente_id: mascota.id,
    paciente: mascota.nombre,
    alergias_conocidas: alergias,
    precio_base: 0,
    precio_total: 0,
    pagado: false,
    servicios_adicionales: [],
  };
  delete datos['domicilio'];
  delete datos['costoEstimado'];
  delete datos['plantillaCostoId'];
  delete datos['id'];
  const tamano = tamanoDe(mascota.raw);
  if (tamano) datos['tamano_perro'] = tamano;
  else delete datos['tamano_perro'];
  return datos;
}
