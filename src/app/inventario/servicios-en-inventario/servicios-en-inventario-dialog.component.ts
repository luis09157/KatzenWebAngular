import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../../core/error-messages.service';
import { LoadingService, LOADING_MESSAGES } from '../../core/loading.service';
import { ServiciosEnInventarioService } from '../servicios-en-inventario.service';
import {
  CandidatoServicioInventario,
  DESTINO_SERVICIO_LABELS,
  DestinoServicioInventario,
} from '../servicios-en-inventario.util';
import { TIPO_SERVICIO_CLINICA_LABELS } from '../../servicios-clinica/servicios-clinica.models';

/** Lista para revisar y mover servicios guardados como producto (spec 100). */
@Component({
  selector: 'app-servicios-en-inventario-dialog',
  templateUrl: './servicios-en-inventario-dialog.component.html',
  styleUrls: ['./servicios-en-inventario-dialog.component.scss'],
})
export class ServiciosEnInventarioDialogComponent implements OnInit {
  loading = true;
  candidatos: CandidatoServicioInventario[] = [];
  seleccion = new Set<string>();
  readonly destinoLabels = DESTINO_SERVICIO_LABELS;
  readonly tipoLabels = TIPO_SERVICIO_CLINICA_LABELS;
  readonly destinos: DestinoServicioInventario[] = ['catalogo_nuevo', 'catalogo_existente', 'peluqueria', 'pension'];

  constructor(
    private servicio: ServiciosEnInventarioService,
    private dialogRef: MatDialogRef<ServiciosEnInventarioDialogComponent>,
    private loadingService: LoadingService,
    private errorMessages: ErrorMessagesService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.candidatos = await this.servicio.detectar();
      this.candidatos.filter((c) => c.sugeridoMover).forEach((c) => this.seleccion.add(c.productoId));
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'revisar inventario'), 'error');
    } finally {
      this.loading = false;
    }
  }

  delDestino(d: DestinoServicioInventario): CandidatoServicioInventario[] {
    return this.candidatos.filter((c) => c.destino === d);
  }

  get noSugeridos(): CandidatoServicioInventario[] {
    return this.candidatos.filter((c) => !c.sugeridoMover);
  }

  marcado(c: CandidatoServicioInventario): boolean {
    return this.seleccion.has(c.productoId);
  }

  alternar(c: CandidatoServicioInventario, on: boolean): void {
    if (on) this.seleccion.add(c.productoId);
    else this.seleccion.delete(c.productoId);
  }

  get elegidos(): CandidatoServicioInventario[] {
    return this.candidatos.filter((c) => this.seleccion.has(c.productoId));
  }

  get nuevosElegidos(): number {
    return this.elegidos.filter((c) => c.destino === 'catalogo_nuevo').length;
  }

  formatMoney(n: number): string {
    return `$${(Number(n) || 0).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }

  async mover(): Promise<void> {
    const elegidos = this.elegidos;
    if (!elegidos.length) return;
    const ok = await Swal.fire({
      icon: 'question',
      title: `¿Mover ${elegidos.length} servicios?`,
      html:
        `Se agregan <strong>${this.nuevosElegidos}</strong> al Catálogo de servicios con el mismo precio y ` +
        `<strong>${elegidos.length}</strong> se ocultan del inventario. No se borra nada.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, mover',
      cancelButtonText: 'Cancelar',
    });
    if (!ok.isConfirmed) return;
    this.loadingService.show(LOADING_MESSAGES.saving);
    try {
      const r = await this.servicio.mover(elegidos);
      await Swal.fire({
        icon: 'success',
        title: 'Listo',
        text: `${r.creados} servicios nuevos en el catálogo y ${r.ocultados} artículos fuera del inventario.`,
      });
      this.dialogRef.close(r);
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'mover servicios'), 'error');
    } finally {
      this.loadingService.hide();
    }
  }
}
