import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { LoggerService } from '../core/logger.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private logger: LoggerService
  ) {}

  canActivate(): Observable<boolean> {
    this.logger.log('AuthGuard: Verificando autenticación...');
    return this.authService.isAuthenticated().pipe(
      tap(isAuth => {
        this.logger.log('AuthGuard: Usuario autenticado:', isAuth);
        if (!isAuth) {
          this.logger.log('AuthGuard: Usuario no autenticado, redirigiendo a /admin/login');
          this.router.navigate(['/admin/login']);
        } else {
          this.logger.log('AuthGuard: Usuario autenticado, permitiendo acceso');
        }
      })
    );
  }
} 