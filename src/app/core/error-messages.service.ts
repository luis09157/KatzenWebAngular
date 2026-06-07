import { Injectable } from '@angular/core';

/**
 * Mensajes de error amigables para el usuario.
 * Mapea códigos de Firebase y errores genéricos sin romper flujos existentes.
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorMessagesService {

  private static readonly STORAGE_MESSAGES: Record<string, string> = {
    'storage/unauthorized': 'No tienes permiso para subir o ver archivos. Inicia sesión de nuevo.',
    'storage/canceled': 'Se canceló la subida.',
    'storage/unknown': 'Error desconocido al subir el archivo. Intenta de nuevo.',
    'storage/object-not-found': 'El archivo no existe o fue eliminado.',
    'storage/bucket-not-found': 'Error de configuración del almacenamiento.',
    'storage/project-not-found': 'Error de configuración del proyecto.',
    'storage/quota-exceeded': 'Se superó el espacio disponible. Contacta al administrador.',
    'storage/unauthenticated': 'Debes iniciar sesión para subir archivos.',
    'storage/retry-limit-exceeded': 'La subida falló tras varios intentos. Revisa tu conexión.'
  };

  private static readonly FIREBASE_MESSAGES: Record<string, string> = {
    'permission-denied': 'No tienes permiso para realizar esta acción.',
    'unavailable': 'El servicio no está disponible. Revisa tu conexión e intenta de nuevo.',
    'unauthenticated': 'Debes iniciar sesión para continuar.',
    'network-request-failed': 'Error de conexión. Revisa tu internet e intenta de nuevo.',
    'cancelled-popup-request': 'Se canceló la ventana de inicio de sesión.',
    'popup-closed-by-user': 'Cerraste la ventana sin iniciar sesión.'
  };

  private static readonly CONTEXT_MESSAGES: Record<string, string> = {
    'subir imagen': 'No se pudo subir la imagen. Revisa tu conexión y permisos.',
    'guardar cliente': 'No se pudo guardar el cliente. Intenta de nuevo.',
    'guardar historial': 'No se pudo guardar el historial clínico.',
    'eliminar historial': 'No se pudo eliminar el historial clínico.',
    'subir archivos': 'No se pudieron subir algunos archivos. Inténtalo de nuevo.',
    'cargar datos': 'No se pudieron cargar los datos. Revisa tu conexión.',
    'guardar cita': 'No se pudo guardar la cita.',
    'guardar vacuna': 'No se pudo guardar la vacuna.',
    'eliminar vacuna': 'No se pudo eliminar la vacuna.',
    'cambiar estado vacuna': 'No se pudo cambiar el estado de la vacuna.',
    'guardar paciente': 'No se pudo guardar el paciente.',
    'procesar formulario': 'Ocurrió un error al procesar el formulario.',
    'guardar producto': 'No se pudo guardar el producto.',
    'guardar proveedor': 'No se pudo guardar el proveedor.',
    'guardar orden': 'No se pudo crear la orden.',
    'recibir orden': 'No se pudo recibir la orden.',
    'cancelar orden': 'No se pudo cancelar la orden.',
    'registrar ajuste': 'No se pudo registrar el ajuste.',
    'registrar entrada': 'No se pudo registrar la entrada.',
    'registrar salida': 'No se pudo registrar la salida.',
    'resolver alerta': 'No se pudo resolver la alerta.',
    'generar alertas': 'No se pudieron generar las alertas.',
    'eliminar producto': 'No se pudo eliminar el producto.',
    'eliminar proveedor': 'No se pudo eliminar el proveedor.',
    'cargar citas': 'No se pudieron cargar las citas.',
    'eliminar cita': 'No se pudo eliminar la cita.',
    'cambiar estado cita': 'No se pudo cambiar el estado de la cita.',
    'cargar banios': 'No se pudieron cargar los baños.',
    'eliminar banio': 'No se pudo dar de baja el baño.',
    'cambiar estado banio': 'No se pudo cambiar el estado del baño.',
    'cargar pacientes expediente': 'No se pudieron cargar los datos para buscar pacientes.',
    'guardar usuario': 'No se pudo guardar el usuario.',
    'dar de baja usuario': 'No se pudo dar de baja al usuario.',
    'guardar recordatorio': 'No se pudo guardar el recordatorio.',
    'eliminar recordatorio': 'No se pudo eliminar el recordatorio.',
    'guardar banio': 'No se pudo guardar el baño.',
    'cargar historial expediente': 'No se pudo cargar el historial clínico del paciente.',
    'cargar recordatorios expediente': 'No se pudieron cargar los recordatorios del paciente.',
    'cargar vacunas expediente': 'No se pudieron cargar las vacunas del paciente.',
    'cargar banios expediente': 'No se pudieron cargar los baños del paciente.',
    'cargar actividad expediente': 'No se pudo cargar la actividad del paciente.',
    'cargar historial detalle': 'No se pudo cargar el detalle del historial.',
    'cargar clientes cita': 'No se pudieron cargar los clientes para la cita.',
    'cargar pacientes cita': 'No se pudieron cargar los pacientes para la cita.',
    'cargar doctores cita': 'No se pudieron cargar los veterinarios.',
    'cargar movimientos producto': 'No se pudieron cargar los movimientos del producto.',
    'cargar productos orden': 'No se pudieron cargar los productos para la orden.',
    'cargar proveedores orden': 'No se pudieron cargar los proveedores para la orden.',
    'cargar estadisticas historiales': 'No se pudieron cargar las estadísticas de historiales.'
  };

  getUserMessage(error: unknown, context?: string): string {
    if (error == null) {
      return this.getGenericMessage(context);
    }

    const err = error as { code?: string; message?: string };

    if (err.code) {
      const storageMsg = ErrorMessagesService.STORAGE_MESSAGES[err.code];
      if (storageMsg) return storageMsg;
      const firebaseMsg = ErrorMessagesService.FIREBASE_MESSAGES[err.code];
      if (firebaseMsg) return firebaseMsg;
    }

    if (err.message && typeof err.message === 'string') {
      const msg = err.message.trim();
      if (msg.length > 0 && msg.length < 200 && !msg.includes(' at ') && !msg.includes('Error:')) {
        return msg;
      }
    }

    return this.getGenericMessage(context);
  }

  private getGenericMessage(context?: string): string {
    if (context) {
      const ctx = context.toLowerCase().trim();
      const known = ErrorMessagesService.CONTEXT_MESSAGES[ctx];
      if (known) return known;
    }
    return 'Ocurrió un error. Por favor, intenta de nuevo.';
  }
}
