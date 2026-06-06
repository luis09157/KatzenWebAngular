import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PortalDataService } from '../services/portal-data.service';
import { PortalSessionService } from '../services/portal-session.service';
import { PORTAL_ACCESS_ERROR, PORTAL_LOAD_ERROR } from '../utils/portal-client-access.util';

@Component({
  selector: 'app-portal-mascota-detalle',
  templateUrl: './portal-mascota-detalle.component.html',
  styleUrls: ['./portal-mascota-detalle.component.css']
})
export class PortalMascotaDetalleComponent implements OnInit {
  loading = true;
  errorMessage = '';
  mascotaId = '';
  mascota: any = null;
  counts = { vacunas: 0, citas: 0, historiales: 0 };
  metaLine = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private portalData: PortalDataService,
    private portalSession: PortalSessionService
  ) {}

  async ngOnInit(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    this.mascotaId = this.route.snapshot.paramMap.get('id') || '';

    try {
      const session = await this.portalSession.resolveSession();
      if (!session) {
        await this.router.navigate(['/portal/login']);
        return;
      }

      this.mascota = await this.portalData.getMascotaForCliente(this.mascotaId, session.clienteId);
      if (!this.mascota) {
        this.errorMessage = PORTAL_ACCESS_ERROR;
        return;
      }

      this.metaLine = this.buildMetaLine(this.mascota);
      this.counts = await this.portalData.getCounts(this.mascotaId);
    } catch {
      this.errorMessage = PORTAL_LOAD_ERROR;
    } finally {
      this.loading = false;
    }
  }

  ir(seccion: 'vacunas' | 'citas' | 'historial'): void {
    this.router.navigate(['/portal/mascotas', this.mascotaId, seccion]);
  }

  subtitulo(count: number, label: string): string {
    return count > 0 ? `${count} registro${count === 1 ? '' : 's'}` : `Sin ${label}`;
  }

  private buildMetaLine(m: Record<string, unknown>): string {
    const parts = [m['especie'], m['raza'], m['sexo']]
      .filter(Boolean)
      .map(v => String(v).trim().toUpperCase());
    return parts.join(' • ');
  }
}
