import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  user$: Observable<any>;

  constructor(private afAuth: AngularFireAuth, private router: Router) {
    this.user$ = this.afAuth.authState;
  }

  login(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  logout() {
    console.log('AuthService: Iniciando logout...');
    return this.afAuth.signOut().then(() => {
      console.log('AuthService: Logout exitoso, redirigiendo a /admin/login');
      this.router.navigate(['/admin/login']);
    }).catch(error => {
      console.error('AuthService: Error en logout:', error);
      // En caso de error, intentar redirigir de todas formas
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