import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { trigger, transition, style, animate } from '@angular/animations';
import { CitasService } from '../citas/citas.service';
import { MatDialog } from '@angular/material/dialog';
import { CitasDiaDialogComponent } from './citas-dia-dialog.component';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  animations: [
    trigger('routeAnimations', [
      transition('* <=> *', [
        style({ opacity: 0 }),
        animate('250ms', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class DashboardComponent implements OnInit {
  breadcrumbs: Array<{ label: string, url: string }> = [];
  currentDate = new Date();
  selectedDate = new Date();
  calendarDays: any[] = [];
  citas: any[] = [];
  citasMap: { [key: string]: any[] } = {};
  selectedDayCitas: any[] = [];
  selectedDayDate: Date | null = null;
  monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private citasService: CitasService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      this.breadcrumbs = this.buildBreadcrumbs(this.route.root);
    });
    
    this.loadCitas();
    this.generateCalendar();
  }

  loadCitas() {
    this.citasService.getCitas().subscribe(citas => {
      this.citas = citas || [];
      this.citasMap = {};
      
      this.citas.forEach(cita => {
        // Usar el campo 'fecha' que es la fecha real de la cita
        if (cita.fecha) {
          const fecha = new Date(cita.fecha);
          const key = this.formatDateKey(fecha);
          if (!this.citasMap[key]) {
            this.citasMap[key] = [];
          }
          this.citasMap[key].push(cita);
        } else if (cita.fecha_hora) {
          // Fallback a fecha_hora si no hay fecha
          const fecha = new Date(cita.fecha_hora);
          const key = this.formatDateKey(fecha);
          if (!this.citasMap[key]) {
            this.citasMap[key] = [];
          }
          this.citasMap[key].push(cita);
        }
      });
      
      this.generateCalendar();
    });
  }

  generateCalendar() {
    const year = this.selectedDate.getFullYear();
    const month = this.selectedDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    this.calendarDays = [];
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = this.isToday(date);
      const key = this.formatDateKey(date);
      const dayCitas = this.citasMap[key] || [];
      
      this.calendarDays.push({
        date: date,
        day: date.getDate(),
        isCurrentMonth: isCurrentMonth,
        isToday: isToday,
        citas: dayCitas,
        hasCitas: dayCitas.length > 0
      });
    }
  }

  formatDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  previousMonth() {
    this.selectedDate.setMonth(this.selectedDate.getMonth() - 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.selectedDate.setMonth(this.selectedDate.getMonth() + 1);
    this.generateCalendar();
  }

  getMonthYearString(): string {
    return `${this.monthNames[this.selectedDate.getMonth()]} ${this.selectedDate.getFullYear()}`;
  }

  getCitasForDay(day: any): any[] {
    return day.citas || [];
  }

  showCitasForDay(day: any) {
    const citas = day.citas || [];
    const fecha = day.date;
    
    // Abrir modal con las citas del día
    this.dialog.open(CitasDiaDialogComponent, {
      width: '90vw',
      maxWidth: '95vw',
      maxHeight: '80vh',
      data: {
        citas: citas,
        fecha: fecha
      }
    });
  }

  getSaludo(): string {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) {
      return '¡Buenos días!';
    } else if (hora >= 12 && hora < 19) {
      return '¡Buenas tardes!';
    } else {
      return '¡Buenas noches!';
    }
  }

  getHoraFormateada(cita: any): string {
    // Usar el campo 'hora' que es la hora correcta de la cita
    if (cita.hora) {
      return cita.hora;
    }
    
    // Fallback a fecha_hora si no hay hora
    if (cita.fecha_hora) {
      const fecha = new Date(cita.fecha_hora);
      return fecha.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return '00:00';
  }

  navegarA(ruta: string) {
    console.log(`🚀 Navegando a: /admin/${ruta}`);
    this.router.navigate([`/admin/${ruta}`]);
  }

  logout() {
    this.authService.logout();
  }



  private buildBreadcrumbs(route: ActivatedRoute, url: string = '', breadcrumbs: Array<{ label: string, url: string }> = []): Array<{ label: string, url: string }> {
    let children: ActivatedRoute[] = route.children;
    if (children.length === 0) {
      return breadcrumbs;
    }
    for (let child of children) {
      let routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }
      let label = child.snapshot.data['breadcrumb'] || this.getLabelFromPath(routeURL);
      if (label) {
        breadcrumbs.push({ label, url });
      }
      return this.buildBreadcrumbs(child, url, breadcrumbs);
    }
    return breadcrumbs;
  }

  private getLabelFromPath(path: string): string {
    switch (path) {
      case 'dashboard': return 'Dashboard';
      case 'usuarios': return 'Usuarios';
      case 'clientes': return 'Clientes';
      case 'pacientes': return 'Pacientes';
      case 'citas': return 'Citas';
      case 'historiales': return 'Historiales';
      default: return '';
    }
  }
}
