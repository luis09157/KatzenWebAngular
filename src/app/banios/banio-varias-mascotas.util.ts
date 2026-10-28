/**
 * 2026-10-27 — Un dueño trae varias mascotas al baño: se crea un baño por mascota
 * con la misma fecha y hora; cada una con su servicio, precio, tamaño y nota.
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

export interface OpcionesMascotaExtra {
  /** Servicio propio; vacío = el de la principal. */
  servicio?: string | null;
  /** Más servicios de esa mascota (además del principal). Precio 0: el precio es uno por mascota. */
  serviciosExtra?: string[] | null;
  /** Precio propio (opcional); null/vacío = «Falta el precio». */
  precio?: number | null;
  /** Nota propia; no se copia la de la principal. */
  nota?: string | null;
  /** Tamaño elegido en su tarjeta (si su ficha no tenía). */
  tamano?: string | null;
}

/**
 * Datos del baño de una mascota extra a partir del baño principal.
 * Comparte con la principal: dueño, fecha, hora y «ya lo pagaron».
 * El domicilio NO se copia (es un solo viaje: va en el baño principal).
 * Servicio, precio, nota y tamaño son de cada mascota.
 */
export function datosBanioMascotaExtra(
  base: Record<string, any>,
  mascota: MascotaDelDueno,
  alergias: string[],
  opts: OpcionesMascotaExtra = {}
): Record<string, any> {
  const precio = Number(opts.precio);
  const conPrecio = opts.precio !== null && opts.precio !== undefined && Number.isFinite(precio) && precio > 0;
  const datos: Record<string, any> = {
    ...base,
    paciente_id: mascota.id,
    paciente: mascota.nombre,
    alergias_conocidas: alergias,
    precio_base: conPrecio ? precio : 0,
    precio_total: conPrecio ? precio : 0,
    servicios_adicionales: (opts.serviciosExtra || []).filter(Boolean).map((servicio) => ({ servicio, precio: 0 })),
    observaciones: String(opts.nota || '').trim(),
  };
  if (opts.servicio) datos['tipo_servicio'] = opts.servicio;
  delete datos['domicilio'];
  delete datos['costoEstimado'];
  delete datos['plantillaCostoId'];
  delete datos['id'];
  const tamano = tamanoDe(mascota.raw) || String(opts.tamano || '').trim();
  if (tamano) datos['tamano_perro'] = tamano;
  else delete datos['tamano_perro'];
  return datos;
}
