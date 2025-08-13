import { Component } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent {
  email = '';
  password = '';

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    if (!this.email || !this.password) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Por favor ingresa tu correo y contraseña.'
      });
      return;
    }
    this.authService.login(this.email, this.password)
      .then(() => {
        // Login exitoso - redirigir directamente sin mostrar SweetAlert
        this.router.navigate(['/admin/inicio']);
      })
      .catch(() => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Correo o contraseña incorrectos.'
        });
      });
  }

  irAlInicio() {
    this.router.navigate(['/admin/inicio']);
  }
}
