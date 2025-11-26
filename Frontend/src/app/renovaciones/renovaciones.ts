import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RenovacionesService } from './renovaciones.service';
import { DocumentoRenovacion, RenovacionPayload } from './renovaciones.models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-renovaciones',
  standalone:true,
  imports: [CommonModule,FormsModule],
  templateUrl: './renovaciones.html',
  styleUrl: './renovaciones.css',
})
export class Renovaciones implements OnInit {
  
  accion: '' | 'renovacion' | 'extravio' = '';
  tipoSeleccionado: '' | 'estudiante' | 'tercera' | 'discapacidad' | 'general' = '';
  documentos: DocumentoRenovacion[] = [];
  sucursal: string = '';
  enviando = false;

  idPersonal: string | null = null;

  sucursales: string[] = [
    'Terminal San Jerónimo',
    'Terminal San Juan Bosco',
    'Terminal Timoteo Lozano',
    'Terminal Maravillas',
    'Terminal Delta',
    'Micro Estación Santa Rita',
    'Terminal Portales de la Arboleda'
  ];

  constructor(private renovacionesService:RenovacionesService, private router:Router, private cdr: ChangeDetectorRef){}

  onPanelClick(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    // Si el click fue sobre un input file (o un hijo del label), detectar y loggear
    const inputEl = (target.closest && target.closest('input[type="file"]')) as HTMLInputElement | null;
    if (inputEl) {
      console.log('onPanelClick detected click on file input:', inputEl, 'files:', inputEl.files);
    }
  }

  debugFileClick(event: Event): void {
    console.log('debugFileClick event:', event, 'target:', event.target);
  }

  ngOnInit(): void {
      this.idPersonal = localStorage.getItem('idPersonal');
      if(!this.idPersonal){
        console.log('No se encontró idPersonal. Redirigiendo a login.');
        this.router.navigate(['/login']);
      }
  }

  get accionTitle():string {
    if(this.accion === 'extravio') return 'extravío';
    if (this.accion === 'renovacion') return 'renovación';
    return '';
  }

  get panelTitle():string{
    const map: any = {
      estudiante: 'Personas Estudiantes',
      tercera: 'Personas de la tercera edad',
      discapacidad: 'Personas con Discapacidad',
      general: 'General'
    };
    const tipo = map[this.tipoSeleccionado] || 'Ninguno';
    return `${this.accionTitle || 'solicitud'} de ${tipo}`;
  }

  onAccionChange(): void{
    // si es renovación, validamos que tenga tarjeta estudiante
    if(this.accion === 'renovacion'){
      this.tipoSeleccionado = 'estudiante';
      this.validaTipoRenovacion();
    }else{
      this.tipoSeleccionado = '';
    }
    this.documentos = [];
  }

  private validaTipoRenovacion():void{
    if(!this.idPersonal) return;

    this.renovacionesService.getTarjetas(this.idPersonal).subscribe({
      next: (res) => {
        const tarjetas = res.tarjetas || [];
        const anyEstuduiante = tarjetas.some( t => t.TIPO?.toLowerCase().trim() === 'estudiante');
        
        if(!anyEstuduiante){
          alert('No tienes tarjeta de tipo estudiante. La renovación solo aplica a estudiantes.')
          this.accion = '';
          this.tipoSeleccionado = '';
        }
      },
      error: (err) => {
        console.log('Error al obtener tarjetas:', err);
        alert('No se pudieron obtener tus tarjetas para validar la renovación.')
        this.accion = '';
        this.tipoSeleccionado = '';
      }
    });
  }

  pickTipo(t: 'estudiante' | 'tercera' | 'discapacidad' | 'general'):void{
    if(this.accion === 'renovacion' && t !== 'estudiante'){
      return;
    }
    this.tipoSeleccionado = t;
    this.documentos = [];
  }

  private convertirABase64 (file: File): Promise<string>{
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = (error) => reject(error);
      r.readAsDataURL(file);
    });
  }

  async subirArchivo(event: Event, tipoDoc: string){
    const input = event.target as HTMLInputElement;
    console.log('subirArchivo triggered, input:', input);
    if(!input.files || input.files.length === 0) {
      console.log('No files found on input.');
      return;
    }

    const f = input.files[0];
    console.log('File selected:', f.name, f.size, f.type);
    try{
      const base64 = await this.convertirABase64(f);
      const soloBase64 = (base64 || '').toString().split(',')[1] || '';
      this.documentos.push({
        tipo: tipoDoc,
        nombre: f.name,
        base64Data: soloBase64
      });
      console.log('Documentos after push:', this.documentos);
      this.cdr.detectChanges(); // asegurar re-render inmediato
      // limpiar el input para permitir volver a seleccionar el mismo archivo si se necesita
      input.value = '';
    }catch (err){
      console.log('Error al convertir archivo a base64', err);
      alert('Ocurrió un error al leer el archivo.');
    }
  }

  private tipoBackend(t: string): string{
    if (t === 'estudiante') return 'ESTUDIANTE';
    if (t === 'tercera') return 'TERCERA_EDAD';
    if (t === 'discapacidad') return 'DISCAPACIDAD';
    if (t === 'general') return 'GENERAL';
    return '';
  }

  private validar(): string | null {
    if(!this.accion) return 'Selecciona una acción.';
    if(!this.tipoSeleccionado) return 'Selecciona un tipo de tarjeta.';
    if(this.accion === 'renovacion' && this.tipoSeleccionado !== 'estudiante'){
      return 'La renovación solo aplica para Estudiantes.';
    }

    if (!this.sucursal) return 'Selecciona una sucursal de entrega.';
    if (!this.documentos.length) return 'Agrega al menos un archivo.';

    if(this.accion === 'renovacion'){
      const tieneComprobante = this.documentos.some(d => d.tipo === 'comprobante');
      if (!tieneComprobante) return 'Adjunta el comprobante para renovar.';
    }

    if(this.accion === 'extravio'){
      const requiereId = this.tipoSeleccionado !== 'general';
      const tieneFoto = this.documentos.some(d => d.tipo === 'foto');
      const tieneId = this.documentos.some(d => d.tipo === 'identificacion');
      const tieneVoucher = this.documentos.some(d => d.tipo === 'voucher');

      if(this.tipoSeleccionado === 'general' && !tieneVoucher){
        return 'Adjunta el voucher.';
      }

      if(requiereId && (!tieneId || tieneFoto)){
        return 'Adjunta identificación y foto.';
      }
    }
    return null;
  }

  enviar(): void {
    const error = this.validar();
    if(error){
      alert(error);
      return
    }

    const payload: RenovacionPayload = {
      tipo: this.tipoBackend(this.tipoSeleccionado),
      documentos: this.documentos,
      observaciones: `Sucursal: ${this.sucursal}`
    };

    this.enviando = true;

    const request$ = this.accion === 'renovacion' ? this.renovacionesService.enviarRenovacion(payload) : this.renovacionesService.enviarExtravio(payload);

    request$.subscribe({
      next: (resp) => {
        this.enviando = false;
        if(resp.success){
          alert('Tu trámite fue enviado correctamente.');
          this.documentos = [];
          this.sucursal = '';
          this.tipoSeleccionado = '';
          this.accion = '';
        }else{
          alert(resp.message || 'Error inesperado en el servidor.');
        }
      },
      error: (err) => {
        console.error(err);
        this.enviando = false;
        alert('No se pudo enviar el trámite.');
        
      }
    });
  }
}
