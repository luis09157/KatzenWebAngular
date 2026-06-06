# KatzenVet Landing — Handoff completo para rediseño

Generado: 2026-06-06

## Contexto del proyecto
- **Stack:** Angular 17.3 + Angular Material 17 + CSS custom (sin Tailwind)
- **Ruta:** `/` → `LandingComponent` (selector: `app-landing`)
- **Fuente:** Poppins (Google Fonts en index.html)
- **Marca:** Teal #0f766e / #0A969B — clínica veterinaria Guadalupe, N.L.
- **Objetivo conversión:** Agendar cita → scroll a #contacto + WhatsApp
- **Portal clientes:** Modal login → Firebase auth → /portal
- **Assets:** assets/katzen-logo.svg, assets/pets-hero.svg, assets/doctor-1/2/3.svg

## Estructura actual de secciones (orden en página)
1. Navbar fijo | 2. Hero | 3. Servicios rápidos (6 chips) | 4. Portal digital | 5. Por qué elegirnos | 6. Servicios detallados | 7. Testimonios | 8. FAQ | 9. Equipo | 10. Ubicación/mapa | 11. Contacto + form | 12. FAB WhatsApp | 13. Modal login | 14. CTA band | 15. Footer

## Dependencias TS (no romper)
- AnalyticsService, PortalAuthService, FormBuilder, SweetAlert2
- Métodos: agendarCita(), openPortalLogin(), loginPortal(), scrollToSection(), trackWhatsApp()

## Estilos globales relacionados
- src/styles/material-katzen-theme.scss
- src/styles/m3-katzen-system.scss
- angular.json carga esos + landing.component.css (scoped en :host)

---

## landing.module.ts
```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material Components
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatRippleModule } from '@angular/material/core';
import { MatBadgeModule } from '@angular/material/badge';

// Landing Component
import { LandingComponent } from './landing.component';

@NgModule({
  declarations: [
    LandingComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    
    // Angular Material Modules
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatSelectModule,
    MatRippleModule,
    MatBadgeModule
  ],
  exports: [
    LandingComponent
  ]
})
export class LandingModule { }
```

## landing.component.ts
```typescript
import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AnalyticsService } from '../shared/services/analytics.service';
import { PortalAuthService } from '../portal/services/portal-auth.service';
import Swal from 'sweetalert2';

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

  portalFeatures = [
    { icon: 'vaccines', title: 'Vacunas', description: 'Esquemas completos y fechas de próxima dosis' },
    { icon: 'event', title: 'Citas', description: 'Próximas citas y historial de consultas' },
    { icon: 'medical_information', title: 'Historial', description: 'Expediente clínico de cada mascota' },
    { icon: 'notifications', title: 'Avisos', description: 'Alertas y recordatorios de la clínica' }
  ];

  // Tracking de tiempo en página
  private startTime: number = Date.now();
  private scrollDepthTracked: { [key: number]: boolean } = {};
  
  // Propiedad para detectar si es móvil
  isMobile = false;
  
  // Banner de urgencia (solo en sección contacto, no flotante)
  showUrgencyBanner = true;
  citasDisponibles = 3;

  showPortalLoginModal = false;
  
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

  portalEmail = '';
  portalPassword = '';
  portalLoading = false;

  constructor(
    private fb: FormBuilder,
    private analytics: AnalyticsService,
    private portalAuth: PortalAuthService
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
    this.analytics.trackEvent('urgency_banner_closed', {
      event_category: 'user_interaction',
      event_label: 'banner_dismissed'
    });
  }

  async loginPortal(): Promise<void> {
    if (!this.portalEmail || !this.portalPassword) {
      Swal.fire({ icon: 'warning', title: 'Inicia sesión', text: 'Ingresa tu correo y contraseña de cliente.' });
      return;
    }
    this.portalLoading = true;
    try {
      const result = await this.portalAuth.login(this.portalEmail, this.portalPassword);
      if (result === 'none') {
        await this.portalAuth.logout();
        Swal.fire({
          icon: 'warning',
          title: 'Sin acceso al portal',
          text: 'Tu cuenta no está registrada como cliente. Si eres personal, usa acceso staff.'
        });
        return;
      }
      if (result === 'staff') {
        Swal.fire({ icon: 'info', title: 'Cuenta de staff', text: 'Te redirigimos al panel administrativo.', timer: 1800, showConfirmButton: false });
      }
      await this.portalAuth.navigateAfterLogin(result);
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Correo o contraseña incorrectos.' });
    } finally {
      this.portalLoading = false;
    }
  }

  openPortalLogin(): void {
    this.showPortalLoginModal = true;
    document.body.style.overflow = 'hidden';
  }

  closePortalLogin(): void {
    this.showPortalLoginModal = false;
    document.body.style.overflow = '';
  }

  irAMiPortal(): void {
    this.openPortalLogin();
  }

  agendarCita(ubicacion: string): void {
    this.trackAgendarCita(ubicacion);
    this.scrollToSection('contacto');
  }

  ngOnDestroy() {
    // Track tiempo en página antes de salir
    const timeOnPage = Math.round((Date.now() - this.startTime) / 1000);
    this.analytics.trackTimeOnPage(timeOnPage);
  }
}
```

## landing.component.html
```html
<!-- ===== NAVBAR ===== -->
<mat-toolbar class="landing-toolbar" [class.scrolled]="isScrolled">
  <div class="toolbar-inner">
    <a class="brand-block" (click)="scrollToSection('inicio')" role="button" tabindex="0">
      <img src="assets/katzen-logo.svg" alt="" class="brand-logo" width="32" height="32">
      <span class="brand-name">KatzenVet</span>
    </a>

    <nav class="nav-links mobile-hidden" aria-label="Navegación principal">
      <button mat-button (click)="scrollToSection('inicio')">Inicio</button>
      <button mat-button (click)="scrollToSection('servicios')">Servicios</button>
      <button mat-button (click)="scrollToSection('nosotros')">Nosotros</button>
      <button mat-button (click)="scrollToSection('contacto')">Contacto</button>
    </nav>

    <div class="nav-actions">
      <button mat-button class="hide-mobile nav-portal-btn" (click)="openPortalLogin()">
        Portal Clientes
      </button>
      <button type="button" class="btn-premium btn-premium-primary btn-premium-sm hide-mobile" (click)="agendarCita('navbar')">
        Agendar Cita
      </button>
      <button mat-icon-button class="mobile-menu-button mobile-visible" [matMenuTriggerFor]="mobileMenu" aria-label="Menú">
        <mat-icon>menu</mat-icon>
      </button>
      <mat-menu #mobileMenu="matMenu">
        <button mat-menu-item (click)="scrollToSection('inicio')">Inicio</button>
        <button mat-menu-item (click)="scrollToSection('servicios')">Servicios</button>
        <button mat-menu-item (click)="scrollToSection('nosotros')">Nosotros</button>
        <button mat-menu-item (click)="scrollToSection('contacto')">Contacto</button>
        <mat-divider></mat-divider>
        <button mat-menu-item (click)="openPortalLogin()">Portal Clientes</button>
        <button mat-menu-item (click)="agendarCita('navbar_mobile')">Agendar Cita</button>
      </mat-menu>
    </div>
  </div>
</mat-toolbar>

<!-- ===== HERO ===== -->
<section id="inicio" class="landing-hero">
  <div class="hero-grid">
    <div class="hero-copy">
      <div class="hero-meta-row">
        <span class="hero-eyebrow">Clínica veterinaria · Guadalupe, N.L.</span>
        <span class="hero-google-chip">
          <mat-icon>star</mat-icon>
          4.9 · Google
        </span>
      </div>
      <h1 class="hero-title">El cuidado médico que tu mascota merece, <span class="hero-accent">24/7</span></h1>
      <p class="hero-lead">
        Más de <strong>10 años</strong> cuidando perros y gatos en Guadalupe. Consultas, vacunas, cirugías,
        laboratorio y emergencias con un equipo que trata a tu mascota como familia.
      </p>
      <div class="hero-cta-row">
        <button type="button" class="btn-premium btn-premium-primary" (click)="agendarCita('hero')">
          <mat-icon>event_available</mat-icon>
          Agendar Cita en Línea
        </button>
        <a class="btn-premium btn-premium-secondary" [href]="whatsappFullUrl" target="_blank" rel="noopener noreferrer" (click)="trackWhatsApp('hero')">
          <mat-icon>chat</mat-icon>
          Hablar por WhatsApp
        </a>
      </div>
      <div class="hero-trust-badges" aria-label="Prueba social">
        <div class="trust-badge" *ngFor="let stat of stats">
          <div class="trust-badge-icon">
            <mat-icon>{{ stat.materialIcon }}</mat-icon>
          </div>
          <div>
            <span class="trust-num">{{ stat.numero }}</span>
            <span class="trust-label">{{ stat.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="hero-visual">
      <div class="hero-visual-glow" aria-hidden="true"></div>
      <div class="hero-visual-float">
        <img src="assets/pets-hero.svg" alt="Veterinaria cuidando mascotas con cariño" class="hero-visual-img" width="420" height="420">
        <div class="hero-visual-badge">
          <mat-icon>favorite</mat-icon>
          <span>Mascotas felices</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ===== SERVICIOS RÁPIDOS ===== -->
<section class="quick-services" aria-label="Servicios principales">
  <div class="container">
    <div class="quick-services-header">
      <span class="section-eyebrow">Atención integral</span>
      <p class="quick-services-lead">Todo lo que tu mascota necesita, en un solo lugar</p>
    </div>
    <div class="quick-services-grid">
      <button type="button" class="premium-card quick-service-item" *ngFor="let s of servicios | slice:0:6" (click)="scrollToSection('servicios')">
        <span class="premium-icon-wrap premium-icon-wrap-sm quick-service-icon">
          <mat-icon>{{ s.materialIcon }}</mat-icon>
        </span>
        <span class="quick-service-label">{{ s.titulo }}</span>
      </button>
    </div>
  </div>
</section>

<!-- ===== PORTAL DIGITAL (sin login embebido) ===== -->
<section id="portal-duenos" class="landing-portal" aria-labelledby="portal-duenos-title">
  <div class="container">
    <div class="portal-header">
      <span class="section-eyebrow">Portal clínico</span>
      <h2 id="portal-duenos-title">Tu expediente veterinario digital</h2>
      <p class="section-lead">
        Vacunas, citas, historial clínico y avisos de la clínica — la misma información que en la app Katzen,
        disponible cuando la necesites.
      </p>
    </div>

    <div class="portal-features-grid">
      <article class="premium-card portal-feature-card" *ngFor="let feat of portalFeatures">
        <div class="premium-icon-wrap portal-feature-icon">
          <mat-icon>{{ feat.icon }}</mat-icon>
        </div>
        <h3>{{ feat.title }}</h3>
        <p>{{ feat.description }}</p>
      </article>
    </div>

    <div class="premium-card portal-access-bar">
      <div class="portal-access-text">
        <div class="premium-icon-wrap premium-icon-wrap-sm">
          <mat-icon>smartphone</mat-icon>
        </div>
        <div>
          <strong>¿Ya eres cliente?</strong>
          <span>Consulta vacunas, citas e historial de tu mascota</span>
        </div>
      </div>
      <div class="portal-access-actions">
        <button type="button" class="btn-premium btn-premium-secondary btn-premium-sm" (click)="openPortalLogin()">
          <mat-icon>login</mat-icon>
          Acceder al portal
        </button>
        <a class="btn-premium-ghost" routerLink="/portal/login">Pantalla completa</a>
      </div>
    </div>
    <p class="portal-staff-line">¿Eres personal? <a routerLink="/admin/login">Acceso staff</a></p>
  </div>
</section>

<!-- ===== POR QUÉ ELEGIRNOS ===== -->
<section id="por-que-elegirnos" class="why-choose-us" aria-labelledby="why-title">
  <div class="container">
    <div class="section-header">
      <span class="section-eyebrow">Confianza y calidad</span>
      <h2 id="why-title" class="section-title">¿Por qué elegir KatzenVet?</h2>
      <p class="section-subtitle">Empatía, experiencia y tecnología al servicio de tu compañero de vida</p>
    </div>

    <div class="why-grid">
      <article class="premium-card why-card" *ngFor="let item of porQueElegirnos | slice:0:6">
        <div class="premium-icon-wrap why-icon-container">
          <mat-icon class="why-icon">{{ item.icon }}</mat-icon>
        </div>
        <h3 class="why-card-title">{{ item.titulo }}</h3>
        <p class="why-description">{{ item.descripcion }}</p>
        <div class="why-stats">
          <mat-icon class="stats-icon">check_circle</mat-icon>
          <span>{{ item.stats }}</span>
        </div>
      </article>
    </div>
  </div>
</section>

<!-- ===== SERVICIOS SECTION ===== -->
<section id="servicios" class="services landing-section" aria-labelledby="servicios-title">
  <div class="container">
    <div class="section-header">
      <span class="section-eyebrow">Nuestros servicios</span>
      <h2 id="servicios-title" class="section-title">Cuidado veterinario completo en Guadalupe</h2>
      <p class="section-subtitle">Consultas, vacunas, cirugías, laboratorio y emergencias 24 horas para perros y gatos.</p>
    </div>
    
    <div class="services-grid">
      <mat-card appearance="elevated" class="service-card" *ngFor="let servicio of servicios; let i = index">
        <div class="service-card-header">
          <div class="premium-icon-wrap premium-icon-wrap-sm service-icon">
            <mat-icon>{{servicio.materialIcon}}</mat-icon>
          </div>
          <h3 class="service-title">{{servicio.titulo}}</h3>
        </div>
        
        <p class="service-description">{{servicio.descripcion}}</p>
        
        <div class="service-details">
          <div class="service-price">
            <span class="price-amount">${{servicio.precio}}</span>
            <span class="price-duration">{{servicio.duracion}}</span>
          </div>
          
          <div class="service-features">
            <div class="feature-item" *ngFor="let feature of servicio.features">
              <mat-icon class="feature-icon">check_circle</mat-icon>
              <span>{{feature}}</span>
            </div>
          </div>
        </div>
        
        <button mat-stroked-button color="primary" class="service-cta" (click)="agendarCita('servicio_' + i)">
          <mat-icon>event</mat-icon>
          Agendar
        </button>
        
        <button mat-button class="service-toggle" (click)="toggleService(i)">
          <span *ngIf="!servicio.expanded">Ver más detalles</span>
          <span *ngIf="servicio.expanded">Ocultar detalles</span>
          <mat-icon>{{servicio.expanded ? 'expand_less' : 'expand_more'}}</mat-icon>
        </button>
        
        <div class="service-expanded" *ngIf="servicio.expanded">
          <mat-divider></mat-divider>
          <div class="expanded-content">
            <h4>Incluye:</h4>
            <ul class="includes-list">
              <li *ngFor="let item of servicio.incluye">{{item}}</li>
            </ul>
          </div>
        </div>
      </mat-card>
    </div>
  </div>
</section>

<!-- ===== TESTIMONIOS SECTION ===== -->
<section id="testimonios" class="testimonials" aria-labelledby="testimonios-title">
  <div class="container">
    <div class="section-header">
      <span class="section-eyebrow">Reseñas verificadas</span>
      <div class="google-badge">
        <mat-icon class="google-icon">star</mat-icon>
        <span class="rating-number">4.9</span>
        <span class="review-count">· 24 reseñas en Google</span>
      </div>
      <h2 id="testimonios-title" class="section-title">Lo que dicen nuestros clientes</h2>
      <p class="section-subtitle">Familias de Guadalupe que confían en nosotros para el cuidado de sus mascotas</p>
    </div>
    
    <div class="testimonials-grid">
      <mat-card class="testimonial-card" *ngFor="let testimonio of testimonios">
        <div class="testimonial-header">
          <img [src]="testimonio.avatar" [alt]="testimonio.nombre" class="testimonial-avatar" loading="lazy" decoding="async">
          <div class="testimonial-info">
            <h3 class="testimonial-name">{{testimonio.nombre}}</h3>
            <div class="testimonial-location">
              <mat-icon class="location-icon">location_on</mat-icon>
              <span>{{testimonio.ubicacion}}</span>
            </div>
          </div>
        </div>
        
        <div class="testimonial-rating">
          <mat-icon *ngFor="let star of [1,2,3,4,5]" class="rating-star">star</mat-icon>
          <span class="testimonial-date">{{testimonio.fecha}}</span>
        </div>
        
        <p class="testimonial-text">"{{testimonio.testimonio}}"</p>
        
        <div class="testimonial-footer">
          <mat-icon class="google-verified">verified</mat-icon>
          <span>Verificado en Google</span>
        </div>
      </mat-card>
    </div>
    
    <div class="testimonials-cta">
      <a href="https://maps.app.goo.gl/iT4227wUtcfGk1rTA" 
         target="_blank" 
         rel="noopener noreferrer"
         mat-flat-button
         color="primary">
        <mat-icon>rate_review</mat-icon>
        Ver reseñas en Google
      </a>
    </div>
  </div>
</section>

<!-- ===== FAQ SECTION ===== -->
<section id="faq" class="faq-section" aria-labelledby="faq-title">
  <div class="container">
    <div class="section-header">
      <span class="section-eyebrow">Dudas frecuentes</span>
      <h2 id="faq-title" class="section-title">Preguntas frecuentes</h2>
      <p class="section-subtitle">Resolvemos las dudas más comunes sobre nuestros servicios veterinarios</p>
    </div>
    
    <div class="faq-container">
      <mat-card class="faq-item" *ngFor="let faq of faqs; let i = index" 
                [class.expanded]="faq.expanded">
        <div class="faq-question" (click)="toggleFaq(i)">
          <div class="faq-question-content">
            <mat-icon class="faq-icon">{{faq.icon}}</mat-icon>
            <h3>{{faq.pregunta}}</h3>
          </div>
          <mat-icon class="faq-toggle-icon" [class.rotated]="faq.expanded">
            expand_more
          </mat-icon>
        </div>
        <div class="faq-answer" [@expandCollapse]="faq.expanded ? 'expanded' : 'collapsed'">
          <p>{{faq.respuesta}}</p>
        </div>
      </mat-card>
    </div>
    
    <div class="faq-footer">
      <p class="faq-footer-text">¿No encuentras tu respuesta?</p>
      <a [href]="whatsappFullUrl"
         target="_blank"
         rel="noopener noreferrer"
         mat-flat-button
         color="primary"
         (click)="trackWhatsApp('faq')">
        <mat-icon>chat</mat-icon>
        Contáctanos por WhatsApp
      </a>
    </div>
  </div>
</section>

<!-- ===== EQUIPO SECTION ===== -->
<section id="nosotros" class="team" aria-labelledby="equipo-title">
  <div class="container">
    <div class="section-header">
      <span class="section-eyebrow">Nuestro equipo</span>
      <h2 id="equipo-title" class="section-title">Veterinarios certificados en Guadalupe</h2>
      <p class="section-subtitle">Médicos con más de 10 años de experiencia en medicina general, cirugía y emergencias</p>
    </div>
    
    <div class="team-grid">
      <mat-card class="doctor-card" *ngFor="let doctor of equipoMedico" itemscope itemtype="https://schema.org/Person">
        <div class="doctor-image-container">
          <img [src]="doctor.imagen" [alt]="'Veterinaria ' + doctor.nombre + ' - ' + doctor.especialidad + ' en Guadalupe, N.L.'" class="doctor-image" loading="lazy" decoding="async" itemprop="image">
        </div>
        
        <div class="doctor-info">
          <h3 class="doctor-name">{{doctor.nombre}}</h3>
          <p class="doctor-specialty">{{doctor.especialidad}}</p>
          <p class="doctor-description">{{doctor.descripcion}}</p>
          
          <div class="doctor-credentials">
            <div class="credential-item">
              <mat-icon class="credential-icon">schedule</mat-icon>
              <span>{{doctor.experiencia}}</span>
            </div>
            <div class="credential-item" *ngFor="let cert of doctor.certificaciones">
              <mat-icon class="credential-icon">school</mat-icon>
              <span>{{cert}}</span>
            </div>
          </div>
        </div>
      </mat-card>
    </div>
  </div>
</section>

<!-- ===== UBICACIÓN/MAPA SECTION ===== -->
<section id="ubicacion" class="location-map" aria-labelledby="ubicacion-title">
  <div class="container">
    <div class="section-header">
      <span class="section-eyebrow">Visítanos</span>
      <h2 id="ubicacion-title" class="section-title">Nuestra ubicación</h2>
      <p class="section-subtitle">C. Zinc 318, Los Cristales — Guadalupe, N.L. · Estacionamiento gratuito</p>
    </div>
    
    <div class="location-content">
      <div class="location-info-card">
        <mat-card>
          <div class="location-details">
            <div class="location-detail-item">
              <mat-icon class="detail-icon">place</mat-icon>
              <div class="detail-content">
                <h3>Dirección</h3>
                <p>C. Zinc 318, Los Cristales 1er Sector<br>Guadalupe, Nuevo León, 67117</p>
              </div>
            </div>
            
            <mat-divider></mat-divider>
            
            <div class="location-detail-item">
              <mat-icon class="detail-icon">schedule</mat-icon>
              <div class="detail-content">
                <h3>Horarios de Atención</h3>
                <div class="horarios-list">
                  <div class="horario-item" *ngFor="let horario of horarios">
                    <span class="dia">{{horario.dia}}</span>
                    <span class="hora">{{horario.horario}}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <mat-divider></mat-divider>
            
            <div class="location-detail-item">
              <mat-icon class="detail-icon">phone</mat-icon>
              <div class="detail-content">
                <h3>Contacto</h3>
                <a href="tel:+528136024090" class="phone-link">81 3602 4090</a>
                <a href="https://wa.me/528136024090" target="_blank" rel="noopener noreferrer" class="whatsapp-link">
                  <mat-icon>chat</mat-icon>
                  WhatsApp
                </a>
              </div>
            </div>
            
            <mat-divider></mat-divider>
            
            <div class="location-detail-item">
              <mat-icon class="detail-icon">directions_car</mat-icon>
              <div class="detail-content">
                <h3>Estacionamiento</h3>
                <p>Estacionamiento gratuito disponible</p>
              </div>
            </div>
          </div>
          
          <div class="location-actions">
            <a href="https://maps.app.goo.gl/iT4227wUtcfGk1rTA" 
               target="_blank" 
               rel="noopener noreferrer"
               mat-flat-button 
               color="primary">
              <mat-icon>directions</mat-icon>
              Cómo llegar
            </a>
            
            <a href="https://wa.me/528136024090?text=Hola%2C%20quisiera%20agendar%20una%20cita"
               target="_blank"
               rel="noopener noreferrer"
               mat-stroked-button>
              <mat-icon>event</mat-icon>
              Agendar cita
            </a>
          </div>
        </mat-card>
      </div>
      
      <div class="map-container">
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3595.8234567890123!2d-100.258923!3d25.682458!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8662954321fedcba%3A0x1234567890abcdef!2sC.%20Zinc%20318%2C%20Los%20Cristales%201er%20Sector%2C%2067117%20Guadalupe%2C%20N.L.!5e0!3m2!1ses!2smx!4v1234567890123!5m2!1ses!2smx"
          width="100%" 
          height="100%" 
          style="border:0;" 
          allowfullscreen="" 
          loading="lazy" 
          referrerpolicy="no-referrer-when-downgrade"
          title="Ubicación de KatzenVet - Clínica Veterinaria en Guadalupe">
        </iframe>
      </div>
    </div>
  </div>
</section>

<!-- ===== CONTACTO SECTION ===== -->
<section id="contacto" class="contact" aria-labelledby="contacto-title">
  <div class="container">
    <mat-card appearance="filled" class="urgency-inline" *ngIf="showUrgencyBanner">
      <div class="urgency-content">
        <mat-icon class="urgency-icon">schedule</mat-icon>
        <div class="urgency-text">
          <strong>¡Solo quedan {{ citasDisponibles }} citas disponibles hoy!</strong>
          <span>Agenda antes de que se acaben</span>
        </div>
        <button mat-icon-button class="urgency-close" (click)="closeUrgencyBanner()" aria-label="Cerrar aviso">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </mat-card>

    <div class="section-header">
      <span class="section-eyebrow">Agenda tu cita</span>
      <h2 id="contacto-title" class="section-title">Contáctanos hoy</h2>
      <p class="section-subtitle">C. Zinc 318, Guadalupe · 81 3602 4090 · WhatsApp 24/7 · Lunes a sábado</p>
    </div>

    <!-- Redes de comunicación principales -->
    <div class="contact-redes-destacadas">
      <p class="contact-redes-titulo">Respuesta rápida por WhatsApp o Facebook</p>
      <div class="contact-redes-buttons">
        <a mat-flat-button color="primary" [href]="whatsappFullUrl" target="_blank" rel="noopener noreferrer" (click)="trackWhatsApp('contacto')">
          <mat-icon>chat</mat-icon>
          Escribir por WhatsApp
        </a>
        <a mat-stroked-button [href]="facebookUrl" target="_blank" rel="noopener noreferrer" (click)="trackFacebook('contacto')">
          <mat-icon>facebook</mat-icon>
          Visitar Facebook
        </a>
      </div>
    </div>
    
    <div class="contact-content">
      <div class="contact-info">
        <h3 class="contact-info-title">Información de Contacto</h3>
        
        <div class="contact-items">
          <div class="contact-item" *ngFor="let info of contactInfo">
            <div class="contact-icon">
              <mat-icon>{{info.icon}}</mat-icon>
            </div>
            
            <div class="contact-details">
              <h4 class="contact-item-title">{{info.title}}</h4>
              <p class="contact-item-content">{{info.content}}</p>
              
              <a *ngIf="info.link" [href]="info.link" class="contact-link" target="_blank">
                {{info.linkText}}
              </a>
            </div>
          </div>
        </div>
        
        <div class="schedule-info">
          <h4>Horarios de Atención</h4>
          <div class="schedule-list">
            <div class="schedule-item" *ngFor="let horario of horarios">
              <span class="schedule-day">{{horario.dia}}</span>
              <span class="schedule-time">{{horario.horario}}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="contact-form-container">
        <mat-card class="contact-form-card">
          <h3 class="form-title">Envíanos un Mensaje</h3>
          
          <form [formGroup]="contactForm" (ngSubmit)="onSubmitContacto()" class="contact-form">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Nombre completo</mat-label>
              <input matInput formControlName="nombre" placeholder="Tu nombre">
              <mat-error *ngIf="contactForm.get('nombre')?.hasError('required')">
                El nombre es requerido
              </mat-error>
              <mat-error *ngIf="contactForm.get('nombre')?.hasError('minlength')">
                Mínimo 2 caracteres
              </mat-error>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" placeholder="tu@email.com">
              <mat-error *ngIf="contactForm.get('email')?.hasError('required')">
                El email es requerido
              </mat-error>
              <mat-error *ngIf="contactForm.get('email')?.hasError('email')">
                Ingresa un email válido
              </mat-error>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Teléfono</mat-label>
              <input matInput formControlName="telefono" placeholder="+52 81 1234 5678">
              <mat-error *ngIf="contactForm.get('telefono')?.hasError('required')">
                El teléfono es requerido
              </mat-error>
              <mat-error *ngIf="contactForm.get('telefono')?.hasError('pattern')">
                Formato de teléfono inválido
              </mat-error>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Nombre de tu mascota</mat-label>
              <input matInput formControlName="mascota" placeholder="Nombre de tu mascota">
              <mat-error *ngIf="contactForm.get('mascota')?.hasError('required')">
                El nombre de la mascota es requerido
              </mat-error>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Mensaje</mat-label>
              <textarea matInput formControlName="mensaje" rows="4" placeholder="Cuéntanos sobre tu mascota y cómo podemos ayudarte..."></textarea>
              <mat-error *ngIf="contactForm.get('mensaje')?.hasError('required')">
                El mensaje es requerido
              </mat-error>
              <mat-error *ngIf="contactForm.get('mensaje')?.hasError('minlength')">
                Mínimo 10 caracteres
              </mat-error>
            </mat-form-field>
            
            <button mat-flat-button color="primary" type="submit" class="full-width" [disabled]="isSubmitting">
              <mat-icon *ngIf="!isSubmitting">send</mat-icon>
              <mat-icon *ngIf="isSubmitting" class="loading-icon">hourglass_empty</mat-icon>
              <span>{{isSubmitting ? 'Enviando…' : 'Enviar mensaje'}}</span>
            </button>
          </form>
        </mat-card>
      </div>
    </div>
  </div>
</section>

<!-- FAB WhatsApp (único, sin solapamiento) -->
<a mat-fab color="primary" class="float-whatsapp-fab"
   [href]="whatsappFullUrl" target="_blank" rel="noopener noreferrer"
   (click)="trackWhatsApp('floating')" aria-label="Contactar por WhatsApp">
  <mat-icon>chat</mat-icon>
</a>

<!-- Modal login portal -->
<div class="portal-modal-backdrop" *ngIf="showPortalLoginModal" (click)="closePortalLogin()" role="presentation">
  <mat-card appearance="elevated" class="portal-modal" (click)="$event.stopPropagation()" role="dialog" aria-labelledby="portal-modal-title" aria-modal="true">
    <div class="portal-modal-header">
      <div>
        <h2 id="portal-modal-title">Portal de clientes</h2>
        <p>Ingresa con el correo registrado en la clínica</p>
      </div>
      <button mat-icon-button (click)="closePortalLogin()" aria-label="Cerrar">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    <mat-divider></mat-divider>
    <div class="portal-modal-body">
      <form (ngSubmit)="loginPortal()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Correo electrónico</mat-label>
          <input matInput type="email" [(ngModel)]="portalEmail" name="portalEmail" required autocomplete="email">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Contraseña</mat-label>
          <input matInput type="password" [(ngModel)]="portalPassword" name="portalPassword" required autocomplete="current-password">
        </mat-form-field>
        <button mat-flat-button color="primary" type="submit" class="full-width" [disabled]="portalLoading">
          {{ portalLoading ? 'Verificando…' : 'Entrar al portal' }}
        </button>
      </form>
    </div>
    <mat-divider></mat-divider>
    <div class="portal-modal-footer">
      <a mat-button routerLink="/portal/login" (click)="closePortalLogin()">Abrir pantalla completa</a>
    </div>
  </mat-card>
</div>

<!-- ===== CTA CONVERSIÓN ===== -->
<section class="conversion-band" aria-label="Agendar cita">
  <div class="container conversion-band-inner">
    <div class="conversion-band-copy">
      <h2>¿Tu mascota necesita atención?</h2>
      <p>Agenda hoy. Te respondemos en minutos por WhatsApp o en nuestro formulario.</p>
    </div>
    <div class="conversion-band-actions">
      <button mat-flat-button class="conversion-btn-light" (click)="agendarCita('band')">
        <mat-icon>event_available</mat-icon>
        Agendar cita
      </button>
      <a mat-stroked-button class="conversion-btn-outline" [href]="whatsappFullUrl" target="_blank" rel="noopener noreferrer" (click)="trackWhatsApp('band')">
        <mat-icon>chat</mat-icon>
        WhatsApp
      </a>
    </div>
  </div>
</section>

<!-- ===== FOOTER ===== -->
<footer class="footer">
  <div class="container">
    <div class="footer-content">
      <div class="footer-brand">
        <div class="footer-logo">
          <mat-icon>pets</mat-icon>
          <span>Katzen</span>
        </div>
        <p class="footer-description">
          Clínica veterinaria comprometida con la excelencia en el cuidado de mascotas desde 2015.
        </p>
      </div>
      
      <div class="footer-links">
        <div class="footer-section">
          <h4>Servicios</h4>
          <ul>
            <li><a (click)="scrollToSection('servicios')">Consultas Generales</a></li>
            <li><a (click)="scrollToSection('servicios')">Vacunas</a></li>
            <li><a (click)="scrollToSection('servicios')">Cirugías</a></li>
            <li><a (click)="scrollToSection('servicios')">Emergencias</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4>Equipo</h4>
          <ul>
            <li><a (click)="scrollToSection('nosotros')">Dra. Ana María</a></li>
            <li><a (click)="scrollToSection('nosotros')">Dra. Carmen Elena</a></li>
            <li><a (click)="scrollToSection('nosotros')">Dra. Laura Patricia</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4>Contacto</h4>
          <ul>
            <li><a (click)="scrollToSection('contacto')">Agendar Cita</a></li>
            <li><a href="tel:+528136024090">+52 81 3602 4090</a></li>
            <li><a href="https://wa.me/528136024090">WhatsApp</a></li>
            <li><a href="mailto:info&#64;katzenvet.com">info&#64;katzenvet.com</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4>Legal</h4>
          <ul>
            <li><a routerLink="/privacidad">Aviso de Privacidad</a></li>
            <li><a href="#">Términos y Condiciones</a></li>
            <li><a href="#">Política de Cookies</a></li>
          </ul>
        </div>
      </div>
    </div>
    
    <mat-divider class="footer-divider"></mat-divider>
    
    <!-- Redes de contacto destacadas -->
    <div class="footer-contact-cta">
      <p class="footer-contact-title">Comunícate con nosotros</p>
      <div class="footer-contact-buttons">
        <a mat-stroked-button [href]="whatsappFullUrl" target="_blank" rel="noopener noreferrer" (click)="trackWhatsApp('footer')">
          <mat-icon>chat</mat-icon>
          WhatsApp
        </a>
        <a mat-stroked-button [href]="facebookUrl" target="_blank" rel="noopener noreferrer" (click)="trackFacebook('footer')">
          <mat-icon>facebook</mat-icon>
          Facebook
        </a>
      </div>
    </div>
    <mat-divider class="footer-divider"></mat-divider>
    <div class="footer-bottom">
      <p>&copy; 2025 KatzenVet. Todos los derechos reservados.</p>
      <div class="footer-social">
        <a [href]="facebookUrl" target="_blank" rel="noopener noreferrer" class="social-link" (click)="trackFacebook('footer_social')" aria-label="Facebook">
          <mat-icon>facebook</mat-icon>
        </a>
        <a [href]="whatsappFullUrl" target="_blank" rel="noopener noreferrer" class="social-link" (click)="trackWhatsApp('footer_social')" aria-label="WhatsApp">
          <mat-icon>chat</mat-icon>
        </a>
      </div>
    </div>
  </div>
</footer>
```

## landing.component.css
```css
/* KatzenVet Landing — Premium SaaS aesthetic (Tailwind-equivalent tokens) */
:host {
  --premium-bg: #f8fafc;
  --premium-surface: #ffffff;
  --premium-teal-50: #f0fdfa;
  --premium-emerald-50: #ecfdf5;
  --premium-teal-700: #0f766e;
  --premium-teal-800: #115e59;
  --premium-teal-600: #0d9488;
  --premium-text: #0f172a;
  --premium-muted: #64748b;
  --premium-shadow: 0 8px 30px rgb(0 0 0 / 0.04);
  --premium-shadow-md: 0 12px 40px rgb(0 0 0 / 0.06);
  --premium-shadow-teal: 0 10px 25px -5px rgb(15 118 110 / 0.2);
  --premium-radius-xl: 24px;
  --premium-radius-lg: 16px;
  --premium-radius-md: 12px;

  display: block;
  background: var(--premium-bg);
  color: var(--premium-text);
  font-family: 'Poppins', ui-sans-serif, system-ui, sans-serif;
  padding-bottom: 96px;
  scroll-padding-top: 72px;
  -webkit-font-smoothing: antialiased;
}

/* ===== PREMIUM PRIMITIVES ===== */
.premium-card {
  background: var(--premium-surface);
  border: none;
  border-radius: var(--premium-radius-xl);
  box-shadow: var(--premium-shadow);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.premium-card:hover {
  box-shadow: var(--premium-shadow-md);
}

.premium-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: var(--premium-radius-lg);
  background: linear-gradient(to bottom right, var(--premium-teal-50), rgb(236 253 245 / 0.5));
  color: var(--premium-teal-700);
}

.premium-icon-wrap mat-icon,
.premium-icon-wrap .why-icon {
  font-size: 26px;
  width: 26px;
  height: 26px;
  color: var(--premium-teal-700) !important;
}

.premium-icon-wrap-sm {
  width: 48px;
  height: 48px;
  border-radius: var(--premium-radius-md);
}

.premium-icon-wrap-sm mat-icon {
  font-size: 22px;
  width: 22px;
  height: 22px;
}

.btn-premium {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 28px;
  border: none;
  border-radius: 9999px;
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-premium mat-icon {
  font-size: 20px;
  width: 20px;
  height: 20px;
}

.btn-premium-primary {
  background: var(--premium-teal-700);
  color: #fff;
  box-shadow: var(--premium-shadow-teal);
}

.btn-premium-primary:hover {
  background: var(--premium-teal-800);
  box-shadow: 0 14px 32px -6px rgb(15 118 110 / 0.35);
  transform: translateY(-1px);
}

.btn-premium-secondary {
  background: var(--premium-surface);
  color: var(--premium-teal-700);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.04), var(--premium-shadow);
}

.btn-premium-secondary:hover {
  box-shadow: var(--premium-shadow-md);
  transform: translateY(-1px);
  color: var(--premium-teal-800);
}

.btn-premium-sm {
  padding: 10px 20px;
  font-size: 0.875rem;
}

.btn-premium-ghost {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--premium-muted);
  text-decoration: none;
  transition: color 0.2s;
}

.btn-premium-ghost:hover {
  color: var(--premium-teal-700);
}

/* Material cards inside landing — borderless premium */
:host ::ng-deep .mat-mdc-card {
  border: none !important;
  box-shadow: var(--premium-shadow) !important;
  border-radius: var(--premium-radius-xl) !important;
  background: var(--premium-surface) !important;
}

:host ::ng-deep .mat-mdc-outlined-card {
  --mdc-outlined-card-outline-width: 0;
}

.container {
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 24px;
}

.full-width {
  width: 100%;
}

.section-eyebrow,
.hero-eyebrow {
  display: inline-block;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--premium-teal-600);
  margin-bottom: 16px;
}

.section-lead,
.hero-lead {
  margin: 0;
  color: var(--premium-muted);
  line-height: 1.75;
  font-size: 1.0625rem;
  max-width: 34rem;
}

.landing-section {
  padding: 96px 0;
}

.section-header {
  text-align: center;
  margin-bottom: 64px;
  max-width: 680px;
  margin-left: auto;
  margin-right: auto;
}

.section-title {
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  font-weight: 700;
  margin: 0 0 16px;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: var(--premium-text);
}

.section-subtitle {
  margin: 0;
  color: var(--premium-muted);
  line-height: 1.7;
  font-size: 1.0625rem;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes floatSoft {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.hero-copy { animation: fadeUp 0.7s ease-out both; }
.hero-visual { animation: fadeUp 0.7s ease-out 0.15s both; }

/* ===== NAVBAR ===== */
.landing-toolbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1100;
  background: rgb(255 255 255 / 0.8) !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  color: var(--premium-text) !important;
  border-bottom: none !important;
  box-shadow: 0 1px 0 rgb(0 0 0 / 0.04);
  min-height: 72px;
  padding: 0 16px;
  transition: box-shadow 0.3s ease, background 0.3s ease;
}

.landing-toolbar.scrolled {
  background: rgb(255 255 255 / 0.95) !important;
  box-shadow: var(--premium-shadow);
}

.toolbar-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 1140px;
  margin: 0 auto;
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: 32px;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  border: none;
  background: none;
  padding: 0;
}

.brand-name {
  font-weight: 700;
  font-size: 1.125rem;
  letter-spacing: -0.03em;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

:host ::ng-deep .nav-links .mat-mdc-button {
  color: var(--premium-muted) !important;
  font-weight: 500 !important;
  border-radius: 9999px !important;
}

:host ::ng-deep .nav-links .mat-mdc-button:hover {
  color: var(--premium-teal-700) !important;
  background: var(--premium-teal-50) !important;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-portal-btn {
  color: var(--premium-muted) !important;
  font-weight: 500 !important;
}

.mobile-menu-button { margin-left: auto; }
.mobile-hidden { display: flex; }
.mobile-visible { display: none !important; }

@media (max-width: 960px) {
  .mobile-hidden { display: none !important; }
  .mobile-visible { display: inline-flex !important; }
  .nav-actions .hide-mobile { display: none; }
}

/* ===== HERO ===== */
.landing-hero {
  padding: 128px 24px 80px;
  background:
    radial-gradient(ellipse 70% 50% at 90% 0%, rgb(204 251 241 / 0.35), transparent 60%),
    radial-gradient(ellipse 50% 40% at 0% 100%, rgb(236 253 245 / 0.4), transparent 55%),
    var(--premium-bg);
  overflow: visible;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 64px;
  align-items: center;
  max-width: 1140px;
  margin: 0 auto;
}

.hero-meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.hero-google-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 9999px;
  background: var(--premium-surface);
  box-shadow: var(--premium-shadow);
  border: none;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--premium-text);
}

.hero-google-chip mat-icon {
  font-size: 14px;
  width: 14px;
  height: 14px;
  color: #eab308;
}

.hero-title {
  margin: 0 0 28px;
  font-size: clamp(2.25rem, 5.5vw, 3.25rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.04em;
  color: var(--premium-text);
  max-width: 13ch;
}

.hero-accent {
  color: var(--premium-teal-700);
  white-space: nowrap;
}

.hero-cta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin: 40px 0 48px;
}

.hero-trust-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.trust-badge {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border-radius: var(--premium-radius-lg);
  background: var(--premium-surface);
  box-shadow: var(--premium-shadow);
  border: none;
  min-width: 150px;
  flex: 1 1 150px;
  max-width: 210px;
  transition: box-shadow 0.3s ease;
}

.trust-badge:hover {
  box-shadow: var(--premium-shadow-md);
}

.trust-badge-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--premium-radius-md);
  background: linear-gradient(to bottom right, var(--premium-teal-50), rgb(236 253 245 / 0.5));
  color: var(--premium-teal-700);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.trust-badge-icon mat-icon {
  font-size: 22px;
  color: var(--premium-teal-700);
}

.trust-num {
  display: block;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--premium-text);
}

.trust-label {
  display: block;
  font-size: 0.6875rem;
  color: var(--premium-muted);
  line-height: 1.4;
  margin-top: 2px;
}

.hero-visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 460px;
  padding: 24px;
}

.hero-visual-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 40% 40%, rgb(204 251 241 / 0.5), transparent 65%);
  filter: blur(48px);
  pointer-events: none;
}

.hero-visual-float {
  position: relative;
  z-index: 1;
  padding: 32px;
  border-radius: 50%;
  background: linear-gradient(to top right, rgb(204 251 241 / 0.35), transparent 60%);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  animation: floatSoft 6s ease-in-out infinite;
}

.hero-visual-img {
  display: block;
  width: min(100%, 380px);
  height: auto;
  filter: drop-shadow(0 32px 64px rgb(15 118 110 / 0.12));
}

.hero-visual-badge {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 9999px;
  background: rgb(255 255 255 / 0.9);
  backdrop-filter: blur(12px);
  box-shadow: var(--premium-shadow-md);
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
}

.hero-visual-badge mat-icon {
  color: var(--premium-teal-700);
  font-size: 18px;
}

@media (max-width: 900px) {
  .landing-hero { padding: 112px 20px 64px; }
  .hero-grid { grid-template-columns: 1fr; gap: 48px; }
  .hero-title { max-width: none; line-height: 1.08; }
  .hero-visual { min-height: 340px; order: -1; }
  .trust-badge { max-width: none; flex: 1 1 calc(50% - 8px); }
}

/* ===== SERVICIOS RÁPIDOS ===== */
.quick-services {
  padding: 0 0 96px;
  margin-top: -16px;
}

.quick-services-header {
  text-align: center;
  margin-bottom: 32px;
}

.quick-services-lead {
  margin: 0;
  color: var(--premium-muted);
  font-size: 1rem;
}

.quick-services-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}

.quick-service-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 28px 16px;
  cursor: pointer;
  text-align: center;
  font-family: inherit;
  color: inherit;
}

.quick-service-item:hover {
  transform: translateY(-4px);
}

.quick-service-label {
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--premium-text);
}

@media (max-width: 960px) {
  .quick-services-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 520px) {
  .quick-services-grid { grid-template-columns: repeat(2, 1fr); }
}

/* ===== PORTAL DIGITAL ===== */
.landing-portal {
  padding: 96px 0;
  background: var(--premium-bg);
}

.portal-header {
  text-align: center;
  max-width: 640px;
  margin: 0 auto 56px;
}

.portal-header h2 {
  margin: 0 0 16px;
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.15;
}

.portal-header .section-lead {
  margin: 0 auto;
}

.portal-features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.portal-feature-card {
  padding: 36px 28px;
  text-align: center;
}

.portal-feature-card h3 {
  margin: 20px 0 10px;
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--premium-text);
}

.portal-feature-card p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--premium-muted);
  line-height: 1.6;
}

.portal-feature-icon {
  margin: 0 auto;
}

.portal-access-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 32px;
  margin-top: 8px;
}

.portal-access-text {
  display: flex;
  align-items: center;
  gap: 16px;
}

.portal-access-text strong {
  display: block;
  font-size: 1rem;
  margin-bottom: 4px;
  color: var(--premium-text);
}

.portal-access-text span {
  font-size: 0.875rem;
  color: var(--premium-muted);
}

.portal-access-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.portal-staff-line {
  text-align: center;
  margin: 20px 0 0;
  font-size: 0.8125rem;
  color: var(--premium-muted);
}

.portal-staff-line a {
  color: var(--premium-teal-700);
  font-weight: 500;
  text-decoration: none;
}

@media (max-width: 960px) {
  .portal-features-grid { grid-template-columns: repeat(2, 1fr); }
  .portal-access-bar {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
    padding: 24px;
  }
  .portal-access-text { flex-direction: column; }
  .portal-access-actions { justify-content: center; flex-wrap: wrap; }
}

@media (max-width: 520px) {
  .portal-features-grid { grid-template-columns: 1fr; }
}

/* ===== MODAL LOGIN ===== */
.portal-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgb(15 23 42 / 0.4);
  backdrop-filter: blur(8px);
}

.portal-modal {
  width: 100%;
  max-width: 420px;
  border-radius: var(--premium-radius-xl) !important;
  overflow: hidden;
  box-shadow: var(--premium-shadow-md) !important;
  border: none !important;
}

.portal-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 24px 16px;
}

.portal-modal-header h2 {
  margin: 0 0 4px;
  font-size: 1.25rem;
  font-weight: 600;
}

.portal-modal-header p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--md-sys-color-on-surface-variant);
}

.portal-modal-body {
  padding: 16px 24px 8px;
}

.portal-modal-footer {
  padding: 8px 16px 16px;
  text-align: center;
}

/* ===== FAB WHATSAPP ===== */
.float-whatsapp-fab {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 1050;
  background: var(--premium-teal-700) !important;
  box-shadow: var(--premium-shadow-teal) !important;
  transition: transform 0.3s ease, box-shadow 0.3s ease !important;
}

.float-whatsapp-fab:hover {
  transform: scale(1.05);
  box-shadow: 0 14px 32px -6px rgb(15 118 110 / 0.4) !important;
}

/* ===== URGENCIA INLINE (contacto) ===== */
.urgency-inline {
  margin-bottom: 32px;
  border-radius: var(--md-sys-shape-corner-medium) !important;
  background: var(--md-sys-color-tertiary-container) !important;
  color: var(--md-sys-color-on-tertiary-container);
}

.urgency-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 8px;
}

.urgency-icon {
  flex-shrink: 0;
}

.urgency-text strong {
  display: block;
  font-size: 0.9rem;
}

.urgency-text span {
  font-size: 0.8rem;
  opacity: 0.9;
}

.urgency-close {
  margin-left: auto;
}

/* ===== SECTIONS (servicios, equipo, etc.) ===== */
.why-choose-us,
.services,
.team,
.testimonials,
.contact,
.faq-section,
.location-map {
  padding: 96px 0;
}

.why-choose-us,
.services,
.team,
.testimonials,
.contact,
.faq-section,
.location-map {
  padding: 96px 0;
}

.why-choose-us {
  background: var(--premium-surface);
}

.why-grid,
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

@media (min-width: 1024px) {
  .why-grid { grid-template-columns: repeat(3, 1fr); }
}

.why-card {
  padding: 36px 32px;
  height: 100%;
}

.why-card:hover { transform: translateY(-4px); }

.why-icon-container {
  margin-bottom: 20px;
  width: auto;
  height: auto;
  background: none !important;
}

.why-card-title {
  margin: 0 0 10px;
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--premium-text);
}

.why-description {
  color: var(--premium-muted);
}

.why-stats {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--premium-teal-700);
}

.services {
  background: var(--premium-bg);
}

.service-card {
  padding: 32px !important;
  border: none !important;
}

.service-card:hover { transform: translateY(-4px); }

.service-cta {
  width: 100%;
  margin: 16px 0 8px;
}

:host ::ng-deep .service-cta.mat-mdc-outlined-button {
  border: none !important;
  background: var(--premium-surface) !important;
  box-shadow: var(--premium-shadow) !important;
  border-radius: 9999px !important;
  color: var(--premium-teal-700) !important;
  font-weight: 600 !important;
}

.service-icon {
  margin-bottom: 0;
  flex-shrink: 0;
}

/* ===== CTA CONVERSIÓN ===== */
.conversion-band {
  padding: 80px 24px;
  background: linear-gradient(135deg, var(--premium-teal-700), var(--premium-teal-800));
  color: #fff;
}

.conversion-band-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
  flex-wrap: wrap;
}

.conversion-band-actions {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .conversion-band-inner {
    flex-direction: column;
    text-align: center;
  }
  .conversion-band-actions {
    justify-content: center;
    width: 100%;
  }
}

.conversion-band-copy h2 {
  margin: 0 0 12px;
  font-size: clamp(1.625rem, 3vw, 2.125rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.15;
}

.conversion-band-copy p {
  margin: 0;
  opacity: 0.92;
  font-size: 1.0625rem;
}

.conversion-btn-light {
  background: #fff !important;
  color: var(--premium-teal-700) !important;
  font-weight: 600 !important;
  border-radius: 9999px !important;
  box-shadow: var(--premium-shadow) !important;
}

.conversion-btn-outline {
  border: none !important;
  background: rgb(255 255 255 / 0.12) !important;
  color: #fff !important;
  border-radius: 9999px !important;
}

/* ===== FOOTER ===== */
.footer {
  background: var(--premium-surface);
  color: var(--premium-text);
  padding: 64px 0 32px;
  box-shadow: 0 -1px 0 rgb(0 0 0 / 0.04);
}

.footer-content {
  display: grid;
  grid-template-columns: 1.2fr 2fr;
  gap: 32px;
  margin-bottom: 24px;
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 24px;
}

.footer-section h4 {
  margin: 0 0 12px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--md-sys-color-on-surface-variant);
}

.footer-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-section a {
  color: var(--md-sys-color-on-surface-variant);
  text-decoration: none;
  font-size: 0.9rem;
  cursor: pointer;
}

.footer-section a:hover {
  color: var(--md-sys-color-primary);
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.85rem;
  color: var(--md-sys-color-on-surface-variant);
}

.footer-contact-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.why-stats {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--md-sys-color-primary);
}

.why-title {
  margin: 0 0 8px;
  font-size: 1.05rem;
  font-weight: 600;
}

/* legacy alias */
.why-card-title {
  margin: 0 0 8px;
  font-size: 1.05rem;
  font-weight: 600;
}

.why-description {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  line-height: 1.5;
  font-size: 0.9rem;
}

.service-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.service-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
}

.service-description {
  margin: 0 0 16px;
  color: var(--md-sys-color-on-surface-variant);
  line-height: 1.5;
  font-size: 0.9rem;
}

.service-price {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
}

.price-amount {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--md-sys-color-primary);
}

.price-duration {
  font-size: 0.85rem;
  color: var(--md-sys-color-on-surface-variant);
}

.service-features {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--md-sys-color-on-surface-variant);
}

.feature-icon {
  font-size: 18px;
  width: 18px;
  height: 18px;
  color: var(--md-sys-color-primary);
}

.service-toggle {
  width: 100%;
  justify-content: space-between;
}

.expanded-content h4 {
  margin: 16px 0 8px;
  font-size: 0.9rem;
}

.includes-list {
  margin: 0;
  padding-left: 20px;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 0.9rem;
}

/* ===== TESTIMONIOS ===== */
.testimonials {
  background: var(--md-sys-color-surface-container-low);
}

.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.testimonial-card {
  border-radius: var(--md-sys-shape-corner-large) !important;
  padding: 8px;
}

.testimonial-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.testimonial-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--md-sys-shape-corner-full);
  object-fit: cover;
}

.testimonial-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.testimonial-location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: var(--md-sys-color-on-surface-variant);
}

.location-icon {
  font-size: 16px;
  width: 16px;
  height: 16px;
}

.testimonial-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.rating-star {
  font-size: 18px;
  width: 18px;
  height: 18px;
  color: #f9a825;
}

.testimonial-date {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--md-sys-color-on-surface-variant);
}

.testimonial-text {
  margin: 0 0 12px;
  line-height: 1.6;
  font-size: 0.9rem;
  color: var(--md-sys-color-on-surface-variant);
}

.testimonial-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--md-sys-color-primary);
}

.google-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  margin-bottom: 16px;
  border-radius: var(--md-sys-shape-corner-full);
  background: var(--md-sys-color-surface-container-highest);
}

.google-icon {
  color: #f9a825;
}

.rating-number {
  font-weight: 700;
  font-size: 1.1rem;
}

.star-icon {
  font-size: 18px;
  width: 18px;
  height: 18px;
  color: #f9a825;
}

.review-count {
  font-size: 0.85rem;
  color: var(--md-sys-color-on-surface-variant);
}

.testimonials-cta {
  text-align: center;
  margin-top: 32px;
}

/* ===== FAQ ===== */
.faq-section {
  background: var(--md-sys-color-surface);
}

.faq-header-icon {
  font-size: 40px;
  width: 40px;
  height: 40px;
  color: var(--md-sys-color-primary);
  margin-bottom: 8px;
}

.faq-container {
  max-width: 720px;
  margin: 0 auto;
}

.faq-item {
  border-radius: var(--md-sys-shape-corner-medium) !important;
  overflow: hidden;
  margin-bottom: 8px !important;
}

.faq-question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  cursor: pointer;
}

.faq-question-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.faq-question-content h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
}

.faq-icon {
  color: var(--md-sys-color-primary);
}

.faq-toggle-icon {
  transition: transform 0.2s;
}

.faq-toggle-icon.rotated {
  transform: rotate(180deg);
}

.faq-answer {
  padding: 0 16px 16px 52px;
}

.faq-answer p {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  line-height: 1.6;
}

.faq-footer {
  text-align: center;
  margin-top: 32px;
}

.faq-footer-text {
  margin: 0 0 16px;
  color: var(--md-sys-color-on-surface-variant);
}

/* ===== EQUIPO ===== */
.team {
  padding: 64px 0;
  background: var(--md-sys-color-surface-container-lowest);
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.doctor-card {
  border-radius: var(--md-sys-shape-corner-large) !important;
  overflow: hidden;
}

.doctor-image {
  width: 100%;
  height: 220px;
  object-fit: cover;
}

.doctor-info {
  padding: 16px;
}

.doctor-name {
  margin: 0 0 4px;
  font-size: 1.1rem;
  font-weight: 600;
}

.doctor-specialty {
  margin: 0 0 8px;
  color: var(--md-sys-color-primary);
  font-weight: 500;
  font-size: 0.9rem;
}

.doctor-description {
  margin: 0 0 12px;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 0.9rem;
  line-height: 1.5;
}

.credential-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--md-sys-color-on-surface-variant);
  margin-bottom: 4px;
}

.credential-icon {
  font-size: 18px;
  width: 18px;
  height: 18px;
  color: var(--md-sys-color-primary);
}

/* ===== UBICACIÓN ===== */
.location-map {
  padding: 64px 0;
  background: var(--md-sys-color-surface);
}

.location-header-icon {
  font-size: 40px;
  width: 40px;
  height: 40px;
  color: var(--md-sys-color-primary);
  margin-bottom: 8px;
}

.location-content {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 24px;
  align-items: stretch;
}

.location-info-card mat-card {
  border-radius: var(--md-sys-shape-corner-large) !important;
  padding: 8px;
}

.location-detail-item {
  display: flex;
  gap: 12px;
  padding: 16px 8px;
}

.detail-icon {
  color: var(--md-sys-color-primary);
}

.detail-content h3 {
  margin: 0 0 4px;
  font-size: 0.95rem;
  font-weight: 600;
}

.detail-content p {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 0.9rem;
  line-height: 1.5;
}

.horarios-list,
.horario-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.horario-item {
  flex-direction: row;
  justify-content: space-between;
  font-size: 0.85rem;
}

.dia {
  font-weight: 500;
}

.hora {
  color: var(--md-sys-color-on-surface-variant);
}

.phone-link,
.whatsapp-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--md-sys-color-primary);
  text-decoration: none;
  font-weight: 500;
}

.location-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px 8px 16px;
}

.map-container {
  border-radius: var(--md-sys-shape-corner-large);
  overflow: hidden;
  min-height: 400px;
  border: 1px solid var(--md-sys-color-outline-variant);
}

@media (max-width: 900px) {
  .location-content {
    grid-template-columns: 1fr;
  }
}

/* ===== CONTACTO ===== */
.contact {
  padding: 64px 0;
  background: var(--md-sys-color-surface-container-low);
}

.contact-redes-destacadas {
  text-align: center;
  margin-bottom: 32px;
}

.contact-redes-titulo {
  margin: 0 0 16px;
  color: var(--md-sys-color-on-surface-variant);
}

.contact-redes-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.contact-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

.contact-info-title,
.form-title {
  margin: 0 0 20px;
  font-size: 1.25rem;
  font-weight: 600;
}

.contact-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.contact-item {
  display: flex;
  gap: 12px;
}

.contact-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--md-sys-shape-corner-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
}

.contact-item-title {
  margin: 0 0 4px;
  font-size: 0.95rem;
  font-weight: 600;
}

.contact-item-content {
  margin: 0;
  font-size: 0.9rem;
  color: var(--md-sys-color-on-surface-variant);
}

.contact-link {
  color: var(--md-sys-color-primary);
  font-size: 0.85rem;
}

.schedule-info h4 {
  margin: 0 0 12px;
  font-size: 1rem;
  font-weight: 600;
}

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.schedule-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.schedule-day {
  font-weight: 500;
}

.schedule-time {
  color: var(--md-sys-color-on-surface-variant);
}

.contact-form-card {
  border-radius: var(--md-sys-shape-corner-extra-large) !important;
  padding: 24px !important;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-field {
  width: 100%;
}

@media (max-width: 900px) {
  .contact-content {
    grid-template-columns: 1fr;
  }
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 1.15rem;
  margin-bottom: 8px;
}

.footer-logo mat-icon {
  color: var(--md-sys-color-primary);
}

.footer-description {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 0.9rem;
  line-height: 1.5;
}

.footer-contact-cta {
  text-align: center;
  padding: 24px 0;
}

.footer-contact-title {
  margin: 0 0 12px;
  color: var(--md-sys-color-on-surface-variant);
}

.footer-social {
  display: flex;
  gap: 8px;
}

.social-link {
  color: var(--md-sys-color-on-surface-variant);
  text-decoration: none;
  display: inline-flex;
}

.social-link:hover {
  color: var(--md-sys-color-primary);
}

.footer-divider {
  margin: 16px 0;
}
```
