import { Renovaciones } from './renovaciones/renovaciones';
import { Routes } from '@angular/router';
import { Login } from './auth/login/login'
import { Registro } from './auth/registro/registro';
import { Recuperacion } from './auth/recuperacion/recuperacion';
import { Conocenos } from './conocenos/conocenos';
import { Home } from './home/home';
import { Historial } from './historial/historial';
import { Solicitudes } from './solicitudes/solicitudes';
import { Ajustes } from './ajustes/ajustes';
import { AjustesPerfil } from './ajustes-perfil/ajustes-perfil';
import { AgregarTarjeta } from './agregar-tarjeta/agregar-tarjeta';
import { PaymentMenu } from './payment-menu/payment-menu';
import { PagoSucursal } from './pago-sucursal/pago-sucursal';
import { PaymentSuccess } from './payment-success/payment-success';

export const routes: Routes = [
  { path: '',redirectTo: 'login', pathMatch: 'full'},
  //Todo lo que tiene que ver con Login, Registro y Recuperacion de contrasena
  {path: 'login', component: Login},
  {path: 'registro', component: Registro},
  {path: 'recuperacion', component: Recuperacion},
  {path: 'conocenos', component: Conocenos},

  //Home
  {path: 'home', component: Home},
  //Historial
  {path: 'historial', component: Historial},
  //Solicitudes
  {path: 'Solicitudes', component: Solicitudes},
  //Renovacion y Extravio
  {path: 'renovaciones', component: Renovaciones},
  //Ajustes
  {path: 'ajustes', component: Ajustes},
  //Ajustes de Perfil
  {path: 'ajustes-perfil', component: AjustesPerfil},
  //Agregar Tarjeta
  {path: 'agregar-tarjeta', component: AgregarTarjeta},
  //Pago Menu
  {path: 'payment-menu', component: PaymentMenu},
  //Pago Sucursal
  {path: 'pago-sucursal', component: PagoSucursal},

  {path: 'payment-success', component: PaymentSuccess} 
  
];
