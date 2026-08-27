import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PortalDataService } from '../services/portal-data.service';
import { PortalSessionService } from '../services/portal-session.service';
import { chipClassForEstado, formatDisplayDate } from '../utils/portal-display.util';
import { PORTAL_ACCESS_ERROR, PORTAL_LOAD_ERROR } from '../utils/portal-client-access.util';

export type PortalListSection =
  | 'vacunas'
  | 'citas'
  | 'historial'
  | 'banos'
  | 'pension'
  | 'recordatorios';

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
      historial: 'medical_services',
      banos: 'content_cut',
      pension: 'home',
      recordatorios: 'notifications'
    };
    return icons[this.seccion];
  }

  get emptyMessage(): string {
    const msgs: Record<PortalListSection, string> = {
      vacunas: 'No hay vacunas registradas',
      citas: 'No hay citas registradas',
      historial: 'No hay historial clínico visible',
      banos: 'No hay baños ni peluquería registrados',
      pension: 'No hay estancias de pensión',
      recordatorios: 'No hay recordatorios'
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
      historial: 'Historial clínico',
      banos: 'Baños y peluquería',
      pension: 'Pensión',
      recordatorios: 'Recordatorios'
    };
    this.titulo = titulos[this.seccion] || 'Expediente';

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
      } else if (this.seccion === 'banos') {
        this.items = await this.portalData.getBaniosPorMascota(this.mascotaId);
      } else if (this.seccion === 'pension') {
        this.items = await this.portalData.getPensionPorMascota(this.mascotaId);
      } else if (this.seccion === 'recordatorios') {
        this.items = await this.portalData.getRecordatoriosPorMascota(this.mascotaId);
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
    if (this.seccion === 'banos') return String(item['tipo_servicio_label'] || 'Baño');
    if (this.seccion === 'pension') {
      return `Pensión · ${item['estado_label'] || item['estado'] || ''}`;
    }
    if (this.seccion === 'recordatorios') return String(item['titulo'] || 'Recordatorio');
    return String(item['diagnostico'] || 'Consulta');
  }

  itemDate(item: Record<string, unknown>): string {
    if (this.seccion === 'vacunas') return this.formatDate(String(item['fecha'] || ''));
    if (this.seccion === 'citas') return this.formatDate(String(item['fecha_hora'] || ''));
    if (this.seccion === 'banos') {
      const hora = String(item['hora_banio'] || '').trim();
      const fecha = this.formatDate(String(item['fecha_banio'] || ''));
      return hora ? `${fecha} · ${hora}` : fecha;
    }
    if (this.seccion === 'pension') {
      const ingreso = this.formatDate(String(item['fecha_ingreso'] || ''));
      const salida = this.formatDate(
        String(item['fecha_salida_real'] || item['fecha_salida_prevista'] || '')
      );
      return salida ? `${ingreso} → ${salida}` : ingreso;
    }
    if (this.seccion === 'recordatorios') return this.formatDate(String(item['fecha'] || ''));
    return this.formatDate(String(item['fecha_registro'] || ''));
  }

  itemEstado(item: Record<string, unknown>): string | null {
    if (
      this.seccion === 'citas' ||
      this.seccion === 'banos' ||
      this.seccion === 'pension' ||
      this.seccion === 'recordatorios'
    ) {
      const estado = String(item['estado_label'] || item['estado'] || '').trim();
      return estado || null;
    }
    return null;
  }
}
