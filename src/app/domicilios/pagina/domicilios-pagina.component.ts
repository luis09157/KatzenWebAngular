import { Component } from '@angular/core';

/**
 * Spec 108 — pantalla propia de Domicilios (como Peluquería): números del mes arriba,
 * historial, y ahí mismo el precio de la gasolina y el múltiplo de ganancia.
 * Ruta `/admin/finanzas/domicilios` (mismo permiso que Finanzas).
 */
@Component({
  selector: 'app-domicilios-pagina',
  templateUrl: './domicilios-pagina.component.html',
  styleUrls: ['./domicilios-pagina.component.scss'],
})
export class DomiciliosPaginaComponent {
  irAConfiguracion(): void {
    document.getElementById('domicilios-config')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
