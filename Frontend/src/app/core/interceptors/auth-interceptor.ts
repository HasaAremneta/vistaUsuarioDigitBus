import { StorageService } from './../services/storage.service';
import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';

//Agrega un token de autorizacion a las solicitudes salientes
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const storage = inject(StorageService);
  const token = storage.getToken();

  if (token) {
    const authRq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authRq);
  }

  return next(req);
};
