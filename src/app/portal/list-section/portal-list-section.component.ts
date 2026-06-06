import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PortalDataService } from '../services/portal-data.service';
import { PortalSessionService } from '../services/portal-session.service';
import { chipClassForEstado, formatDisplayDate } from '../utils/portal-display.util';
import { PORTAL_ACCESS_ERROR, PORTAL_LOAD_ERROR } from '../utils/portal-client-access.util';

export type PortalListSection = 'vacunas' | 'citas' | 'historial';

@Component({
  selector: 'app-portal-list-section',
  templateUrl: './portal-list-section.component.html',
  styleUrls: ['./portal-list-section.component.css']
})
export class PortalListSectionComponent implements OnInit {
  loading = true;
  errorMessage = '';
  seccion: PortalListSection = 'vacunas';
  mascotaId = '';
  items: any[] = [];
  titulo = '';

  formatDate = formatDisplayDate;
  chipClass = chipClassForEstado;

  get iconoSeccion(): string {
    const icons: Record<PortalListSection, string> = {
      vacunas: 'vaccines',
      citas: 'event',
      historial: 'medical_services'
    };
    return icons[this.seccion];
  }

  get emptyMessage(): string {
    const msgs: Record<PortalListSection, string> = {
      vacunas: 'No hay vacunas registradas',
      citas: 'No hay citas registradas',
      historial: 'No hay historial clínico visible'
    };
    return msgs[this.seccion];
  }

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
    const path = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;
    this.seccion = (path as PortalListSection) || 'vacunas';

    const titulos: Record<PortalListSection, string> = {
      vacunas: 'Vacunas',
      citas: 'Citas',
      historial: 'Historial clínico'
    };
    this.titulo = titulos[this.seccion];

    try {
      const session = await this.portalSession.resolveSession();
      if (!session) {
        await this.router.navigate(['/portal/login']);
        return;
      }

      const mascota = await this.portalData.getMascotaForCliente(this.mascotaId, session.clienteId);
      if (!mascota) {
        this.errorMessage = PORTAL_ACCESS_ERROR;
        return;
      }

      if (this.seccion === 'vacunas') {
        this.items = await this.portalData.getVacunasPorMascota(this.mascotaId);
      } else if (this.seccion === 'citas') {
        this.items = await this.portalData.getCitasPorMascota(this.mascotaId);
      } else {
        this.items = await this.portalData.getHistorialesPorMascota(this.mascotaId);
      }
    } catch {
      this.errorMessage = PORTAL_LOAD_ERROR;
    } finally {
      this.loading = false;
    }
  }

  itemTitle(item: Record<string, unknown>): string {
    if (this.seccion === 'vacunas') return String(item['vacuna'] || 'Vacuna');
    if (this.seccion === 'citas') return String(item['motivo'] || 'Cita');
    return String(item['diagnostico'] || 'Consulta');
  }

  itemDate(item: Record<string, unknown>): string {
    if (this.seccion === 'vacunas') return this.formatDate(String(item['fecha'] || ''));
    if (this.seccion === 'citas') return this.formatDate(String(item['fecha_hora'] || ''));
    return this.formatDate(String(item['fecha_registro'] || ''));
  }

  itemEstado(item: Record<string, unknown>): string | null {
    if (this.seccion !== 'citas') return null;
    const estado = String(item['estado'] || '').trim();
    return estado || null;
  }
}
