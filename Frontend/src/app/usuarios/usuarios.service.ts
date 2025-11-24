import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { ValidarPasswordRequest, ValidarPasswordResponse, ActualizarDatosPerfilRequest, ActualizarPasswordRequest } from './usuarios.models';

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  
  private apiUrl = environment.apiUrl;

  constructor(private http:HttpClient){}

  validarPassword(payload: ValidarPasswordRequest): Observable<ValidarPasswordResponse>{
    return this.http.post<ValidarPasswordResponse>(`${this.apiUrl}/usuarios/validaPassword`,payload);
  }

  actualizarDatosPerfil(payload: ActualizarDatosPerfilRequest): Observable<any>{
    return this.http.patch<any>(`${this.apiUrl}/usuarios/actualizarDatosPerfil`, payload);
  }

   actualizarPassword(payload: ActualizarPasswordRequest):Observable<any>{
    return this.http.patch<any>(`${this.apiUrl}/usuarios/actualizarPassword`,payload);
   }
}
