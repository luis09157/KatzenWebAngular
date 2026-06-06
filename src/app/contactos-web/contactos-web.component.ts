import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import Swal from 'sweetalert2';
import { ContactoWebRecord, ContactoWebService } from '../landing/services/contacto-web.service';
import { LoggerService } from '../core/logger.service';

@Component({
  selector: 'app-contactos-web',
  templateUrl: './contactos-web.component.html',
  styleUrls: ['./contactos-web.component.css']
})
export class ContactosWebComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly destroy$ = new Subject<void>();
  displayedColumns = ['fecha', 'nombre', 'email', 'telefono', 'mascota', 'leido', 'acciones'];
  dataSource = new MatTableDataSource<ContactoWebRecord>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  readonly pageSize = 50;

  loading = false;
  filtroLeido: 'todos' | 'pendientes' | 'leidos' = 'todos';
  contactos: ContactoWebRecord[] = [];
  totalPendientes = 0;

  constructor(
    private contactoWebService: ContactoWebService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.cargarContactos();
  }

  ngAfterViewInit(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarContactos(): void {
    this.loading = true;
    this.contactoWebService.getContactos().pipe(takeUntil(this.destroy$)).subscribe({
      next: contactos => {
        this.contactos = contactos || [];
        this.totalPendientes = this.contactos.filter(c => !c.leido).length;
        this.aplicarFiltroLeido();
        this.loading = false;
        setTimeout(() => {
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
        }, 0);
      },
      error: error => {
        this.logger.error('Error al cargar contactos web:', error);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los mensajes de contacto.',
          showCancelButton: true,
          confirmButtonText: 'Reintentar',
          cancelButtonText: 'Cerrar'
        }).then(result => {
          if (result.isConfirmed) {
            this.cargarContactos();
          }
        });
      }
    });
  }

  aplicarFiltro(event: Event): void {
    const filtro = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filtro;
  }

  cambiarFiltroLeido(filtro: 'todos' | 'pendientes' | 'leidos'): void {
    this.filtroLeido = filtro;
    this.aplicarFiltroLeido();
  }

  private aplicarFiltroLeido(): void {
    let filtrados = [...this.contactos];
    if (this.filtroLeido === 'pendientes') {
      filtrados = filtrados.filter(c => !c.leido);
    } else if (this.filtroLeido === 'leidos') {
      filtrados = filtrados.filter(c => c.leido);
    }
    this.dataSource.data = filtrados;
  }

  async alternarLeido(contacto: ContactoWebRecord): Promise<void> {
    try {
      await this.contactoWebService.marcarLeido(contacto.id, !contacto.leido);
      contacto.leido = !contacto.leido;
      this.totalPendientes = this.contactos.filter(c => !c.leido).length;
      this.aplicarFiltroLeido();
    } catch (error) {
      this.logger.error('Error al actualizar contacto:', error);
      Swal.fire('Error', 'No se pudo actualizar el estado del mensaje.', 'error');
    }
  }

  verDetalle(contacto: ContactoWebRecord): void {
    Swal.fire({
      title: contacto.nombre,
      html: `
        <p><strong>Email:</strong> ${contacto.email}</p>
        <p><strong>Teléfono:</strong> ${contacto.telefono || 'N/A'}</p>
        <p><strong>Mascota:</strong> ${contacto.mascota || 'N/A'}</p>
        <p><strong>Fecha:</strong> ${this.formatearFecha(contacto.fecha)}</p>
        <hr>
        <p style="text-align:left;white-space:pre-wrap">${contacto.mensaje}</p>
      `,
      width: 640,
      confirmButtonText: contacto.leido ? 'Marcar pendiente' : 'Marcar leído',
      showCancelButton: true,
      cancelButtonText: 'Cerrar'
    }).then(async result => {
      if (result.isConfirmed) {
        await this.alternarLeido(contacto);
      }
    });
  }

  formatearFecha(fecha: string): string {
    if (!fecha) {
      return 'N/A';
    }
    const parsed = new Date(fecha);
    return Number.isNaN(parsed.getTime()) ? fecha : parsed.toLocaleString('es-MX');
  }
}
