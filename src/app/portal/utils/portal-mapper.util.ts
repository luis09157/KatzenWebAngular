/** Mapeo RTDB → modelos portal (paridad con RtdbSnapshotMapper.kt). */

export function isActiveRecord(data: Record<string, unknown> | null | undefined): boolean {
  if (!data) return false;
  return data['activo'] !== false;
}

export function isVisibleInClientPortal(data: Record<string, unknown> | null | undefined): boolean {
  if (!data) return false;
  return data['oculto_portal'] !== true && data['ocultoPortal'] !== true;
}

export function mapHistorial(id: string, raw: Record<string, unknown>) {
  // Nunca incluir notas_internas (solo staff) en el portal.
  const notasParts = [
    raw['notas'],
    raw['historia_clinica'],
    raw['hallazgos'],
    raw['estudios_solicitados'],
    raw['medico_atendio']
  ].filter(Boolean);
  return {
    id,
    paciente_id: raw['paciente_id'] || raw['idPaciente'] || '',
    diagnostico: raw['diagnostico'] || raw['diagnostico_presuntivo'] || raw['titulo'] || 'Consulta',
    tratamiento: raw['tratamiento'] || raw['manejo_terapeutico'] || raw['receta'] || '',
    medicamentos: raw['medicamentos'] || raw['receta'] || '',
    fecha_registro: raw['fecha_registro'] || raw['created_at'] || raw['fecha'] || '',
    notas: raw['notas'] || notasParts.join('\n'),
    medico_atendio: raw['medico_atendio'] || '',
    historia_clinica: raw['historia_clinica'] || '',
    hallazgos: raw['hallazgos'] || ''
  };
}

export function mapCita(id: string, raw: Record<string, unknown>) {
  const fecha = raw['fecha_hora'] || raw['fecha'] || '';
  const hora = raw['hora'] ? ` ${raw['hora']}` : '';
  return {
    id,
    paciente_id: raw['paciente_id'] || raw['idPaciente'] || '',
    cliente_id: raw['cliente_id'] || raw['idCliente'] || '',
    motivo: raw['motivo'] || raw['titulo'] || 'Cita',
    fecha_hora: `${fecha}${hora}`.trim(),
    estado: raw['estado'] || raw['status'] || 'pendiente',
    veterinario: raw['veterinario'] || raw['medico_atendio'] || '',
    observaciones: raw['observaciones'] || raw['notas'] || '',
    motivo_cancelacion: raw['motivo_cancelacion'] || '',
    duracion_minutos: raw['duracion_minutos'] ?? null
  };
}

export function mapVacuna(id: string, raw: Record<string, unknown>) {
  return {
    id,
    idPaciente: raw['idPaciente'] || raw['paciente_id'] || '',
    vacuna: raw['nombre'] || raw['vacuna'] || 'Vacuna',
    fecha: raw['fechaAplicacion'] || raw['fecha'] || raw['fechaRegistro'] || '',
    dosis: raw['dosis'] || '',
    veterinario: raw['veterinario'] || raw['medico'] || '',
    observaciones: raw['observaciones'] || raw['notas'] || ''
  };
}

export function mapNotificacion(id: string, raw: Record<string, unknown>) {
  return {
    id,
    tipo: raw['tipo'] || 'general',
    titulo: raw['titulo'] || 'Notificación',
    mensaje: raw['mensaje'] || '',
    fecha: raw['fecha'] || raw['created_at'] || '',
    leida: raw['leida'] === true,
    mascotaId: raw['mascotaId'] || raw['paciente_id'] || raw['idPaciente'] || '',
    referenciaId: raw['referenciaId'] || ''
  };
}

const TIPO_SERVICIO_BANIO_LABELS: Record<string, string> = {
  'baño_básico': 'Baño básico',
  'baño_completo': 'Baño completo',
  corte_pelo: 'Corte de pelo',
  corte_uñas: 'Corte de uñas',
  deslanado: 'Deslanado',
  tratamiento_especial: 'Tratamiento especial'
};

export function labelTipoServicioBanio(tipo: unknown): string {
  const key = String(tipo || '').trim();
  if (!key) return 'Servicio de peluquería';
  return TIPO_SERVICIO_BANIO_LABELS[key] || key.replace(/_/g, ' ');
}

/** Baño/peluquería — solo campos visibles al dueño (sin costos ni caja). */
export function mapBanio(id: string, raw: Record<string, unknown>) {
  return {
    id,
    paciente_id: raw['paciente_id'] || raw['idPaciente'] || '',
    fecha_banio: raw['fecha_banio'] || raw['fecha'] || '',
    hora_banio: raw['hora_banio'] || raw['hora'] || '',
    tipo_servicio: raw['tipo_servicio'] || '',
    tipo_servicio_label: labelTipoServicioBanio(raw['tipo_servicio']),
    estado: raw['estado'] || 'programado',
    peluquero: raw['peluquero'] || '',
    observaciones: raw['observaciones'] || ''
  };
}

export function mapMascota(id: string, raw: Record<string, unknown>) {
  return {
    id,
    nombre: raw['nombre'] || 'Sin nombre',
    especie: raw['especie'] || '',
    raza: raw['raza'] || '',
    sexo: raw['sexo'] || '',
    edad: raw['edad'] || '',
    peso: raw['peso'] || '',
    imageUrl: raw['imageUrl'] || raw['rutaImagen'] || '',
    idCliente: raw['idCliente'] || raw['cliente_id'] || '',
    activo: raw['activo'] !== false
  };
}
