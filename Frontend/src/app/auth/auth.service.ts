import { Injectable } from '@angular/core';
import { environment } from '../../environment/environment';
import { HttpClient } from '@angular/common/http';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, RecoverRequest,RecoverResponse } from './auth.models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient){}

  //Metodo para iniciar sesion
  login(payload:LoginRequest):Observable<LoginResponse>{
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, payload);
  }

  //Metodo para registrar usuario
  register(payload: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/usuarios/registro`, payload)
  }

  //Metodo para resetear la contraseña
  recoverPassword(payload: RecoverRequest): Observable<RecoverResponse> {
    return this.http.post<RecoverResponse>(`${this.apiUrl}/recuperar/solicitar`, payload);
  }
}
