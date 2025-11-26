import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { ValidarPasswordRequest, ValidarPasswordResponse, ActualizarDatosPerfilRequest, ActualizarPasswordRequest, TarjetaUsuario } from './usuarios.models';

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

   //Metodo de Agregar Tarjeta
   getTarjetasUsuario(idPersonal: string): Observable<TarjetaUsuario[]> {
  return this.http.get<TarjetaUsuario[]>(`${this.apiUrl}/usuarios/tarjetasU/${idPersonal}`);
}

   crearTarjeta(payload: {idPersonal: string; numTarjeta: string; tipo: string;}):Observable<any>{
    return this.http.post<any>(`${this.apiUrl}/usuarios/nuevaTarjeta`,payload);
   }
   eliminarTarjeta(idTarjeta:number):Observable<any>{
    return this.http.delete<any>(`${this.apiUrl}/usuarios/eliminarTarjeta/${idTarjeta}`);
   }
}
