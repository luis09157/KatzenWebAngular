import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PortalDataService } from '../services/portal-data.service';
import { PortalSessionService } from '../services/portal-session.service';

@Component({
  selector: 'app-portal-mascotas',
  templateUrl: './portal-mascotas.component.html',
  styleUrls: ['./portal-mascotas.component.css']
})
export class PortalMascotasComponent implements OnInit {
  loading = true;
  saludo = 'Hola';
  mascotas: any[] = [];

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

    const cliente = await this.portalData.getCliente(session.clienteId);
    if (cliente?.['nombre']) {
      const nombre = String(cliente['nombre']).split(' ')[0];
      this.saludo = `Hola, ${nombre}`;
    }

    this.mascotas = await this.portalData.getMascotasActivas(session.clienteId);
    this.loading = false;
  }

  verMascota(id: string): void {
    this.router.navigate(['/portal/mascotas', id]);
  }
}
