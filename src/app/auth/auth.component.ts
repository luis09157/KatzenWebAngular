import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth.service';
import { AuthProfileService } from '../core/services/auth-profile.service';
import { AppCheckService } from '../core/app-check.service';
import { FirebaseFunctionsService } from '../core/services/firebase-functions.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {
  email = '';
  password = '';

  constructor(
    private authService: AuthService,
    private authProfileService: AuthProfileService,
    private appCheck: AppCheckService,
    private firebaseFunctions: FirebaseFunctionsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.appCheck.ensureInitialized();
  }

  async login() {
    if (!this.email || !this.password) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Por favor ingresa tu correo y contraseña.'
      });
      return;
    }
    try {
      await this.authService.login(this.email, this.password);
      await this.firebaseFunctions.syncMyClaims();
      const hasStaff = await this.authProfileService.hasStaffAccess();
      if (!hasStaff) {
        await this.authService.logout();
        Swal.fire({
          icon: 'warning',
          title: 'Sin acceso admin',
          text: 'Tu cuenta no tiene perfil de staff. Si eres cliente, inicia sesión en el portal del dueño.'
        });
        return;
      }
      await this.router.navigate(['/admin/inicio']);
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Correo o contraseña incorrectos.'
      });
    }
  }

  irAlPortal(): void {
    this.router.navigate(['/portal/login']);
  }

  irAlInicio(): void {
    this.router.navigate(['/']);
  }
}
