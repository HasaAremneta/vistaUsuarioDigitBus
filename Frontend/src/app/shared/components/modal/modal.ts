import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrl: './modal.css',
})
export class Modal {
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() showCloseButton: boolean = true;

  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }
}
