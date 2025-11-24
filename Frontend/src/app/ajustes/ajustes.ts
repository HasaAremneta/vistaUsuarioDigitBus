import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ajustes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ajustes.html',
  styleUrl: './ajustes.css',
})
export class Ajustes {
  showModal = false;
  modalTitle = '';
  modalMessage = '';

  constructor(private router: Router){}

  goToAccountSettings(): void{
    this.router.navigate(['/ajustes-perfil']);
  }

  goToAddCard(): void{
    this.router.navigate(['/agregar-tarjeta']);
  }

  goBack(): void {
    window.history.back();
  }

  showCustomModal(title: string, message: string): void {
    this.modalTitle = title;
    this.modalMessage = message;
    this.showModal = true;
  }

  closeCustomModal(): void{
    this.showModal = false;
  }
}
