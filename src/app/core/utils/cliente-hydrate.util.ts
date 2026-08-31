import { mapRtdbRow, pickLegacyString } from './rtdb-row.util';
import { Cliente } from '../models';

/** Une PascalCase móvil + campos web en un Cliente usable en UI. */
export function hydrateCliente(key: string | null | undefined, raw: unknown): Cliente {
  const row = mapRtdbRow<Cliente>(key, raw);
  const rec = row as Record<string, unknown>;
  const nombre = pickLegacyString(rec, 'nombre', 'Nombre', 'nombreCompleto', 'NombreCompleto');
  const apellidoPaterno = pickLegacyString(
    rec,
    'apellidoPaterno',
    'ApellidoPaterno',
    'apellido_paterno'
  );
  const apellidoMaterno = pickLegacyString(
    rec,
    'apellidoMaterno',
    'ApellidoMaterno',
    'apellido_materno'
  );
  const apellido = pickLegacyString(rec, 'apellido', 'Apellido');
  const razonSocial = pickLegacyString(rec, 'razonSocial', 'razon_social', 'razon', 'RazonSocial');
  const telefono = pickLegacyString(rec, 'telefono', 'Telefono', 'tel', 'celular');
  const correo = pickLegacyString(rec, 'correo', 'Correo', 'email', 'Email');
  const expediente = pickLegacyString(rec, 'expediente', 'Expediente');

  return {
    ...row,
    ...(nombre ? { nombre } : {}),
    ...(apellidoPaterno ? { apellidoPaterno } : {}),
    ...(apellidoMaterno ? { apellidoMaterno } : {}),
    ...(!apellidoPaterno && apellido ? { apellidoPaterno: apellido } : {}),
    ...(razonSocial ? { razonSocial } : {}),
    ...(telefono ? { telefono } : {}),
    ...(correo ? { correo } : {}),
    ...(expediente ? { expediente } : {})
  };
}
