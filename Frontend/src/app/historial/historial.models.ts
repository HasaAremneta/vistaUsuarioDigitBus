export interface Tarjeta{
    IDTARJETA: number;
    NUMTARJETA: string;
    TIPO: string;
    SALDO: number;
}

export interface Recarga{
    IDRECARGA: number;
    IDTARJETA: number;
    MONTO: number;
    TIPOTRANSACCION: string;
    STATUS: string;
    FECHARECARGA: string; // viene como string de la API
    NOMBREESTABLECIMIENTO?: string | null;
}

export interface TarjetasResponse{
    tarjetas: Tarjeta[];
}

export interface RecargasResponse{
    recargas: Recarga[];
}