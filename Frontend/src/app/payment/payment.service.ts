import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createCheckoutSession(monto:number,tarjetaId: number | string): Observable<{url: string}>{
    return this.http.post<{url: string}>(`${this.apiUrl}/payment/create-checkout-session`,
      {
        monto: monto,
        tarjeta: tarjetaId
      },
      {
        headers:{
          'Content-Type': 'application/json'
        }
      }
    );
  }

  //NUEVO: avisar al backend que el pago fue exitoso
  notifyPaymentSuccess(idTarjeta: string, monto: string | number): Observable<any>{
    return this.http.post<any>(`${this.apiUrl}/payment/success`,
      {
        idTarjeta,
        monto
      }
    );
  }
}
