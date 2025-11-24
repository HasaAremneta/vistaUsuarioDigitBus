export interface DocumentoSolicitud {
    tipo: string;          
    nombre: string;        
    base64Data: string;
}

export interface SolicitudPayload {
    tipo: string;                   
    idPersonal: string;             
    observaciones: string;          
    documentos: DocumentoSolicitud[];
}

export interface SolicitudResponse {
    success: boolean;
    message?: string;
}