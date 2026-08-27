import { Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ADMIN_DIALOG_FORM } from '../core/config/admin-ui.config';
import { Visita, VISITA_ESTADO_LABELS } from './visitas.models';
import { VisitasService } from './visitas.service';
import { agregarSaldoCliente } from './visitas.util';
import { VisitaDialogComponent } from './visita-dialog.component';

@Component({
  selector: 'app-cliente-cuenta-dialog',
  templateUrl: './cliente-cuenta-dialog.component.html',
  styleUrls: ['./cliente-cuenta-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ClienteCuentaDialogComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  loading = true;
  visitas: Visita[] = [];
  saldoTotal = 0;
  readonly estadoLabels = VISITA_ESTADO_LABELS;

  constructor(
    private visitasService: VisitasService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<ClienteCuentaDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { clienteId: string; clienteNombre?: string }
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargar(): void {
    this.loading = true;
    this.visitasService
      .getVisitasPorCliente(this.data.clienteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          this.visitas = rows || [];
          this.saldoTotal = agregarSaldoCliente(this.visitas);
          this.loading = false;
        },
        error: () => {
          this.visitas = [];
          this.saldoTotal = 0;
          this.loading = false;
        }
      });
  }

  get deudas(): Visita[] {
    return this.visitas.filter((v) => (Number(v.saldo) || 0) > 0 && v.estado !== 'cancelada');
  }

  formatMoney(n: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0);
  }

  abrirVisita(v: Visita): void {
    const ref = this.dialog.open(VisitaDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data: { visita: v }
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((r) => {
      if (r) this.cargar();
    });
  }

  nuevaVisita(): void {
    const ref = this.dialog.open(VisitaDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data: {
        cliente_id: this.data.clienteId,
        cliente: this.data.clienteNombre
      }
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((r) => {
      if (r) this.cargar();
    });
  }

  cerrar(): void {
    this.dialogRef.close({ saldo: this.saldoTotal });
  }
}
