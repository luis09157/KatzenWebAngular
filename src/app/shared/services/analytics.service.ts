import { Injectable } from '@angular/core';

/**
 * Servicio de Analytics para trackear eventos personalizados
 * Integrado con Google Analytics 4 (GA4) y Google Tag Manager (GTM)
 */
@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor() { }

  /**
   * Envía un evento personalizado a GA4
   * @param eventName Nombre del evento
   * @param eventParams Parámetros adicionales del evento
   */
  trackEvent(eventName: string, eventParams?: any): void {
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, eventParams);
    }
    console.log('📊 Analytics Event:', eventName, eventParams);
  }

  /**
   * Trackea clics en botones de WhatsApp
   * @param ubicacion Ubicación del botón (ej: 'hero', 'faq', 'floating')
   */
  trackWhatsAppClick(ubicacion: string): void {
    this.trackEvent('whatsapp_click', {
      event_category: 'engagement',
      event_label: ubicacion,
      value: 1
    });
  }

  /**
   * Trackea clics en botones de teléfono
   * @param ubicacion Ubicación del botón (ej: 'navbar', 'ubicacion', 'contacto')
   */
  trackPhoneClick(ubicacion: string): void {
    this.trackEvent('phone_click', {
      event_category: 'engagement',
      event_label: ubicacion,
      value: 1
    });
  }

  /**
   * Trackea clics en "Agendar Cita"
   * @param ubicacion Ubicación del botón
   */
  trackAgendarCitaClick(ubicacion: string): void {
    this.trackEvent('agendar_cita_click', {
      event_category: 'conversion',
      event_label: ubicacion,
      value: 5
    });
  }

  /**
   * Trackea clics en "Cómo Llegar" o mapa
   * @param ubicacion Ubicación del enlace
   */
  trackComoLlegarClick(ubicacion: string): void {
    this.trackEvent('como_llegar_click', {
      event_category: 'engagement',
      event_label: ubicacion,
      value: 3
    });
  }

  /**
   * Trackea expansión de preguntas FAQ
   * @param pregunta Texto de la pregunta expandida
   * @param index Índice de la pregunta
   */
  trackFaqExpansion(pregunta: string, index: number): void {
    this.trackEvent('faq_expansion', {
      event_category: 'engagement',
      event_label: pregunta,
      faq_index: index,
      value: 1
    });
  }

  /**
   * Trackea scroll profundo en la página
   * @param percentage Porcentaje de scroll (25, 50, 75, 100)
   */
  trackScrollDepth(percentage: number): void {
    this.trackEvent('scroll_depth', {
      event_category: 'engagement',
      event_label: `${percentage}%`,
      value: percentage
    });
  }

  /**
   * Trackea envío del formulario de contacto
   * @param success Si el envío fue exitoso
   */
  trackContactFormSubmit(success: boolean): void {
    this.trackEvent('contact_form_submit', {
      event_category: 'conversion',
      event_label: success ? 'success' : 'error',
      value: success ? 10 : 0
    });
  }

  /**
   * Trackea clics en servicios específicos
   * @param nombreServicio Nombre del servicio
   */
  trackServiceClick(nombreServicio: string): void {
    this.trackEvent('service_click', {
      event_category: 'engagement',
      event_label: nombreServicio,
      value: 2
    });
  }

  /**
   * Trackea visualización de secciones
   * @param seccion Nombre de la sección vista
   */
  trackSectionView(seccion: string): void {
    this.trackEvent('section_view', {
      event_category: 'engagement',
      event_label: seccion,
      value: 1
    });
  }

  /**
   * Trackea clics en testimonios de Google
   */
  trackTestimonioClick(): void {
    this.trackEvent('testimonio_click', {
      event_category: 'social_proof',
      event_label: 'google_reviews',
      value: 3
    });
  }

  /**
   * Trackea interacción con el equipo médico
   * @param nombreDoctor Nombre del doctor
   */
  trackDoctorClick(nombreDoctor: string): void {
    this.trackEvent('doctor_click', {
      event_category: 'engagement',
      event_label: nombreDoctor,
      value: 1
    });
  }

  /**
   * Trackea tiempo en la página (llamar al destruir el componente)
   * @param tiempoSegundos Tiempo en segundos
   */
  trackTimeOnPage(tiempoSegundos: number): void {
    this.trackEvent('time_on_page', {
      event_category: 'engagement',
      event_label: 'landing_page',
      value: tiempoSegundos
    });
  }

  /**
   * Trackea conversión exitosa (objetivo principal)
   * @param tipo Tipo de conversión (ej: 'cita', 'whatsapp', 'llamada')
   * @param valor Valor monetario estimado
   */
  trackConversion(tipo: string, valor: number = 500): void {
    this.trackEvent('conversion', {
      event_category: 'conversion',
      event_label: tipo,
      value: valor,
      currency: 'MXN'
    });
  }
}

// Declaración global de gtag para TypeScript
declare let gtag: Function;




