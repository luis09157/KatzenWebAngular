import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthProfileService } from '../core/services/auth-profile.service';
import { LoggerService } from '../core/logger.service';

@Injectable({ providedIn: 'root' })
export class AdminRoleGuard implements CanActivate {
  constructor(
    private authProfile: AuthProfileService,
    private router: Router,
    private logger: LoggerService
  ) {}

  async canActivate(): Promise<boolean> {
    const access = await this.authProfile.resolveAccess();
    if (!access.staffAccess) {
      await this.router.navigate(['/admin/login']);
      return false;
    }

    if (await this.authProfile.isAdministrator()) {
      return true;
    }

    this.logger.log('AdminRoleGuard: acceso denegado — se requiere perfil administrador');
    await this.router.navigate(['/admin/inicio']);
    return false;
  }
}
