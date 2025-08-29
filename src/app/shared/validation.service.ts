import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  constructor() { }

  // Validar formato de email
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validar formato de teléfono (México)
  isValidPhoneMX(phone: string): boolean {
    const phoneRegex = /^(\+52|52)?[1-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s|-/g, ''));
  }

  // Validar que una fecha no sea anterior a hoy
  isValidFutureDate(date: string): boolean {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate >= today;
  }

  // Validar que un precio sea positivo
  isValidPrice(price: number): boolean {
    return price > 0;
  }

  // Validar que una cadena no esté vacía
  isNotEmpty(value: string): boolean {
    return value && value.trim().length > 0;
  }

  // Validar longitud mínima
  hasMinLength(value: string, minLength: number): boolean {
    return value && value.trim().length >= minLength;
  }

  // Validar longitud máxima
  hasMaxLength(value: string, maxLength: number): boolean {
    return value && value.trim().length <= maxLength;
  }

  // Validar que dos fechas no se superpongan
  datesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = new Date(end2).getTime();

    return (s1 <= e2) && (s2 <= e1);
  }

  // Validar que una hora esté en formato válido (HH:MM)
  isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  // Validar que una fecha esté en formato válido (YYYY-MM-DD)
  isValidDateFormat(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }

  // Validar campos requeridos para diferentes entidades
  validateRequiredFields(entity: string, data: any): string[] {
    const errors: string[] = [];

    switch (entity) {
      case 'cliente':
        if (!this.isNotEmpty(data.nombre)) errors.push('El nombre es requerido');
        if (data.correo && !this.isValidEmail(data.correo)) errors.push('El formato del email es inválido');
        if (data.telefono && !this.isValidPhoneMX(data.telefono)) errors.push('El formato del teléfono es inválido');
        break;

      case 'paciente':
        if (!this.isNotEmpty(data.nombre)) errors.push('El nombre de la mascota es requerido');
        if (!this.isNotEmpty(data.especie)) errors.push('La especie es requerida');
        if (!data.cliente_id) errors.push('Debe seleccionar un cliente');
        break;

      case 'cita':
        if (!data.paciente_id) errors.push('Debe seleccionar un paciente');
        if (!this.isValidDateFormat(data.fecha)) errors.push('La fecha debe tener formato válido');
        if (!this.isValidTimeFormat(data.hora)) errors.push('La hora debe tener formato válido (HH:MM)');
        if (!this.isValidFutureDate(data.fecha)) errors.push('La fecha no puede ser anterior a hoy');
        break;

      case 'vacuna':
        if (!data.idPaciente) errors.push('Debe seleccionar un paciente');
        if (!this.isNotEmpty(data.vacuna)) errors.push('El nombre de la vacuna es requerido');
        if (data.fechaAplicacion && !this.isValidDateFormat(data.fechaAplicacion)) {
          errors.push('La fecha de aplicación debe tener formato válido');
        }
        break;

      case 'banio':
        if (!data.paciente_id) errors.push('Debe seleccionar un paciente');
        if (!this.isValidDateFormat(data.fecha_banio)) errors.push('La fecha debe tener formato válido');
        if (!this.isValidTimeFormat(data.hora_banio)) errors.push('La hora debe tener formato válido (HH:MM)');
        if (!this.isValidFutureDate(data.fecha_banio)) errors.push('La fecha no puede ser anterior a hoy');
        if (data.precio_total && !this.isValidPrice(data.precio_total)) {
          errors.push('El precio debe ser mayor a 0');
        }
        break;

      case 'historial':
        if (!data.paciente_id) errors.push('Debe seleccionar un paciente');
        if (!this.isNotEmpty(data.diagnostico_presuntivo)) {
          errors.push('El diagnóstico presuntivo es requerido');
        }
        break;

      case 'recordatorio':
        if (!data.paciente_id) errors.push('Debe seleccionar un paciente');
        if (!this.isNotEmpty(data.titulo)) errors.push('El título es requerido');
        if (!this.isValidDateFormat(data.fecha_hora_recordatorio?.split(' ')[0])) {
          errors.push('La fecha del recordatorio debe tener formato válido');
        }
        break;

      case 'usuario':
        if (!this.isNotEmpty(data.nombre)) errors.push('El nombre es requerido');
        if (data.correo && !this.isValidEmail(data.correo)) errors.push('El formato del email es inválido');
        if (!this.isNotEmpty(data.perfil)) errors.push('El perfil es requerido');
        break;
    }

    return errors;
  }

  // Obtener mensaje de error amigable
  getErrorMessage(field: string, validation: string): string {
    const messages: { [key: string]: { [key: string]: string } } = {
      nombre: {
        required: 'El nombre es requerido',
        minLength: 'El nombre debe tener al menos 2 caracteres',
        maxLength: 'El nombre no puede exceder 50 caracteres'
      },
      email: {
        required: 'El email es requerido',
        format: 'El formato del email es inválido'
      },
      telefono: {
        format: 'El formato del teléfono es inválido'
      },
      fecha: {
        required: 'La fecha es requerida',
        format: 'El formato de la fecha es inválido',
        future: 'La fecha no puede ser anterior a hoy'
      },
      precio: {
        positive: 'El precio debe ser mayor a 0'
      }
    };

    return messages[field]?.[validation] || 'Campo inválido';
  }
}
