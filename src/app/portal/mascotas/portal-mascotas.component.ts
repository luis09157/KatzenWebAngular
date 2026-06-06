import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PortalDataService } from '../services/portal-data.service';
import { PortalSessionService } from '../services/portal-session.service';
import { PORTAL_LOAD_ERROR } from '../utils/portal-client-access.util';

@Component({
  selector: 'app-portal-mascotas',
  templateUrl: './portal-mascotas.component.html',
  styleUrls: ['./portal-mascotas.component.css']
})
export class PortalMascotasComponent implements OnInit {
  loading = true;
  errorMessage = '';
  saludo = 'Hola';
  mascotas: any[] = [];

  constructor(
    private portalData: PortalDataService,
    private portalSession: PortalSessionService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      const session = await this.portalSession.resolveSession();
      if (!session) {
        await this.router.navigate(['/portal/login']);
        return;
      }

      const cliente = await this.portalData.getCliente(session.clienteId);
      if (cliente?.['nombre']) {
        const nombre = String(cliente['nombre']).split(' ')[0];
        this.saludo = `Hola, ${nombre}`;
      }

      this.mascotas = await this.portalData.getMascotasActivas(session.clienteId);
    } catch {
      this.errorMessage = PORTAL_LOAD_ERROR;
    } finally {
      this.loading = false;
    }
  }

  verMascota(id: string): void {
    this.router.navigate(['/portal/mascotas', id]);
  }

  metaMascota(m: Record<string, unknown>): string {
    return [m['especie'], m['raza']]
      .filter(Boolean)
      .map(v => String(v).trim().toUpperCase())
      .join(' · ') || 'MASCOTA';
  }

  avatarClass(especie: unknown): string {
    const e = String(especie || '').toLowerCase();
    if (e.includes('felin') || e.includes('gato')) return 'portal-pet-avatar--felino';
    if (e.includes('canin') || e.includes('perro')) return 'portal-pet-avatar--canino';
    return 'portal-pet-avatar--otro';
  }

  iniciales(nombre: unknown): string {
    const n = String(nombre || '').trim();
    if (!n) return '';
    return n.charAt(0).toUpperCase();
  }
}
