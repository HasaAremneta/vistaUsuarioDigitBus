import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment/environment';
import { TarjetasResponse, RecargasResponse } from './historial.models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HistorialService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Obtener tarjetas por ID de personal
  getTarjetas(idPersonal: string): Observable<TarjetasResponse> {
    return this.http.get<TarjetasResponse>(`${this.apiUrl}/historial/tarjetas/${idPersonal}`);
  }
  // Obtener recargas por ID de tarjeta
  getRecargas(idTarjeta: number): Observable<RecargasResponse> {
    return this.http.get<RecargasResponse>(`${this.apiUrl}/historial/recargas/${idTarjeta}`);
  }
}
