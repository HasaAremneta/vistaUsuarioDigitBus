import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Modal } from '../../shared/components/modal/modal';
import { AuthService } from '../auth.service';
import { LoginRequest } from '../auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterLink,Modal],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  username = '';
  password = '';

  showPasswordError = false;
  showModal = false;
  modalTitle = '';
  modalMessage = '';
  isSubmitting = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  onSubmit() {
    if(!this.username || !this.password || this.isSubmitting){
      return;
    }

    const payload: LoginRequest = {
      NombreUsuario: this.username,
      password: this.password
    }

    this.isSubmitting = true;

    this.authService.login(payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.showPasswordError = false;

        //guardar el token en el almacenamiento local
        localStorage.setItem('token', response.token);
        localStorage.setItem('username',this.username);
        localStorage.setItem('email', response.user.CORREO);
        localStorage.setItem('idPersonal', String(response.user.IDPERSONAL));

        this.showCustomModal(
          'Éxito',
          'Inicio de sesión exitoso.'
        );

        setTimeout(() => {
          this.closeCustomModal();
          this.router.navigate(['/home']);
        }, 2000);
      },
      error:(err) => {
        this.isSubmitting = false;
        console.error('Error de inicio de sesion', err);
        this.showPasswordError = true;
        this.showCustomModal(
          'Error de Inicio de Sesión',
          'Usuario o contraseña incorrectos, vuelva a intentar.'
        );
      }
    });
  }

  showCustomModal(title: string, message: string) {
    this.modalTitle = title;
    this.modalMessage = message;
    this.showModal = true;
  }

  closeCustomModal() {
    this.showModal = false;
  }
}
