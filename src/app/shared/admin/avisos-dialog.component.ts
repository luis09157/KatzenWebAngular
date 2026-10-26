import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PortalFcmService } from '../../core/services/portal-fcm.service';
import { PersonaAvisos, TokenAvisosRow, estadoAvisosPorPersona } from '../../core/utils/avisos-estado.util';

/**
 * «Avisos» (2026-10-26): estado de los avisos en ESTE celular (activar / probar) y,
 * para admin y super admin, quién del personal los recibe.
 */
@Component({
  selector: 'app-avisos-dialog',
  templateUrl: './avisos-dialog.component.html',
  styleUrls: ['./avisos-dialog.component.scss'],
})
export class AvisosDialogComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  permiso: NotificationPermission | 'unsupported' = 'default';
  dispositivo = '';
  trabajando = false;
  mensaje = '';
  mensajeOk = false;
  equipo: PersonaAvisos[] = [];
  cargandoEquipo = false;

  constructor(
    private fcm: PortalFcmService,
    private db: AngularFireDatabase,
    private dialogRef: MatDialogRef<AvisosDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { verEquipo?: boolean }
  ) {}

  ngOnInit(): void {
    this.permiso = this.fcm.currentPermission();
    this.dispositivo = this.fcm.etiquetaDispositivo();
    if (this.data?.verEquipo) {
      this.cargandoEquipo = true;
      combineLatest([
        this.db.list<{ nombre?: string; email?: string; activo?: boolean }>('Katzen/Usuarios').snapshotChanges(),
        this.db.object<Record<string, Record<string, TokenAvisosRow>>>('Katzen/FcmTokens').valueChanges(),
      ])
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: ([usuarios, tokens]) => {
            const lista = (usuarios || []).map((c) => ({ id: c.payload.key || '', ...(c.payload.val() || {}) }));
            this.equipo = estadoAvisosPorPersona(lista, tokens || {});
            this.cargandoEquipo = false;
          },
          error: () => {
            this.cargandoEquipo = false;
          },
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get conAvisos(): number {
    return this.equipo.filter((p) => p.estado === 'activo').length;
  }

  async activar(): Promise<void> {
    this.trabajando = true;
    this.mensaje = '';
    try {
      const r = await this.fcm.registerStaffToken();
      this.permiso = this.fcm.currentPermission();
      this.mensajeOk = r.status === 'registered';
      this.mensaje = this.mensajeOk ? 'Avisos activados en este celular.' : r.detail || 'No se pudieron activar.';
      if (this.mensajeOk) this.fcm.escucharEnPrimerPlano();
    } finally {
      this.trabajando = false;
    }
  }

  async probar(): Promise<void> {
    this.trabajando = true;
    try {
      const r = await this.fcm.probarEnEsteDispositivo();
      this.mensajeOk = r.ok;
      this.mensaje = r.detail;
    } finally {
      this.trabajando = false;
    }
  }

  textoEstadoPersona(p: PersonaAvisos): string {
    if (p.estado === 'activo') return 'Recibe avisos';
    if (p.estado === 'revisar') return 'Revisar: su celular no ha entrado en más de 30 días';
    return 'No tiene avisos activados';
  }

  fechaCorta(iso: string): string {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
