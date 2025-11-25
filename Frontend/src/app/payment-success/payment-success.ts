import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PaymentService } from '../payment/payment.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-success.html',
  styleUrl: './payment-success.css',
})
export class PaymentSuccess implements OnInit {

  loading = true;
  errorMessage = '';

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    const idTarjeta = localStorage.getItem('idTarjeta');
    const monto = localStorage.getItem('monto');

    if (!idTarjeta || !monto) {
      console.log('No hay datos de recarga para enviar.');
      this.loading = false;
      return;
    }

    this.paymentService.notifyPaymentSuccess(idTarjeta, monto).subscribe({
      next: (response) => {
        console.log('Respuesta backend pago success:', response);
        localStorage.removeItem('idTarjeta');
        localStorage.removeItem('monto');
        this.loading = false;
      },
      error: (error) => {
        console.error('Error en la recarga:', error?.error ?? error?.message ?? error);
        this.errorMessage = 'Hubo un error al procesar la recarga. Por favor, contacta al soporte.';
        this.loading = false;
      }
    });
  }
}
