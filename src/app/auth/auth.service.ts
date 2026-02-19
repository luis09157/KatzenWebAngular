import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoggerService } from '../core/logger.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  user$: Observable<unknown>;

  constructor(
    private afAuth: AngularFireAuth,
    private router: Router,
    private logger: LoggerService
  ) {
    this.user$ = this.afAuth.authState;
  }

  login(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  logout() {
    this.logger.log('AuthService: Iniciando logout...');
    return this.afAuth.signOut().then(() => {
      this.logger.log('AuthService: Logout exitoso, redirigiendo a /admin/login');
      this.router.navigate(['/admin/login']);
    }).catch(error => {
      this.logger.error('AuthService: Error en logout:', error);
      this.router.navigate(['/admin/login']);
    });
  }

  isAuthenticated(): Observable<boolean> {
    return this.user$.pipe(map(user => !!user));
  }

  getCurrentUser(): Observable<any> {
    return this.user$;
  }
} 