import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { HistorialService } from './historial.service';
import { Tarjeta, Recarga } from './historial.models';
import { forkJoin, catchError, of } from 'rxjs';

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

  constructor(private historialService: HistorialService, private router: Router,  private cdr: ChangeDetectorRef){}

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
      next: (response) => {
        this.tarjetas = response.tarjetas || [];
        console.log('Tarjetas cargadas:', this.tarjetas);
        this.cdr.detectChanges(); 

        if (this.tarjetas.length === 0) {
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        
        const recargasObservables = this.tarjetas.map((tarjeta) =>
          this.historialService.getRecargas(tarjeta.IDTARJETA).pipe(
            catchError((err) => {
              console.error(`Error al cargar recargas de tarjeta ${tarjeta.IDTARJETA}:`, err);
              return of({ recargas: [] }); 
            })
          )
        );

        console.log('Observables creados:', recargasObservables.length);
        
        forkJoin(recargasObservables).subscribe({
          next: (results) => {
            const recargasTemp: { [idTarjeta: number]: Recarga[] } = {};
            
            results.forEach((recRes, index) => {
              const tarjeta = this.tarjetas[index];
              const recargas = recRes.recargas || [];

              recargasTemp[tarjeta.IDTARJETA] = recargas;
              console.log(`Recargas cargadas para tarjeta ${tarjeta.IDTARJETA}:`, recargas.length);
            });

            
            this.recargasPorTarjetas = { ...recargasTemp };
            this.loading = false;
            this.cdr.detectChanges(); 
          },
          error: (err) => {
            console.error("Error al cargar recargas:", err);
            this.loading = false;
            this.cdr.detectChanges(); 
          }
        });
      },
      error: (err) => {
        console.error('Error al cargar tarjetas:', err);
        this.error = 'Error al cargar el historial. Por favor, inténtelo de nuevo más tarde.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }


  getRecargas(tarjetaId: number): Recarga[] {
    return this.recargasPorTarjetas[tarjetaId] || [];

  }
}
