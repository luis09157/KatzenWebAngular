import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PortalDataService } from '../services/portal-data.service';
import { PortalSessionService } from '../services/portal-session.service';
import { formatNotificationTime, notificacionCategoria } from '../utils/portal-display.util';

@Component({
  selector: 'app-portal-notificaciones',
  templateUrl: './portal-notificaciones.component.html',
  styleUrls: ['./portal-notificaciones.component.css']
})
export class PortalNotificacionesComponent implements OnInit {
  loading = true;
  notificaciones: any[] = [];
  sinLeer = 0;
  clienteId = '';

  formatTime = formatNotificationTime;
  categoria = notificacionCategoria;

  constructor(
    private portalData: PortalDataService,
    private portalSession: PortalSessionService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    const session = await this.portalSession.resolveSession();
    if (!session) {
      await this.router.navigate(['/portal/login']);
      return;
    }
    this.clienteId = session.clienteId;
    await this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading = true;
    this.notificaciones = await this.portalData.getNotificaciones(this.clienteId);
    this.sinLeer = this.notificaciones.filter(n => !n.leida).length;
    this.loading = false;
  }

  async abrir(notif: any): Promise<void> {
    if (!notif.leida) {
      await this.portalData.marcarNotificacionLeida(this.clienteId, notif.id);
      notif.leida = true;
      this.sinLeer = Math.max(0, this.sinLeer - 1);
    }

    const tipo = String(notif.tipo || '').toLowerCase();
    const mascotaId = notif.mascotaId;
    if (!mascotaId) return;

    if (tipo.includes('vacuna')) {
      await this.router.navigate(['/portal/mascotas', mascotaId, 'vacunas']);
    } else if (tipo.includes('cita')) {
      await this.router.navigate(['/portal/mascotas', mascotaId, 'citas']);
    } else if (tipo.includes('historial') || tipo.includes('consulta')) {
      await this.router.navigate(['/portal/mascotas', mascotaId, 'historial']);
    } else {
      await this.router.navigate(['/portal/mascotas', mascotaId]);
    }
  }

  icono(cat: string): string {
    const map: Record<string, string> = {
      vacuna: 'vaccines',
      cita: 'event',
      historial: 'medical_services',
      general: 'notifications'
    };
    return map[cat] || 'notifications';
  }
}
