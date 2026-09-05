import { mapRtdbRow, pickLegacyString } from './rtdb-row.util';
import { getPacienteClienteId } from './paciente-cliente.util';
import { Paciente } from '../models';

/** Une PascalCase móvil + campos duales de dueño en un Paciente usable en UI. */
export function hydratePaciente(key: string | null | undefined, raw: unknown): Paciente {
  const row = mapRtdbRow<Paciente>(key, raw);
  const rec = row as Record<string, unknown>;
  const nombre = pickLegacyString(rec, 'nombre', 'Nombre');
  const especie = pickLegacyString(rec, 'especie', 'Especie');
  const raza = pickLegacyString(rec, 'raza', 'Raza');
  const sexo = pickLegacyString(rec, 'sexo', 'Sexo');
  const color = pickLegacyString(rec, 'color', 'Color');
  const cid = getPacienteClienteId(row);
  const pesoRaw = rec['peso'] ?? rec['Peso'];
  // Spec 068: folio de la mascota (Excel/clínica). No tomar el del dueño.
  const expediente = pickLegacyString(rec, 'expediente', 'Expediente', 'numeroExpediente');

  return {
    ...row,
    ...(nombre ? { nombre } : {}),
    ...(especie ? { especie } : {}),
    ...(raza ? { raza } : {}),
    ...(sexo ? { sexo } : {}),
    ...(color ? { color } : {}),
    ...(pesoRaw != null && String(pesoRaw).trim() !== '' ? { peso: pesoRaw as string | number } : {}),
    ...(expediente ? { expediente } : {}),
    ...(cid ? { cliente_id: cid, idCliente: cid } : {}),
  };
}
