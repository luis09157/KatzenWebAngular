import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit, OnDestroy {
  
  // Propiedad para detectar si es móvil
  isMobile = false;
  
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

  // Estadísticas del hero
  stats = [
    { numero: '10+', label: 'Años de Experiencia', materialIcon: 'star', color: '#fbbf24' },
    { numero: '300+', label: 'Clientes Felices', materialIcon: 'favorite', color: '#f87171' },
    { numero: '100+', label: 'Cirugías Exitosas', materialIcon: 'medical_services', color: '#60a5fa' }
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
      content: 'Lunes a Sábado: 9:00 AM - 7:00 PM',
      color: '#7c3aed'
    },
    {
      icon: 'emergency',
      title: 'Emergencias',
      content: '24 horas, 7 días a la semana',
      color: '#ea580c'
    }
  ];

  // Horarios de atención
  horarios = [
    { dia: 'Lunes - Viernes', horario: '9:00 AM - 7:00 PM' },
    { dia: 'Sábado', horario: '9:00 AM - 5:00 PM' },
    { dia: 'Domingo', horario: 'Solo Emergencias' }
  ];

  scrollPosition = 0;
  isScrolled = false;
  isSubmitting = false;
  isMobileMenuOpen = false;

  constructor(private fb: FormBuilder) {
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

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    this.checkScroll();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  checkScroll() {
    this.scrollPosition = window.pageYOffset;
    this.isScrolled = this.scrollPosition > 100;
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

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  onSubmitContacto() {
    if (this.contactForm.valid) {
      this.isSubmitting = true;
      console.log('Formulario de contacto enviado:', this.contactForm.value);
      
      // Simular envío del formulario
      setTimeout(() => {
        alert('¡Gracias por tu mensaje! Te contactaremos pronto.');
        this.contactForm.reset();
        this.isSubmitting = false;
      }, 2000);
    } else {
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

  ngOnDestroy() {
    // Cleanup si es necesario
  }
}
