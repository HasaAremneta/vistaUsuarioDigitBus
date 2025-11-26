import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../usuarios/usuarios.service';
import { TarjetaUsuario } from '../usuarios/usuarios.models';
import { PaymentService } from '../payment/payment.service';

@Component({
  selector: 'app-pago-sucursal',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './pago-sucursal.html',
  styleUrl: './pago-sucursal.css',
})
export class PagoSucursal implements OnInit {

  monto: number | null = null;
  tarjetaSeleccionada: string = '';
  tarjetas: TarjetaUsuario[] = [];

  constructor(private UsuariosService: UsuariosService, private paymentService: PaymentService){}

  ngOnInit(): void {
    this.cargarTarjetasUsuario();
  }

  get formularioValido(): boolean {
    return !!this.monto && this.monto > 0 && !!this.tarjetaSeleccionada;
  }

  private cargarTarjetasUsuario(): void {
    const idPersonal = localStorage.getItem('idPersonal');
    if (!idPersonal) {
      console.error('No hay idPersonal en localStorage');
      return
    }

    this.UsuariosService.getTarjetasUsuario(idPersonal).subscribe({
      next: tarjetas => {
        this.tarjetas = tarjetas;
        console.log('Tarjetas usuario:', this.tarjetas);
      },
      error: err => {
        console.error('Error al cargar las tarjetas del usuario:', err);
      }
    });
  }

  enviarPago(): void {
    if(!this.formularioValido){
      let mensaje = 'Por favor complete el formulario correctamente:\n';
      if(!this.monto || this.monto <= 10){
        mensaje += '- Ingrese un monto válido mayor a 10.\n';
      }
      alert(mensaje);
      console.log('Formulario invalido');
      return;
    }

    const montoCentavos = (this.monto ?? 0) * 100;
    console.log('Iniciando pago con los siguientes datos:', {
      monto: this.monto,
      montoCentavos: montoCentavos,
      tarjeta: this.tarjetaSeleccionada
    });
    this.paymentService.createCheckoutSession(montoCentavos, this.tarjetaSeleccionada).subscribe({
      next: (response) => {
        console.log('Redirigiendo al pago:', response);
        localStorage.setItem('idTarjeta', this.tarjetaSeleccionada);
        localStorage.setItem('monto',String(this.monto));
        window.location.href = response.url;
        
      },
      error: (err) => {
        console.error('Error al enviar el pago:', err);
        let mensaje = 'Verifique los datos del formulario';
        if(!this.monto || this.monto <= 10){
          mensaje += '\n- Monto inválido, debe ser mayor a 10.';
        }
        alert(mensaje);
      }
    });
  }
}
