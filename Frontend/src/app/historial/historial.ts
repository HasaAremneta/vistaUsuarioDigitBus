import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HistorialService } from './historial.service';
import { Tarjeta, Recarga } from './historial.models';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial.html',
  styleUrl: './historial.css',
})
export class Historial implements OnInit {

  tarjetas: Tarjeta[] = [];
  recargasPorTarjetas: { [idTarjeta: number]: Recarga[] } = {};
  loading: boolean = false;
  error: string | null = null;

  constructor(private historialService: HistorialService, private router: Router){}

  ngOnInit(): void {
    const idPersonal = localStorage.getItem('idPersonal');
    if (!idPersonal) {
      this.router.navigate(['/login']);
      return;
    }

    this.cargarTarjetasYRecargas(idPersonal);
  }

  private cargarTarjetasYRecargas(idPersonal: string): void {
    this.loading = true;
    this.error = null;

    this.historialService.getTarjetas(idPersonal).subscribe({
      next:(response) => {
        this.tarjetas = response.tarjetas || [];

        if(this.tarjetas.length === 0){
          this.loading = false;
          return;
        }

        let pendientes = this.tarjetas.length;

        this.tarjetas.forEach((tarjeta) => {
          this.historialService.getRecargas(tarjeta.IDTARJETA).subscribe({
            next:(recRes) => {
              this.recargasPorTarjetas[tarjeta.IDTARJETA] = recRes.recargas || [];
            },
            error:(err) => {
              console.log("Error al cargar recargas:",err);
              this.recargasPorTarjetas[tarjeta.IDTARJETA] = [];
            },
            complete: () => {
              pendientes--;
              if (pendientes === 0) {
                this.loading = false;
              }
            }
          });
        });
      },
      error:(err) => {
        console.log('Error al cargar tarjetas:',err);
        this.error = 'Error al cargar el historial. Por favor, inténtelo de nuevo más tarde.';
        this.loading = false;
      }
    });
  }

  getRecargas(tarjetaId: number): Recarga[] {
    return this.recargasPorTarjetas[tarjetaId] || [];
  }
}
