import { Routes } from '@angular/router';
import { Login } from './auth/login/login'
import { Registro } from './auth/registro/registro';
import { Recuperacion } from './auth/recuperacion/recuperacion';
import { Conocenos } from './conocenos/conocenos';
import { Home } from './home/home';

export const routes: Routes = [
  { path: '',redirectTo: 'login', pathMatch: 'full'},
  //Todo lo que tiene que ver con Login, Registro y Recuperacion de contrasena
  {path: 'login', component: Login},
  {path: 'registro', component: Registro},
  {path: 'recuperacion', component: Recuperacion},
  {path: 'conocenos', component: Conocenos},

  //Home
  {path: 'home', component: Home},

];
