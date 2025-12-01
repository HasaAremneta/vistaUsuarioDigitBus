import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-recuperacion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recuperacion.html',
  styleUrl: './recuperacion.css',
})
export class Recuperacion {
  email = '';
  loading = false;
  showError = false;
  errorMessage = '';
  emailEnviado = false;

  constructor(private authService: AuthService) {}

  onSubmit() {
    this.showError = false;
    this.errorMessage = '';

    if (!this.email) {
      this.showError = true;
      this.errorMessage = 'Por favor, ingrese su correo electrónico.';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.showError = true;
      this.errorMessage = 'Por favor, ingrese un correo electrónico válido.';
      return;
    }

    if(this.loading) return;

    this.loading = true;

    this.emailEnviado = true;
    
    this.authService
      .recoverPassword({ correo: this.email })
      .pipe(
        finalize(() => {
          // se ejecuta al final, éxito o error
          this.loading = false;
        })
      )
      .subscribe({
        next: () => {
          // todo bien, no hay nada extra que hacer
        },
        error: (err) => {
          // si algo falla, regresamos a la vista del formulario
          this.emailEnviado = false;
          this.showError = true;

          if (err.error && (err.error.error || err.error.mensaje)) {
            this.errorMessage = err.error.error || err.error.mensaje;
          } else {
            this.errorMessage = 'Error al enviar el correo de recuperación.';
          }
        },
      });
  }

  resetForm(){
    this.emailEnviado = false;
    this.email = '';
    this.showError = false;
    this.errorMessage = '';
  }
}
