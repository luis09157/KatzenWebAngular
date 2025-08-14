import { Component, OnInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {
  
  servicios = [
    {
      icon: '🐕',
      titulo: 'Consultas Veterinarias',
      descripcion: 'Atención médica integral para perros y gatos con veterinarios especializados.',
      color: '#4CAF50'
    },
    {
      icon: '💊',
      titulo: 'Desparasitación',
      descripcion: 'Tratamientos preventivos y curativos para parásitos internos y externos.',
      color: '#FF9800'
    },
    {
      icon: '🩺',
      titulo: 'Cirugía',
      descripcion: 'Procedimientos quirúrgicos menores y mayores con tecnología avanzada.',
      color: '#2196F3'
    },
    {
      icon: '🔬',
      titulo: 'Laboratorios',
      descripcion: 'Análisis clínicos, pruebas de sangre y diagnósticos especializados.',
      color: '#9C27B0'
    },
    {
      icon: '💉',
      titulo: 'Vacunas',
      descripcion: 'Esquemas completos de vacunación para mascotas de todas las edades.',
      color: '#E91E63'
    },
    {
      icon: '🛁',
      titulo: 'Baño y Spa',
      descripcion: 'Servicios de higiene y belleza para mantener a tu mascota radiante.',
      color: '#00BCD4'
    },
    {
      icon: '✂️',
      titulo: 'Corte de Pelo',
      descripcion: 'Cortes de pelo profesionales y estilizados para perros y gatos.',
      color: '#795548'
    },
    {
      icon: '🦴',
      titulo: 'Alimentos',
      descripcion: 'Venta de alimentos premium y especializados para diferentes necesidades.',
      color: '#8BC34A'
    },
    {
      icon: '🛍️',
      titulo: 'Pet Shop',
      descripcion: 'Accesorios, juguetes y productos para el cuidado de tu mascota.',
      color: '#FF5722'
    },
    {
      icon: '💊',
      titulo: 'Medicamentos',
      descripcion: 'Farmacia veterinaria con medicamentos recetados y de venta libre.',
      color: '#607D8B'
    },
    {
      icon: '🏠',
      titulo: 'Servicio a Domicilio',
      descripcion: 'Atención veterinaria en la comodidad de tu hogar cuando sea necesario.',
      color: '#3F51B5'
    }
  ];

  horarios = [
    { dia: 'Lunes - Viernes', horario: '8:00 AM - 8:00 PM', icon: '🌅' },
    { dia: 'Sábados', horario: '8:00 AM - 6:00 PM', icon: '🌤️' },
    { dia: 'Domingos', horario: '9:00 AM - 2:00 PM', icon: '☀️' },
    { dia: 'Emergencias', horario: '24/7', icon: '🚨' }
  ];

  redesSociales = [
    { icon: '📱', nombre: 'WhatsApp', enlace: 'https://wa.me/528136024090', color: '#25D366' },
    { icon: '📧', nombre: 'Email', enlace: 'mailto:contacto@katzenvet.com', color: '#EA4335' },
    { icon: '📍', nombre: 'Google Maps', enlace: 'https://maps.app.goo.gl/iuTW5Q7j4uWT6ftt8', color: '#4285F4' }
  ];

  testimonios = [
    {
      nombre: 'María González',
      mascota: 'Luna (Gata)',
      texto: 'Excelente atención para mi gatita. Los doctores son muy profesionales y cariñosos.',
      rating: 5,
      imagen: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face'
    },
    {
      nombre: 'Carlos Rodríguez',
      mascota: 'Max (Perro)',
      texto: 'Gracias por salvar a Max. El equipo es increíble y las instalaciones están súper limpias.',
      rating: 5,
      imagen: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
    },
    {
      nombre: 'Ana Martínez',
      mascota: 'Rocky (Perro)',
      texto: 'La mejor clínica veterinaria que he conocido. Muy recomendable para cualquier mascota.',
      rating: 5,
      imagen: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'
    }
  ];

  stats = [
    { numero: '10+', label: 'Años de Experiencia', icon: '⭐' },
    { numero: '1000+', label: 'Mascotas Atendidas', icon: '🐾' },
    { numero: '24/7', label: 'Emergencias', icon: '🚨' },
    { numero: '98%', label: 'Satisfacción', icon: '❤️' }
  ];

  scrollPosition = 0;
  isScrolled = false;

  constructor() { }

  ngOnInit() {
    this.checkScroll();
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    this.checkScroll();
  }

  checkScroll() {
    this.scrollPosition = window.pageYOffset;
    this.isScrolled = this.scrollPosition > 100;
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

  getRatingStars(rating: number): number[] {
    return Array.from({ length: rating }, (_, i) => i + 1);
  }
}
