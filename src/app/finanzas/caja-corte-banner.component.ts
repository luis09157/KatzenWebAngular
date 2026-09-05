import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ADMIN_DIALOG_CONFIG } from '../core/config/admin-ui.config';
import { CajaCorteDialogComponent } from './caja-corte-dialog.component';
import { CajaService } from './caja.service';
import { CajaMovimiento } from './caja.models';
import { debeMostrarBannerCorte, turnoEstaAbierto, yaHayCorteDelDia } from './caja-turno.util';

@Component({
  selector: 'app-caja-corte-banner',
  templateUrl: './caja-corte-banner.component.html',
  styleUrls: ['./caja-corte-banner.component.scss'],
})
export class CajaCorteBannerComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  visible = false;
  private movimientos: CajaMovimiento[] = [];
  private fecha = '';

  constructor(
    private caja: CajaService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.fecha = this.caja.hoyLocalIsoDate();
    combineLatest([this.caja.getTurno(this.fecha), this.caja.getCortes(), this.caja.getMovimientos()])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([turno, cortes, movs]) => {
          this.movimientos = movs || [];
          const hayCorteHoy = yaHayCorteDelDia(cortes, this.fecha);
          const huboVentasHoy = (movs || []).some(
            (m) => m.activo !== false && m.tipo === 'ingreso' && String(m.fecha || '') === this.fecha
          );
          this.visible = debeMostrarBannerCorte({
            turnoAbierto: turnoEstaAbierto(turno),
            hayCorteHoy,
            huboVentasHoy,
            horaLocal: new Date().getHours(),
          });
        },
        error: () => {
          this.visible = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  abrirCorte(): void {
    this.dialog.open(CajaCorteDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      width: '520px',
      data: { fecha: this.fecha || this.caja.hoyLocalIsoDate(), movimientos: this.movimientos },
    });
  }
}
