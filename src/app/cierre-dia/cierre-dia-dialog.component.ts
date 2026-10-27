import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom, take } from 'rxjs';
import Swal from 'sweetalert2';
import { BaniosService } from '../banios/banios.service';
import { CitasService } from '../citas/citas.service';
import { VisitasService } from '../visitas/visitas.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { ClientesService } from '../clientes/clientes.service';
import { getClienteNombreCompleto } from '../core/utils/cliente-search.util';
import { hoyLocalIsoDate } from '../core/utils/periodo-filtro.util';
import { PendienteCierre, TIPO_CIERRE_LABELS, pendientesDeDiasPasados } from './cierre-dia.util';

export interface CierreDiaResultado {
  /** El usuario pidió abrir este ticket en Cobrar. */
  abrirVisitaId?: string;
  cambios: number;
}

/**
 * Etapa A (2026-10-27) — «Cierre del día»: baños, citas y tickets de días anteriores que siguen
 * abiertos, para resolverlos de un jalón. Nada se cambia sin que la persona lo toque.
 */
@Component({
  selector: 'app-cierre-dia-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './cierre-dia-dialog.component.html',
  styleUrls: ['./cierre-dia-dialog.component.scss'],
})
export class CierreDiaDialogComponent implements OnInit {
  cargando = true;
  pendientes: PendienteCierre[] = [];
  ocupado = new Set<string>();
  cambios = 0;
  readonly etiquetas = TIPO_CIERRE_LABELS;

  constructor(
    private ref: MatDialogRef<CierreDiaDialogComponent, CierreDiaResultado>,
    private banios: BaniosService,
    private citas: CitasService,
    private visitas: VisitasService,
    private pacientes: PacientesService,
    private clientesService: ClientesService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const [banios, citasRaw, tickets, mascotas, clientes] = await Promise.all([
        firstValueFrom(this.banios.getBanios().pipe(take(1))),
        firstValueFrom(this.citas.getCitas().pipe(take(1))),
        firstValueFrom(this.visitas.getVisitas().pipe(take(1))),
        firstValueFrom(this.pacientes.getPacientes().pipe(take(1))),
        firstValueFrom(this.clientesService.getClientes().pipe(take(1))),
      ]);
      // Las citas guardan solo ids: se les pone nombre de mascota y dueño para mostrarlas.
      const nombreMascota = new Map((mascotas || []).map((m) => [String(m.id), String(m.nombre || '')] as [string, string]));
      const nombreCliente = new Map(
        (clientes || []).map((c) => [String(c.id), getClienteNombreCompleto(c)] as [string, string])
      );
      const citas = (citasRaw || []).map((c: Record<string, unknown>) => ({
        ...c,
        paciente: c['paciente'] || nombreMascota.get(String(c['paciente_id'] || '')) || '',
        cliente: c['cliente'] || nombreCliente.get(String(c['cliente_id'] || '')) || '',
      }));
      this.pendientes = pendientesDeDiasPasados(
        {
          banios: banios as unknown as Record<string, unknown>[],
          citas: citas as Record<string, unknown>[],
          tickets: tickets as unknown as Record<string, unknown>[],
        },
        hoyLocalIsoDate()
      );
    } finally {
      this.cargando = false;
    }
  }

  get serviciosAbiertos(): PendienteCierre[] {
    return this.pendientes.filter((p) => p.tipo !== 'ticket');
  }

  clave(p: PendienteCierre): string {
    return `${p.tipo}:${p.id}`;
  }

  fechaCorta(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d} ${meses.at(m - 1) || ''} ${y}`;
  }

  /** Hecho = baño completado / cita completada. No vino = cancelado / cancelada. */
  async resolver(p: PendienteCierre, hecho: boolean): Promise<void> {
    const k = this.clave(p);
    if (this.ocupado.has(k)) return;
    this.ocupado.add(k);
    try {
      await this.guardar(p, hecho);
      this.pendientes = this.pendientes.filter((x) => this.clave(x) !== k);
      this.cambios++;
    } catch (e) {
      Swal.fire('No se pudo guardar', e instanceof Error ? e.message : 'Intenta de nuevo.', 'error');
    } finally {
      this.ocupado.delete(k);
    }
  }

  async todosHechos(): Promise<void> {
    const lista = this.serviciosAbiertos;
    if (!lista.length) return;
    const ok = await Swal.fire({
      icon: 'question',
      title: `¿Marcar ${lista.length} como hechos?`,
      text: 'Baños y citas de días pasados quedan como atendidos. Los tickets abiertos no se tocan.',
      showCancelButton: true,
      confirmButtonText: 'Sí, todos hechos',
      cancelButtonText: 'Revisar uno por uno',
    });
    if (!ok.isConfirmed) return;
    for (const p of lista) {
      await this.resolver(p, true);
    }
  }

  abrirTicket(p: PendienteCierre): void {
    this.ref.close({ abrirVisitaId: p.id, cambios: this.cambios });
  }

  cerrar(): void {
    this.ref.close({ cambios: this.cambios });
  }

  private async guardar(p: PendienteCierre, hecho: boolean): Promise<void> {
    if (p.tipo === 'banio') {
      await this.banios.cambiarEstadoBanio(p.id, hecho ? 'completado' : 'cancelado');
      return;
    }
    if (p.tipo === 'cita') {
      await this.citas.guardarCita({
        ...p.raw,
        estado: hecho ? 'completada' : 'cancelada',
        ...(hecho ? {} : { motivo_cancelacion: 'No vino (cierre del día)' }),
      });
    }
  }
}
