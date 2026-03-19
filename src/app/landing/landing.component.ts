import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AnalyticsService } from '../shared/services/analytics.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0',
        opacity: '0',
        overflow: 'hidden',
        padding: '0 24px'
      })),
      state('expanded', style({
        height: '*',
        opacity: '1',
        overflow: 'visible',
        padding: '20px 24px'
      })),
      transition('collapsed <=> expanded', animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class LandingComponent implements OnInit, OnDestroy {
  // URLs de redes de comunicación (configurables)
  readonly whatsappUrl = 'https://wa.me/528136024090';
  readonly whatsappMessage = 'Hola, quisiera información sobre sus servicios para mi mascota';
  readonly whatsappFullUrl = 'https://wa.me/528136024090?text=' + encodeURIComponent('Hola, quisiera información sobre sus servicios para mi mascota');
  readonly facebookUrl = 'https://www.facebook.com/katzenvet'; // Actualiza con tu página de FB real

  // Tracking de tiempo en página
  private startTime: number = Date.now();
  private scrollDepthTracked: { [key: number]: boolean } = {};
  
  // Propiedad para detectar si es móvil
  isMobile = false;
  
  // Banner de urgencia (CRO)
  showUrgencyBanner = true;
  citasDisponibles = 3; // Número dinámico de citas disponibles
  
  // Formulario de contacto
  contactForm: FormGroup;
  
  // Equipo Médico
  equipoMedico = [
    {
      nombre: 'Dra. Ana María González',
      especialidad: 'Medicina Veterinaria General',
      descripcion: 'Especialista en atención integral de mascotas con más de 8 años de experiencia.',
      imagen: 'assets/doctor-1.svg',
      altText: 'Doctora Ana María González',
      experiencia: '8+ años',
      certificaciones: ['Medicina Veterinaria UANL', 'Especialista en Pequeñas Especies']
    },
    {
      nombre: 'Dra. Carmen Elena Rodríguez',
      especialidad: 'Cirugía Veterinaria',
      descripcion: 'Cirujana veterinaria especializada en procedimientos complejos y emergencias.',
      imagen: 'assets/doctor-2.svg',
      altText: 'Doctora Carmen Elena Rodríguez',
      experiencia: '12+ años',
      certificaciones: ['Cirugía Veterinaria UNAM', 'Especialista en Traumatología']
    },
    {
      nombre: 'Dra. Laura Patricia Martínez',
      especialidad: 'Medicina Interna y Emergencias',
      descripcion: 'Especialista en medicina interna y atención de emergencias 24/7.',
      imagen: 'assets/doctor-3.svg',
      altText: 'Doctora Laura Patricia Martínez',
      experiencia: '10+ años',
      certificaciones: ['Medicina Interna UANL', 'Especialista en Emergencias']
    }
  ];

  // Servicios completos con propiedades expandibles
  servicios = [
    {
      materialIcon: 'medical_services',
      titulo: 'Consultas Generales',
      descripcion: 'Atención médica integral para perros y gatos con veterinarios especializados.',
      color: '#0284c7',
      precio: '250',
      duracion: '45 min',
      features: ['Examen físico completo', 'Diagnóstico personalizado', 'Seguimiento continuo'],
      incluye: ['Consulta personalizada', 'Examen físico completo', 'Recomendaciones médicas', 'Receta si es necesaria'],
      expanded: false
    },
    {
      materialIcon: 'vaccines',
      titulo: 'Vacunas',
      descripcion: 'Esquemas completos de vacunación para mascotas de todas las edades.',
      color: '#16a34a',
      precio: '350',
      duracion: '30 min',
      features: ['Calendario personalizado', 'Vacunas de calidad', 'Recordatorios automáticos'],
      incluye: ['Vacuna seleccionada', 'Certificado de vacunación', 'Calendario personalizado', 'Recordatorio de próxima dosis'],
      expanded: false
    },
    {
      materialIcon: 'surgery',
      titulo: 'Cirugías',
      descripcion: 'Procedimientos quirúrgicos menores y mayores con tecnología avanzada.',
      color: '#dc2626',
      precio: '1500',
      duracion: '2-4 horas',
      features: ['Equipo moderno', 'Anestesia segura', 'Recuperación guiada'],
      incluye: ['Procedimiento quirúrgico', 'Anestesia y monitoreo', 'Hospitalización post-operatoria', 'Seguimiento de recuperación'],
      expanded: false
    },
    {
      materialIcon: 'science',
      titulo: 'Laboratorios',
      descripcion: 'Análisis clínicos, pruebas de sangre y diagnósticos especializados.',
      color: '#7c3aed',
      precio: '450',
      duracion: '15 min',
      features: ['Resultados rápidos', 'Tecnología avanzada', 'Interpretación experta'],
      incluye: ['Toma de muestra', 'Análisis completo', 'Resultados en 24h', 'Interpretación médica'],
      expanded: false
    },
    {
      materialIcon: 'medication',
      titulo: 'Desparasitación',
      descripcion: 'Tratamientos preventivos y curativos para parásitos internos y externos.',
      color: '#ea580c',
      precio: '200',
      duracion: '20 min',
      features: ['Productos de calidad', 'Aplicación profesional', 'Seguimiento preventivo'],
      incluye: ['Producto desparasitante', 'Aplicación profesional', 'Recomendaciones de prevención', 'Seguimiento de próximas dosis'],
      expanded: false
    },
    {
      materialIcon: 'emergency',
      titulo: 'Emergencias 24/7',
      descripcion: 'Atención de emergencias veterinarias las 24 horas del día.',
      color: '#dc2626',
      precio: '800',
      duracion: 'Variable',
      features: ['Atención inmediata', 'Equipo de emergencias', 'Hospitalización si es necesaria'],
      incluye: ['Atención de emergencia', 'Estabilización del paciente', 'Tratamiento inicial', 'Recomendaciones de seguimiento'],
      expanded: false
    }
  ];

  // Características premium de la clínica
  premiumFeatures = [
    {
      materialIcon: 'verified',
      title: 'Experiencia Comprobada',
      description: 'Más de una década cuidando mascotas con excelencia y profesionalismo.',
      color: '#0284c7',
      highlights: ['10+ años de experiencia', 'Profesionales certificados', 'Miles de pacientes atendidos']
    },
    {
      materialIcon: 'medical_services',
      title: 'Tecnología Avanzada',
      description: 'Equipos modernos y diagnósticos precisos para el mejor cuidado de tu mascota.',
      color: '#16a34a',
      highlights: ['Equipos de última generación', 'Diagnósticos precisos', 'Resultados rápidos']
    },
    {
      materialIcon: 'favorite',
      title: 'Trato Personalizado',
      description: 'Cada mascota es única y recibe atención personalizada y amorosa.',
      color: '#dc2626',
      highlights: ['Atención individualizada', 'Seguimiento continuo', 'Relación de confianza']
    },
    {
      materialIcon: 'schedule',
      title: 'Horarios Flexibles',
      description: 'Atención cuando más lo necesitas, con horarios extendidos y emergencias 24/7.',
      color: '#7c3aed',
      highlights: ['Horarios extendidos', 'Emergencias 24/7', 'Citas programadas']
    }
  ];

  // Estadísticas del hero (datos reales)
  stats = [
    { numero: '10+', label: 'Años de Experiencia', materialIcon: 'star', color: '#fbbf24' },
    { numero: '4.9', label: 'Rating en Google', materialIcon: 'grade', color: '#f59e0b' },
    { numero: '24+', label: 'Reseñas Verificadas', materialIcon: 'verified', color: '#10b981' }
  ];

  // Información de contacto
  contactInfo = [
    {
      icon: 'location_on',
      title: 'Dirección',
      content: 'C. Zinc 318, Los Cristales 1er Sector, 67117 Guadalupe, N.L., México',
      color: '#dc2626'
    },
    {
      icon: 'phone',
      title: 'Teléfono',
      content: '+52 81 3602 4090',
      color: '#0284c7'
    },
    {
      icon: 'whatsapp',
      title: 'WhatsApp',
      content: '+52 81 3602 4090',
      link: 'https://wa.me/528136024090',
      linkText: 'Enviar mensaje',
      color: '#25d366'
    },
    {
      icon: 'email',
      title: 'Email',
      content: 'info&#64;katzenvet.com',
      link: 'mailto:info&#64;katzenvet.com',
      linkText: 'Enviar email',
      color: '#16a34a'
    },
    {
      icon: 'schedule',
      title: 'Horarios',
      content: 'Lunes a Viernes: 10:00 AM - 7:00 PM | Sábado: 10:00 AM - 4:00 PM',
      color: '#7c3aed'
    },
    {
      icon: 'emergency',
      title: 'Emergencias',
      content: '24 horas, 7 días a la semana',
      color: '#ea580c'
    }
  ];

  // Horarios de atención (reales)
  horarios = [
    { dia: 'Lunes - Viernes', horario: '10:00 AM - 7:00 PM' },
    { dia: 'Sábado', horario: '10:00 AM - 4:00 PM' },
    { dia: 'Domingo', horario: 'Cerrado (Emergencias por WhatsApp)' }
  ];

  // Testimonios reales de Google My Business
  testimonios = [
    {
      nombre: 'Andrea Martínez',
      ubicacion: 'Guadalupe, N.L.',
      rating: 5,
      fecha: 'Agosto 2023',
      testimonio: 'Las doctoras muy amables ❤️ mi perrito es muy difícil de tratar porque se pone algo nervioso y agresivo con gente que no conoce, pero ellas súper pacientes y buenas. Además de que cuentan con servicio a domicilio. Definitivamente van a ser mis veterinarias de cabecera :)',
      avatar: 'https://ui-avatars.com/api/?name=Andrea+Martinez&background=0284c7&color=fff&size=128'
    },
    {
      nombre: 'Salma Gamez',
      ubicacion: 'Monterrey, N.L.',
      rating: 5,
      fecha: 'Septiembre 2024',
      testimonio: 'Excelente servicio, lo recomiendo mucho. Las doctoras muy capacitadas, se nota su interés por sus pacientes. Aquí llevé a mi mascota y quedamos muy satisfechos con la atención.',
      avatar: 'https://ui-avatars.com/api/?name=Salma+Gamez&background=16a34a&color=fff&size=128'
    },
    {
      nombre: 'Gisel Olvera',
      ubicacion: 'Guadalupe, N.L.',
      rating: 5,
      fecha: 'Octubre 2023',
      testimonio: 'Aquí esterilicé a mi perrita Pug y todo salió perfecto. Aunque la cirugía de mi perrita se complicó, la atendieron súper bien y con mucho profesionalismo. ¡Muy recomendado!',
      avatar: 'https://ui-avatars.com/api/?name=Gisel+Olvera&background=7c3aed&color=fff&size=128'
    },
    {
      nombre: 'Nhilze Cantú',
      ubicacion: 'Guadalupe, N.L.',
      rating: 5,
      fecha: 'Agosto 2023',
      testimonio: 'Amé, precios accesibles, atención buenísima y servicio súper completo 👏. Las doctoras son muy profesionales y se nota que aman a los animales.',
      avatar: 'https://ui-avatars.com/api/?name=Nhilze+Cantu&background=dc2626&color=fff&size=128'
    },
    {
      nombre: 'Kenya Mora',
      ubicacion: 'Monterrey, N.L.',
      rating: 5,
      fecha: 'Agosto 2023',
      testimonio: 'Súper amables y atentos, excelente servicio. Llevé a mi gatita y la atendieron con mucho cariño. Definitivamente regresaré.',
      avatar: 'https://ui-avatars.com/api/?name=Kenya+Mora&background=ea580c&color=fff&size=128'
    },
    {
      nombre: 'Gerardo Garza',
      ubicacion: 'Guadalupe, N.L.',
      rating: 5,
      fecha: 'Septiembre 2024',
      testimonio: 'Llevamos a nuestra gatita a cirugía y salió todo bien. Las doctoras son muy profesionales y nos explicaron todo el procedimiento.',
      avatar: 'https://ui-avatars.com/api/?name=Gerardo+Garza&background=0284c7&color=fff&size=128'
    },
    {
      nombre: 'Nikky Ripol',
      ubicacion: 'Guadalupe, N.L.',
      rating: 5,
      fecha: 'Septiembre 2024',
      testimonio: 'Excelente atención y servicio. Muy recomendado, las doctoras son muy amables y profesionales.',
      avatar: 'https://ui-avatars.com/api/?name=Nikky+Ripol&background=16a34a&color=fff&size=128'
    },
    {
      nombre: 'Alondra Zamudio Castro',
      ubicacion: 'Guadalupe, N.L.',
      rating: 5,
      fecha: 'Septiembre 2024',
      testimonio: 'Excelente veterinaria, la doctora que atiende es un amor de persona, súper cariñosa con los animalitos y les brinda un trato excepcional.',
      avatar: 'https://ui-avatars.com/api/?name=Alondra+Zamudio&background=7c3aed&color=fff&size=128'
    }
  ];

  // FAQ - Preguntas Frecuentes
  faqs = [
    {
      pregunta: '¿Necesito cita previa o puedo llegar sin cita?',
      respuesta: 'Recomendamos agendar cita para garantizar atención inmediata, pero también atendemos sin cita según disponibilidad. Para emergencias, estamos disponibles 24/7 por WhatsApp.',
      icon: 'schedule',
      expanded: false
    },
    {
      pregunta: '¿Qué formas de pago aceptan?',
      respuesta: 'Aceptamos efectivo, tarjetas de crédito, tarjetas de débito y transferencias bancarias. Pregunta por nuestros planes de pago para cirugías.',
      icon: 'payment',
      expanded: false
    },
    {
      pregunta: '¿Cuánto cuesta una consulta general?',
      respuesta: 'La consulta general tiene un costo de $250 MXN e incluye examen físico completo, diagnóstico personalizado y receta. Primera consulta con 10% de descuento.',
      icon: 'local_hospital',
      expanded: false
    },
    {
      pregunta: '¿Atienden emergencias 24/7?',
      respuesta: 'Sí, atendemos emergencias las 24 horas del día, los 7 días de la semana. Contáctanos por WhatsApp al 81 3602 4090 para atención inmediata.',
      icon: 'emergency',
      expanded: false
    },
    {
      pregunta: '¿Atienden gatos además de perros?',
      respuesta: 'Sí, atendemos tanto perros como gatos. Nuestro equipo está especializado en medicina para pequeñas especies y brindamos atención especializada para ambos.',
      icon: 'pets',
      expanded: false
    },
    {
      pregunta: '¿Tienen estacionamiento disponible?',
      respuesta: 'Sí, contamos con estacionamiento gratuito disponible para nuestros clientes. El acceso es fácil y seguro.',
      icon: 'local_parking',
      expanded: false
    },
    {
      pregunta: '¿Hacen cirugías en el mismo lugar?',
      respuesta: 'Sí, contamos con quirófano equipado con tecnología moderna. Realizamos cirugías menores y mayores: esterilizaciones, castraciones, cirugías ortopédicas y más.',
      icon: 'medical_services',
      expanded: false
    },
    {
      pregunta: '¿Cuánto tarda una consulta general?',
      respuesta: 'Una consulta general suele durar entre 20 y 30 minutos, dependiendo de las necesidades de tu mascota. Nos tomamos el tiempo necesario para un diagnóstico preciso.',
      icon: 'access_time',
      expanded: false
    },
    {
      pregunta: '¿Hacen visitas a domicilio?',
      respuesta: 'Sí, ofrecemos servicio a domicilio para consultas, vacunación y algunos tratamientos. Contáctanos para verificar disponibilidad en tu zona.',
      icon: 'home',
      expanded: false
    },
    {
      pregunta: '¿Tienen servicio de hospitalización?',
      respuesta: 'Sí, contamos con área de hospitalización con monitoreo constante para pacientes que requieren cuidados especiales post-cirugía o tratamientos intensivos.',
      icon: 'hotel',
      expanded: false
    }
  ];

  // Por Qué Elegirnos - Diferenciadores
  porQueElegirnos = [
    {
      titulo: '+10 Años de Experiencia',
      descripcion: 'Más de una década cuidando mascotas en Guadalupe, N.L.',
      icon: 'star',
      color: '#f59e0b',
      stats: '10+ años'
    },
    {
      titulo: 'Tecnología de Punta',
      descripcion: 'Equipos médicos modernos para diagnósticos precisos y tratamientos efectivos',
      icon: 'biotech',
      color: '#0284c7',
      stats: 'Equipos modernos'
    },
    {
      titulo: 'Atención Personalizada',
      descripcion: 'Cada mascota recibe un plan de cuidado único adaptado a sus necesidades',
      icon: 'favorite',
      color: '#dc2626',
      stats: 'Trato único'
    },
    {
      titulo: 'Emergencias 24/7',
      descripcion: 'Disponibles por WhatsApp cualquier día, cualquier hora del año',
      icon: 'emergency',
      color: '#ea580c',
      stats: '24/7/365'
    },
    {
      titulo: 'Precios Justos',
      descripcion: 'Calidad profesional a precios accesibles para todas las familias',
      icon: 'savings',
      color: '#16a34a',
      stats: 'Desde $250'
    },
    {
      titulo: '4.9 ⭐ en Google',
      descripcion: '24+ clientes satisfechos nos respaldan con reseñas reales verificadas',
      icon: 'verified',
      color: '#7c3aed',
      stats: '4.9/5 rating'
    },
    {
      titulo: 'Servicio a Domicilio',
      descripcion: 'Atención veterinaria en la comodidad de tu hogar cuando lo necesites',
      icon: 'home',
      color: '#0891b2',
      stats: 'A domicilio'
    },
    {
      titulo: 'Instalaciones Certificadas',
      descripcion: 'Clínica con todos los permisos, certificaciones y estándares de calidad',
      icon: 'verified_user',
      color: '#059669',
      stats: 'Certificada'
    }
  ];

  scrollPosition = 0;
  isScrolled = false;
  isSubmitting = false;
  isMobileMenuOpen = false;

  constructor(
    private fb: FormBuilder,
    private analytics: AnalyticsService
  ) {
    this.contactForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s\-\(\)]+$/)]],
      mascota: ['', Validators.required],
      mensaje: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit() {
    this.checkScroll();
    this.checkScreenSize();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.checkScroll();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  checkScroll() {
    this.scrollPosition = window.pageYOffset;
    this.isScrolled = this.scrollPosition > 100;
    
    // Track scroll depth
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollPercent = Math.round((this.scrollPosition + windowHeight) / documentHeight * 100);
    
    // Track milestones: 25%, 50%, 75%, 90%
    [25, 50, 75, 90].forEach(milestone => {
      if (scrollPercent >= milestone && !this.scrollDepthTracked[milestone]) {
        this.scrollDepthTracked[milestone] = true;
        this.analytics.trackScrollDepth(milestone);
      }
    });
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  toggleService(index: number) {
    this.servicios[index].expanded = !this.servicios[index].expanded;
  }

  toggleFaq(index: number) {
    // Cerrar todas las demás FAQs
    this.faqs.forEach((faq, i) => {
      if (i !== index) {
        faq.expanded = false;
      }
    });
    // Toggle la FAQ seleccionada
    this.faqs[index].expanded = !this.faqs[index].expanded;
    
    // Track analytics si se expandió
    if (this.faqs[index].expanded) {
      this.analytics.trackFaqExpansion(this.faqs[index].pregunta, index);
    }
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  onSubmitContacto() {
    if (this.contactForm.valid) {
      this.isSubmitting = true;
      console.log('Formulario de contacto enviado:', this.contactForm.value);
      
      // Track analytics del envío
      this.analytics.trackContactFormSubmit(true);
      this.analytics.trackConversion('formulario_contacto', 500);
      
      // Simular envío del formulario
      setTimeout(() => {
        alert('¡Gracias por tu mensaje! Te contactaremos pronto.');
        this.contactForm.reset();
        this.isSubmitting = false;
      }, 2000);
    } else {
      // Track error en formulario
      this.analytics.trackContactFormSubmit(false);
      this.markFormGroupTouched();
    }
  }

  markFormGroupTouched() {
    Object.keys(this.contactForm.controls).forEach(key => {
      const control = this.contactForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.contactForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control?.hasError('email')) {
      return 'Ingresa un email válido';
    }
    if (control?.hasError('minlength')) {
      return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    if (control?.hasError('pattern')) {
      return 'Formato de teléfono inválido';
    }
    return '';
  }

  // Métodos públicos para tracking desde el HTML
  trackWhatsApp(ubicacion: string): void {
    this.analytics.trackWhatsAppClick(ubicacion);
    this.analytics.trackConversion('whatsapp', 500);
  }

  trackFacebook(ubicacion: string): void {
    this.analytics.trackEvent('facebook_click', {
      event_category: 'engagement',
      event_label: ubicacion,
      value: 1
    });
  }

  trackPhone(ubicacion: string): void {
    this.analytics.trackPhoneClick(ubicacion);
    this.analytics.trackConversion('llamada', 500);
  }

  trackAgendarCita(ubicacion: string): void {
    this.analytics.trackAgendarCitaClick(ubicacion);
    this.analytics.trackConversion('agendar_cita', 500);
  }

  trackComoLlegar(ubicacion: string): void {
    this.analytics.trackComoLlegarClick(ubicacion);
  }

  trackTestimonios(): void {
    this.analytics.trackTestimonioClick();
  }

  trackServicio(servicio: string): void {
    this.analytics.trackServiceClick(servicio);
  }

  closeUrgencyBanner(): void {
    this.showUrgencyBanner = false;
    // Track que el usuario cerró el banner
    this.analytics.trackEvent('urgency_banner_closed', {
      event_category: 'user_interaction',
      event_label: 'banner_dismissed'
    });
  }

  ngOnDestroy() {
    // Track tiempo en página antes de salir
    const timeOnPage = Math.round((Date.now() - this.startTime) / 1000);
    this.analytics.trackTimeOnPage(timeOnPage);
  }
}
