import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { SolicitudPayload, SolicitudResponse } from './solicitudes.models';

@Injectable({
  providedIn: 'root',
})
export class SolicitudesService {
  
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Método para enviar una nueva solicitud
  enviarSolicitud(payload: SolicitudPayload): Observable<SolicitudResponse> {
  const token = localStorage.getItem('token'); // asegúrate que guardas el JWT aquí al hacer login
  return this.http.post<SolicitudResponse>(
    `${this.apiUrl}/solicitudes`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
}

}
