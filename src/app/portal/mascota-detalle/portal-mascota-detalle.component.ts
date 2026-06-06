import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PortalDataService } from '../services/portal-data.service';

@Component({
  selector: 'app-portal-mascota-detalle',
  templateUrl: './portal-mascota-detalle.component.html',
  styleUrls: ['./portal-mascota-detalle.component.css']
})
export class PortalMascotaDetalleComponent implements OnInit {
  loading = true;
  mascotaId = '';
  mascota: any = null;
  counts = { vacunas: 0, citas: 0, historiales: 0 };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private portalData: PortalDataService
  ) {}

  async ngOnInit(): Promise<void> {
    this.mascotaId = this.route.snapshot.paramMap.get('id') || '';
    this.mascota = await this.portalData.getMascota(this.mascotaId);
    if (!this.mascota) {
      await this.router.navigate(['/portal/mascotas']);
      return;
    }
    this.counts = await this.portalData.getCounts(this.mascotaId);
    this.loading = false;
  }

  ir(seccion: 'vacunas' | 'citas' | 'historial'): void {
    this.router.navigate(['/portal/mascotas', this.mascotaId, seccion]);
  }

  subtitulo(count: number, label: string): string {
    return count > 0 ? `${count} registro${count === 1 ? '' : 's'}` : `Sin ${label}`;
  }
}
