import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Modal } from '../../shared/components/modal/modal';
import { AuthService } from '../auth.service';
import { RegisterRequest } from '../auth.models';


@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterLink,Modal],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {
  nombre = '';
  email = '';
  password = '';
  confirmPassword = '';
  aceptaTerminos = false;

  // Estados para el manejo de la UI
  loading = false;
  showError = false;
  errorMessage = '';

  //Modal
  showModal = false;
  modalTitle = '';
  modalMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ){}

  onSubmit() {
    this.showError = false;
    this.errorMessage = '';

    // Validaciones básicas
    if (!this.nombre || !this.email || !this.password || !this.confirmPassword) {
      this.showError = true;
      this.errorMessage = 'Por favor, complete todos los campos.';
      return;
    }

    if(this.password.length < 8){
      this.showError = true;
      this.errorMessage = 'La contraseña debe tener al menos 8 caracteres.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.showError = true;
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    if (!this.aceptaTerminos) {
      this.showError = true;
      this.errorMessage = 'Debe aceptar los términos y condiciones.';
      return;
    }

    this.loading = true;

    // Preparar el payload
    const payload: RegisterRequest = {
      NombreUsuario: this.nombre,
      Nombre: this.nombre.split(' ')[0] || this.nombre,
      ApellidoPaterno: 'ApellidoP',
      ApellidoMaterno: 'ApellidoM',
      DiaNacimiento: '01',
      MesNacimiento: '01',
      AnoNacimiento: '2000',
      Correo: this.email,
      password: this.password,
    };

    // Llamar al servicio de registro
    this.authService.register(payload).subscribe({
      next: (response) => {
        this.loading = false;

        this.showCustomModal(
          'Cuenta Creada',
          response.message || '¡Tu cuenta ha sido creada exitosamente! Ya puedes iniciar sesión.'
        );

        //Liempiar el formulario
        this.nombre = '';
        this.email = '';
        this.password = '';
        this.confirmPassword = '';
        this.aceptaTerminos = false;


        setTimeout(() => {
          this.closeModal();
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err) => {
        this.loading = false;
        this.showError = true;

        if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        }else{
          this.errorMessage = 'Error en el registro. Por favor, intente nuevamente.';
        }
      }
    });
  }

  showCustomModal(title: string, message: string) {
    this.modalTitle = title;
    this.modalMessage = message;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }
}
