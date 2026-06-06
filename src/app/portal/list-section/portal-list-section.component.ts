import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PortalDataService } from '../services/portal-data.service';
import { chipClassForEstado, formatDisplayDate } from '../utils/portal-display.util';

export type PortalListSection = 'vacunas' | 'citas' | 'historial';

@Component({
  selector: 'app-portal-list-section',
  templateUrl: './portal-list-section.component.html',
  styleUrls: ['./portal-list-section.component.css']
})
export class PortalListSectionComponent implements OnInit {
  loading = true;
  seccion: PortalListSection = 'vacunas';
  mascotaId = '';
  items: any[] = [];
  titulo = '';

  formatDate = formatDisplayDate;
  chipClass = chipClassForEstado;

  constructor(
    private route: ActivatedRoute,
    private portalData: PortalDataService
  ) {}

  async ngOnInit(): Promise<void> {
    this.mascotaId = this.route.snapshot.paramMap.get('id') || '';
    const path = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;
    this.seccion = (path as PortalListSection) || 'vacunas';

    const titulos: Record<PortalListSection, string> = {
      vacunas: 'Vacunas',
      citas: 'Citas',
      historial: 'Historial clínico'
    };
    this.titulo = titulos[this.seccion];

    if (this.seccion === 'vacunas') {
      this.items = await this.portalData.getVacunasPorMascota(this.mascotaId);
    } else if (this.seccion === 'citas') {
      this.items = await this.portalData.getCitasPorMascota(this.mascotaId);
    } else {
      this.items = await this.portalData.getHistorialesPorMascota(this.mascotaId);
    }

    this.loading = false;
  }
}
