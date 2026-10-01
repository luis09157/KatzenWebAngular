/**
 * Icono / color del feed de actividades del expediente (spec 077).
 */

export function getIconoActividadExpediente(tipo: string): string {
  switch (tipo) {
    case 'historial_clinico':
      return 'medical_services';
    case 'historial_clinico_editado':
      return 'edit';
    case 'historial_clinico_eliminado':
      return 'delete';
    case 'vacuna':
      return 'vaccines';
    case 'vacuna_editada':
      return 'edit';
    case 'vacuna_eliminada':
      return 'delete';
    case 'recordatorio':
      return 'notifications';
    case 'recordatorio_editado':
      return 'edit';
    case 'recordatorio_eliminado':
      return 'delete';
    case 'cita':
      return 'event';
    default:
      return 'info';
  }
}

export function getColorActividadExpediente(tipo: string): string {
  switch (tipo) {
    case 'historial_clinico':
      return '#7b2c5c';
    case 'historial_clinico_editado':
      return '#ff9800';
    case 'historial_clinico_eliminado':
      return '#f44336';
    case 'vacuna':
      return '#4caf50';
    case 'vacuna_editada':
      return '#ff9800';
    case 'vacuna_eliminada':
      return '#f44336';
    case 'recordatorio':
      return '#ff9800';
    case 'recordatorio_editado':
      return '#ff9800';
    case 'recordatorio_eliminado':
      return '#f44336';
    case 'cita':
      return '#2196f3';
    default:
      return '#888';
  }
}
