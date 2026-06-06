import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AuthProfileService } from '../core/services/auth-profile.service';
import { StaffModule } from '../core/config/staff-role.config';
import { LoggerService } from '../core/logger.service';

@Injectable({ providedIn: 'root' })
export class StaffRoleGuard implements CanActivate {
  constructor(
    private authProfile: AuthProfileService,
    private router: Router,
    private logger: LoggerService
  ) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    const staffModule = route.data['staffModule'] as StaffModule | undefined;
    if (!staffModule) {
      return true;
    }

    const access = await this.authProfile.resolveAccess();
    if (!access.staffAccess) {
      await this.router.navigate(['/admin/login']);
      return false;
    }

    if (await this.authProfile.canAccessModule(staffModule)) {
      return true;
    }

    this.logger.log(`StaffRoleGuard: acceso denegado al módulo "${staffModule}"`);
    await this.router.navigate(['/admin/inicio']);
    return false;
  }
}
