import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
//Servicio para manejar el almacenamiento del token de autorizacion
export class StorageService {
  //Guardar el token en el almacenamiento local
  setToken(token: string){
    localStorage.setItem('token', token);
  }
  //Obtener el token del almacenamiento local
  getToken(): string | null {
    return localStorage.getItem('token');
  }
//Eliminar el token del almacenamiento local
  clearToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('idPersonal');
  }
}
