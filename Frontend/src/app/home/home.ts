import { routes } from './../app.routes';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';

interface AccesoRapido {
  titulo: string;
  descripcion: string;
  icon:string;
  ruta: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})

export class Home {
  currentUser:string = localStorage.getItem('username') || 'Usuario';
  lstVisible = false;
  ajustesHover = false;

  accesos: AccesoRapido[] = [
    {
      titulo: 'Hisorial de pagos',
      descripcion: 'Consulta tu historial de pagos y transacciones.',
      icon: 'pi pi-history',
      ruta: '/historial'
    },
    {
      titulo: 'Recargas',
      descripcion: 'Recarga tu saldo de forma fácil y rápida.',
      icon: 'pi pi-credit-card',
      ruta: '/pago-sucursal'
    },
    {
      titulo: 'Solicitudes',
      descripcion: 'Realiza solicitudes y gestiona tus servicios. (Mantenimiento)',
      icon: 'pi pi-file-plus',
      ruta: '/Solicitudes'
    },
    {
      titulo: 'Renovaciones y extravíos',
      descripcion: 'Renueva tu servicio de forma sencilla o reporta extravíos.',
      icon: 'pi pi-file-arrow-up',
      ruta: '/renovaciones'
    },
  ];

  constructor(private router: Router) { }

  irARuta(ruta: string) {
    this.router.navigate([ruta]);
  }

  confirmarSalida() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('email');
      localStorage.removeItem('idPersonal');
      this.router.navigate(['/login']);
    }
  }

  toggleUserList(){
    this.lstVisible = !this.lstVisible;
  }
}
