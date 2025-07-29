import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    console.log('AuthGuard: Verificando autenticación...');
    return this.authService.isAuthenticated().pipe(
      tap(isAuth => {
        console.log('AuthGuard: Usuario autenticado:', isAuth);
        if (!isAuth) {
          console.log('AuthGuard: Usuario no autenticado, redirigiendo a /admin/login');
          this.router.navigate(['/admin/login']);
        } else {
          console.log('AuthGuard: Usuario autenticado, permitiendo acceso');
        }
      })
    );
  }
} 