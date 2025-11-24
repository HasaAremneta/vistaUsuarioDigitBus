export interface ValidarPasswordRequest{
    nombre: string;
    password: string;
}


export interface ValidarPasswordResponse {
  valid: boolean;
}

export interface ActualizarDatosPerfilRequest {
  nombreUsuarioActual: string;
  nuevoNombreUsuario: string;
  correo: string;
}

export interface ActualizarPasswordRequest {
  nombreUsuario: string;
  nuevaPassword: string;
}