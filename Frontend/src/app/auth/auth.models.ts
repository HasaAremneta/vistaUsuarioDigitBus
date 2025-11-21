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
