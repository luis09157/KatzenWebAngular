import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { UsageMetricsService, UsageRow } from '../core/services/usage-metrics.service';
import { formatearFechaCortaEs } from '../recordatorios/recordatorio-whatsapp.util';

/**
 * Spec 066: «Uso del sistema (este equipo)». Lee la métrica local por módulo
 * (localStorage, sin RTDB ni datos personales) y la muestra menos usados primero.
 */
@Component({
  selector: 'app-uso-sistema-panel',
  templateUrl: './uso-sistema-panel.component.html',
  styleUrls: ['./uso-sistema-panel.component.css'],
})
export class UsoSistemaPanelComponent implements OnInit {
  readonly columnas = ['modulo', 'veces', 'ultimo'];
  filas: UsageRow[] = [];

  constructor(private usageMetrics: UsageMetricsService) {}

  ngOnInit(): void {
    this.recargar();
  }

  recargar(): void {
    this.filas = this.usageMetrics.listar();
  }

  get totalAperturas(): number {
    return this.filas.reduce((acc, f) => acc + f.count, 0);
  }

  formatearUltimo(lastAt: number): string {
    if (!lastAt) return '—';
    const d = new Date(lastAt);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${formatearFechaCortaEs(lastAt)} · ${hh}:${mm}`;
  }

  async reiniciarConteo(): Promise<void> {
    const result = await Swal.fire({
      icon: 'question',
      title: '¿Reiniciar el conteo de uso?',
      text: 'Se borra la estadística guardada en este equipo. Volverá a contar desde cero.',
      showCancelButton: true,
      confirmButtonText: 'Sí, reiniciar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    this.usageMetrics.reiniciar();
    this.recargar();
  }
}
