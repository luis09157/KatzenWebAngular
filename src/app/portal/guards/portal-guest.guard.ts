import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';

/** Siempre muestra la pantalla de login; la sesión activa se maneja en el componente. */
@Injectable({ providedIn: 'root' })
export class PortalGuestGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
