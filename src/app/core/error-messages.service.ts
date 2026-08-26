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
    'popup-closed-by-user': 'Cerraste la ventana sin iniciar sesión.',
    'not-found': 'El recurso solicitado no existe.',
    'already-exists': 'El registro ya existe.',
    'failed-precondition': 'No se cumplen las condiciones para esta operación.',
    'invalid-argument': 'Los datos enviados no son válidos.',
    'resource-exhausted': 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
    'internal': 'Error interno del servidor. Intenta de nuevo.'
  };

  private static readonly FUNCTIONS_MESSAGES: Record<string, string> = {
    'functions/not-found':
      'La función del servidor no está disponible. Las Cloud Functions del portal aún no están desplegadas.',
    'functions/unavailable': 'El servidor no respondió. Revisa tu conexión e intenta de nuevo.',
    'functions/deadline-exceeded': 'La operación tardó demasiado. Intenta de nuevo.',
    'functions/resource-exhausted': 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
    'functions/internal': 'Error interno del servidor al procesar la solicitud.'
  };

  private static readonly CONTEXT_MESSAGES: Record<string, string> = {
    'subir imagen': 'No se pudo subir la imagen. Revisa tu conexión y permisos.',
    'guardar cliente': 'No se pudo guardar el cliente. Intenta de nuevo.',
    'guardar historial': 'No se pudo guardar el historial clínico.',
    'eliminar historial': 'No se pudo eliminar el historial clínico.',
    'subir archivos': 'No se pudieron subir algunos archivos. Inténtalo de nuevo.',
    'cargar datos': 'No se pudieron cargar los datos. Revisa tu conexión.',
    'guardar cita': 'No se pudo guardar la cita. Revisa veterinario, horario y datos obligatorios.',
    'cancelar cita': 'No se pudo cancelar la cita.',
    'revertir cita': 'No se pudo revertir el estado de la cita.',
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
    'registrar ajuste': 'No se pudo registrar el ajuste. Verifica que seas supervisor (administrador o veterinario) y que el motivo esté completo.',
    'registrar entrada': 'No se pudo registrar la entrada.',
    'registrar salida': 'No se pudo registrar la salida.',
    'registrar merma': 'No se pudo registrar la merma. Verifica stock disponible y que el motivo esté completo.',
    'stock insuficiente': 'No hay suficiente stock para esta operación.',
    'autorizar ajuste inventario': 'Solo un supervisor (administrador o veterinario) puede registrar ajustes de inventario.',
    'resolver alerta': 'No se pudo resolver la alerta.',
    'generar alertas': 'No se pudieron generar las alertas.',
    'eliminar producto': 'No se pudo borrar el producto.',
    'eliminar proveedor': 'No se pudo borrar el proveedor.',
    'cargar citas': 'No se pudieron cargar las citas.',
    'eliminar cita': 'No se pudo borrar la cita.',
    'cambiar estado cita': 'No se pudo cambiar el estado de la cita.',
    'cargar banios': 'No se pudieron cargar los baños.',
    'eliminar banio': 'No se pudo borrar el baño.',
    'cambiar estado banio': 'No se pudo cambiar el estado del baño.',
    'cargar pacientes expediente': 'No se pudieron cargar los datos para buscar pacientes.',
    'guardar usuario': 'No se pudo guardar el usuario.',
    'dar de baja usuario': 'No se pudo borrar al usuario.',
    'guardar recordatorio': 'No se pudo guardar el recordatorio.',
    'eliminar recordatorio': 'No se pudo borrar el recordatorio.',
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
    'cargar estadisticas historiales': 'No se pudieron cargar las estadísticas de historiales.',
    'activar portal cliente': 'No se pudo activar el acceso al portal del cliente.',
    'desactivar portal cliente': 'No se pudo desactivar el acceso al portal.',
    'reenviar acceso portal': 'No se pudo reenviar el acceso al portal.',
    'vincular portal dual': 'No se pudo vincular el portal dual al personal staff.',
    'registro portal dueño': 'No se pudo completar el registro en el portal.',
    'cambiar contraseña portal': 'No se pudo cambiar la contraseña.'
  };

  getUserMessage(error: unknown, context?: string): string {
    if (error == null) {
      return this.getGenericMessage(context);
    }

    const err = error as { code?: string; message?: string; details?: unknown };

    if (err.code) {
      const storageMsg = ErrorMessagesService.STORAGE_MESSAGES[err.code];
      if (storageMsg) return storageMsg;

      const functionsMsg = ErrorMessagesService.FUNCTIONS_MESSAGES[err.code];
      const serverMsg = ErrorMessagesService.extractCallableMessage(err);
      if (serverMsg) return serverMsg;
      if (functionsMsg) return functionsMsg;

      const bareCode = err.code.replace(/^functions\//, '');
      const firebaseMsg =
        ErrorMessagesService.FIREBASE_MESSAGES[err.code] ||
        ErrorMessagesService.FIREBASE_MESSAGES[bareCode];
      if (firebaseMsg) return firebaseMsg;
    }

    const fallbackMsg = ErrorMessagesService.extractCallableMessage(err);
    if (fallbackMsg) return fallbackMsg;

    return this.getGenericMessage(context);
  }

  /** Mensaje útil de Cloud Functions (HttpsError), evitando códigos crudos como "internal". */
  private static extractCallableMessage(err: { code?: string; message?: string; details?: unknown }): string | null {
    const raw = typeof err.message === 'string' ? err.message.trim() : '';
    const bareCode = String(err.code || '').replace(/^functions\//, '').toLowerCase();
    const generic = new Set(['internal', 'unknown', 'not-found', 'deadline-exceeded', bareCode]);

    if (raw && raw.length > 0 && raw.length < 240 && !raw.includes(' at ') && !raw.includes('Error:')) {
      if (!generic.has(raw.toLowerCase())) {
        return raw;
      }
    }

    if (typeof err.details === 'string' && err.details.trim().length > 0 && err.details.length < 240) {
      return err.details.trim();
    }

    return null;
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
