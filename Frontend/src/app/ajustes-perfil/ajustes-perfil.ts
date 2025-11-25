import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../usuarios/usuarios.service';

@Component({
  selector: 'app-ajustes-perfil',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './ajustes-perfil.html',
  styleUrl: './ajustes-perfil.css',
})
export class AjustesPerfil {
  username: string = localStorage.getItem('username') || '';
  email: string = localStorage.getItem('email') || '';
  curPassword: string = '';
  newPassword: string = '';

  showModal = false;
  modalTitle = '';
  modalMessage = '';

  constructor(private usuariosService: UsuariosService) {}

  showCustomModal(title: string, message: string): void {
    this.modalTitle = title;
    this.modalMessage = message;
    this.showModal = true;
  }

  closeCustomModal(): void {
    this.showModal = false;
  }

  private isValidEmail(email: string): boolean {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email.toLowerCase());
  }

  //Guardar cambios de perfil
  saveUserData():void{
    if(this.username.trim() === '' || this.email.trim() === ''){
      this.showCustomModal('Error al Guardar','Por favor, complete los campos de usuario y correo.');
      return;
    }
    if(!this.isValidEmail(this.email)){
      this.showCustomModal('Error de Validación','Por favor, ingrese un correo electrónico válido.');
      return;
    }

    const nombreUsuarioActual = localStorage.getItem('username') || '';

    const payLoad = {
      nombreUsuarioActual,
      nuevoNombreUsuario: this.username,
      correo: this.email
    };

    this.usuariosService.actualizarDatosPerfil(payLoad).subscribe({
      next:()=>{
        this.showCustomModal('Cambios Guardados','¡Usuario y correo actualizados correctamente!');
        localStorage.setItem('username',this.username);
        localStorage.setItem('email',this.email);
      },
      error: (err)=>{
        console.log(err);
        this.showCustomModal('Error al Guardar','Ocurrió un error al actualizar los datos. Por favor, inténtelo de nuevo más tarde.');
      }
    });
  }

  //Cambiar contraseña
  savePassword():void{
    if(this.newPassword.trim() === ''){
      this.showCustomModal('Error', 'Por favor, ingrese una nueva contraseña.');
      return;
    }
    if(this.curPassword.trim() === ''){
      this.showCustomModal('Error', 'Por favor, ingrese la contraseña actual para confirmar.');
      return;
    }

    const nombreUsuario = localStorage.getItem('username') || '';

    //Validar la contraseña actual
    this.usuariosService.validarPassword({ nombre: nombreUsuario, password: this.curPassword }).subscribe({
      next:(resp) => {
        if(!resp.valid){
          this.showCustomModal('Error', 'Contraseña actual incorrecta.');
          return;
        }
        //Actualizar a la nueva contraseña
        const payLoad = {
          nombreUsuario,
          nuevaPassword: this.newPassword
        };

        this.usuariosService.actualizarPassword(payLoad).subscribe({
          next: () => {
            this.showCustomModal('Éxito', 'Contraseña actualizada correctamente.');
            this.curPassword = '';
            this.newPassword = '';
          },
          error: (err) => {
            console.log(err);
            this.showCustomModal('Error','No se pudo actualizar la contraseña. Por favor, inténtelo de nuevo más tarde.');
          }
        });
      },
      error: (err) => {
        console.log(err);
        this.showCustomModal('Error','No se pudo validar la contraseña actual. Por favor, inténtelo de nuevo más tarde.');
      }
    });
  }
}
