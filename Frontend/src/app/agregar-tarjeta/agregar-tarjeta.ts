import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../usuarios/usuarios.service';
import { TarjetaUsuario } from '../usuarios/usuarios.models';

@Component({
  selector: 'app-agregar-tarjeta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agregar-tarjeta.html',
  styleUrl: './agregar-tarjeta.css',
})
export class AgregarTarjeta implements OnInit {

  cardNumber: string = '';
  cardType: string = '';
  tarjetasU: TarjetaUsuario[] = [];

  showModal = false;
  modalTitle = '';
  modalMessage = '';
  showForm = false;

  constructor(private usuariosService: UsuariosService) {}

  ngOnInit(): void {
    this.cargarTarjetasUsuario();
  }

  cargarTarjetasUsuario(): void {
    const idPersonal = localStorage.getItem('idPersonal');
    if(!idPersonal){
      this.showCustomModal('Error', 'No se encontró información del usuario. Vuelve a iniciar sesión.');
      return;
    }
    this.usuariosService.getTarjetasUsuario(idPersonal).subscribe({
      next: (tarjetas) => {
        this.tarjetasU = tarjetas;
        console.log('Tarjetas del usuario:', this.tarjetasU);

      },
      error: (err) => {
        console.error(err);
        this.showCustomModal('Error', 'No se pudieron cargar las tarjetas del usuario.');
      }
    });
  }
  validarCantidadTarjetas(): void {
    if(this.tarjetasU.length >= 3){
      this.showCustomModal('Error', 'No puedes agregar más de 3 tarjetas.');
    }else{
      this.showForm = true;
    }
  }

  saveCard(): void {
    if(this.cardNumber.length === 19 && this.cardType !== ''){
      const idPersonal = localStorage.getItem('idPersonal');
      if(!idPersonal){
        this.showCustomModal('Error', 'No se encontró información del usuario. Vuelve a iniciar sesión.');
        return;
      }

      const nuevaTarjeta = {
        idPersonal: idPersonal,
        numTarjeta: this.cardNumber,
        tipo: this.cardType
      };

      this.usuariosService.crearTarjeta(nuevaTarjeta).subscribe({
        next: (response) => {
          console.log('Tarjeta creada:',response);
          this.showCustomModal('Tarjeta Guardada', 'La tarjeta ha sido guardada exitosamente.');
          this.cardNumber = '';
          this.cardType = '';
          this.showForm = false;
          this.cargarTarjetasUsuario();
        },
        error: (err) => {
          console.error('Error al agregar tarjeta:', err);
          this.showCustomModal('Error al Guardar', 'Por favor, verifique que el número de tarjeta sea válido (XXXX-XXXX-XXXX-XXXX) y seleccione un tipo de tarjeta.');
        }
      });
    }else{
      this.showCustomModal('Error al Guardar', 'Por favor, ingrese un número de tarjeta válido (XXXX-XXXX-XXXX-XXXX) y seleccione un tipo de tarjeta.');
    }
  }

  eliminarTarjeta(idTarjeta: number): void {
    const confirmacion = confirm('¿Estás seguro de que deseas eliminar esta tarjeta?');
    if(!confirmacion) return;

    this.usuariosService.eliminarTarjeta(idTarjeta).subscribe({
      next: (response) => {
        if(response.success){
          this.tarjetasU = this.tarjetasU.filter(t => t.IDTARJETA !== idTarjeta);
          this.showCustomModal('Tarjeta Eliminada', 'La tarjeta ha sido eliminada exitosamente.');
        }else{
          this.showCustomModal('Error', response.message || 'No se pudo eliminar la tarjeta.');
        }
      },
      error:(error) =>{
        console.error('Error al eliminar tarjeta:',error);
        this.showCustomModal('Error', 'No se pudo eliminar la tarjeta. Inténtalo de nuevo más tarde.');
      }
    });
  }
  formatCardNumber(): void {
    let digitsOnly = this.cardNumber.replace(/\D/g, '');
    this.cardNumber = digitsOnly.replace(/(\d{4})(?=\d)/g, '$1-');

    if(this.cardNumber.length > 19){
      this.cardNumber = this.cardNumber.slice(0, 19);
    }
  }

  showCustomModal(title: string, message: string): void {
    this.modalTitle = title;
    this.modalMessage = message;
    this.showModal = true;
  }

  closeCustomModal(): void {
    this.showModal = false;
  }

  closeForm(): void {
    this.showForm = false;
  }
}
