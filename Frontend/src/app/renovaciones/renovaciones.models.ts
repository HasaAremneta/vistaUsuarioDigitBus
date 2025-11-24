export interface DocumentoRenovacion {
    tipo: string;        
    nombre: string;
    base64Data: string;
}

export interface RenovacionPayload{
    tipo: string;                 
    documentos: DocumentoRenovacion[];
    observaciones: string; 
}

export interface RenovacionResponse{
    success: boolean;
    message?: string;
}
export interface TarjetaRenovacion{
    IDTARJETA: number;
    NUMTARJETA: string;
    TIPO: string;
}

export interface TarjetasRenovacionResponse {
    tarjetas: TarjetaRenovacion[];
}