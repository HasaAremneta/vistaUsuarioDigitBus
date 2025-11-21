import { inject } from '@angular/core';
import { routes } from './../../app.routes';
import { CanActivateFn, Router } from '@angular/router';
import { StorageService } from '../services/storage.service';

export const authGuardGuard: CanActivateFn = () => {
  //Verifica si el usuario tiene un token de autorizacion antes de permitir el acceso a una ruta protegida
  //esto para proteger las rutas que requieren autenticacion
  const routes = inject(Router);
  const storage = inject(StorageService);
  const token = storage.getToken();

  if (!token) {
    routes.navigate(['/login']);
    return false;
  }
  return true;
};
