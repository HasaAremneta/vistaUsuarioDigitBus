export interface LoginRequest{
  NombreUsuario: string;
  password: string;
}

export interface User{
  IDUSUARIOS: number;
  IDPERSONAL: number;
  NOMBRE: string;
  CORREO: string;
}

export interface LoginResponse{
  message: string;
  token: string;
  user: User;
}

//interfas para el registro de usuarios
export interface RegisterRequest{
  NombreUsuario: string;
  Nombre: string;
  ApellidoPaterno: string;
  ApellidoMaterno: string;
  DiaNacimiento: string;
  MesNacimiento: string;
  AnoNacimiento: string;
  Correo: string;
  password: string;
}

export interface RegisterResponse{
  message: string;
}

//interfas para resetear la contraseña
export interface RecoverRequest{
  correo:string;
}

export interface RecoverResponse{
  message: string;
}
