import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { RenovacionPayload, RenovacionResponse, TarjetasRenovacionResponse } from './renovaciones.models';


@Injectable({
  providedIn: 'root',
})
export class RenovacionesService {
  
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient){}

  private getAuthHeaders(): HttpHeaders{
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  getTarjetas(idPersonal: string): Observable<TarjetasRenovacionResponse>{
    return this.http.get<TarjetasRenovacionResponse>(`${this.apiUrl}/renovacionYextravios/tarjetas/${idPersonal}`,{headers:this.getAuthHeaders()});
  }

  enviarRenovacion(payload: RenovacionPayload): Observable<RenovacionResponse>{
    return this.http.post<RenovacionResponse>(`${this.apiUrl}/renovacionYextravios/renovacion`,payload,{headers: this.getAuthHeaders()});
  }

  enviarExtravio(payload: RenovacionPayload): Observable<RenovacionResponse>{
    return this.http.post<RenovacionResponse>(`${this.apiUrl}/renovacionYextravios/extravios`,payload, { headers: this.getAuthHeaders() });
  }

}
