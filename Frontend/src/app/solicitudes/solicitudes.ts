import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SolicitudesService } from './solicitudes.service';
import { DocumentoSolicitud, SolicitudPayload } from './solicitudes.models';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitudes.html',
  styleUrl: './solicitudes.css',
})
export class Solicitudes implements OnInit {
  tipoSeleccionado: string = '';
  metodo: string = '';
  sucursal: string = '';
  documentos: DocumentoSolicitud[] = [];
  correo: string = '';
  telefono: string = '';

  idPersonal: string | null = null;

  //modal sencillo local
  showModal = false;
  modalTitle = '';
  modalMessage = '';

  loading = false;

  sucursales: string[] = [
    'Terminal San Jerónimo',
    'Terminal San Juan Bosco',
    'Terminal Timoteo Lozano',
    'Terminal Maravillas',
    'Terminal Delta',
    'Micro Estación Santa Rita',
    'Terminal Portales de la Arboleda'
  ];

  constructor(private solicitudesService: SolicitudesService, private router: Router){}

  ngOnInit(): void {
    this.idPersonal = localStorage.getItem('idPersonal');
    if (!this.idPersonal) {
      console.log('No se encontró idPersonal. Usuario no autenticado.');
      this.router.navigate(['/login']);
    }
  }
  get labelTipo(): string {
    switch (this.tipoSeleccionado) {
      case 'estudiante': return 'Estudiantes';
      case 'tercera': return 'Personas de la tercera edad';
      case 'discapacidad': return 'Personas con Discapacidad';
      default: return 'Ninguno';
    }
  }

  async subirArchivo(event: Event, tipoDoc: string) {
    const input = event.target as HTMLInputElement;
    if(!input.files || input.files.length === 0) return;

    const archivo = input.files[0];
    try{
      const base64 = await this.convertirABase64(archivo);
      const soloBase64 = base64.split(',')[1] || base64;

      this.documentos.push({
        tipo: tipoDoc,
        nombre: archivo.name,
        base64Data: soloBase64
      });

      //limpiar el input para permitir subir el mismo archivo nuevamente si es necesario
      input.value = '';
    }catch(error){
      console.log('Error al convertir archivo a base64',error);
    }
  }

  private convertirABase64(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  private tipoBackend(tipo: string): string {
    if (tipo === 'estudiante') return 'ESTUDIANTE';
    if (tipo === 'tercera') return 'TERCERA_EDAD';
    if (tipo === 'discapacidad') return 'DISCAPACIDAD';
    if (tipo === 'general') return 'GENERAL';
    return '';
  }
  async enviarSolicitud() {
    if (!this.idPersonal) {
      this.showCustomModal('Error', 'No se encontró el usuario autenticado.');
      return;
    }

    if (!this.tipoSeleccionado) {
      this.showCustomModal('Datos incompleto', 'Selecciona un tipo de solicitud.');
      return;
    }

    if(!this.sucursal){
      this.showCustomModal('Datos incompleto', 'Selecciona una sucursal de entrega.');
      return;
    }

    const contacto =
      this.metodo === 'correo'
        ? this.correo
        : this.metodo === 'telefono'
        ? this.telefono
        : '';

    const observaciones = `Método: ${
      this.metodo || 'no especificado'
    } ${contacto ? contacto : ''}. Sucursal: ${this.sucursal}`;

    const payload: SolicitudPayload = {
      tipo: this.tipoBackend(this.tipoSeleccionado),
      idPersonal: this.idPersonal,
      observaciones,
      documentos: this.documentos
    };

    this.loading = true;

    this.solicitudesService.enviarSolicitud(payload).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.showCustomModal('Solicitud Enviada', response.message || 'Tu solicitud fue enviada correctamente.'); 
          setTimeout(() => {
            this.closeCustomModal();
            this.router.navigate(['/home']);
          }, 1500) ;
        } else {
          this.showCustomModal('Error en solicitud',response.message || 'Error inesperado en el servidor.')
        }
      },
      error: (error) => {
        console.log(error);
        this.loading = false;
        this. showCustomModal('Error de red','No se pudo conectar con el servidor.');
      }
    });
  }

  showCustomModal(title: string, message: string){
    this.modalTitle = title;
    this.modalMessage = message;
    this.showModal = true;
  }
  
  closeCustomModal() {
    this.showModal = false;
  }
}
