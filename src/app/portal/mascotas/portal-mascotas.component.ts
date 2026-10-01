import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PortalDataService } from '../services/portal-data.service';
import { PortalSessionService } from '../services/portal-session.service';
import { PORTAL_LOAD_ERROR } from '../utils/portal-client-access.util';
import { buildMascotaActivityChips, MascotaActivityChips } from '../utils/portal-cartilla.util';
import { ClinicaTelefonoVista, resolveClinicaTelefono } from '../utils/portal-clinica-contacto.util';

@Component({
  selector: 'app-portal-mascotas',
  templateUrl: './portal-mascotas.component.html',
  styleUrls: ['./portal-mascotas.component.css'],
})
export class PortalMascotasComponent implements OnInit {
  loading = true;
  errorMessage = '';
  saludo = 'Hola';
  mascotas: Array<Record<string, unknown> & { id: string }> = [];
  chips: Record<string, MascotaActivityChips> = {};
  readonly clinicaTel: ClinicaTelefonoVista = resolveClinicaTelefono();

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
      await Promise.all(
        this.mascotas.map(async (m) => {
          const act = await this.portalData.getActividadMascota(m.id, session.clienteId);
          this.chips[m.id] = buildMascotaActivityChips({
            banos: act.banos as unknown as Record<string, unknown>[],
            vacunas: act.vacunas as unknown as Record<string, unknown>[],
            recordatorios: act.recordatorios as unknown as Record<string, unknown>[],
          });
        })
      );
    } catch {
      this.errorMessage = PORTAL_LOAD_ERROR;
    } finally {
      this.loading = false;
    }
  }

  chipsDe(id: string): MascotaActivityChips | null {
    return this.chips[id] || null;
  }

  verMascota(id: string): void {
    this.router.navigate(['/portal/mascotas', id]);
  }

  metaMascota(m: Record<string, unknown>): string {
    return (
      [m['especie'], m['raza']]
        .filter(Boolean)
        .map((v) => String(v).trim().toUpperCase())
        .join(' · ') || 'MASCOTA'
    );
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
