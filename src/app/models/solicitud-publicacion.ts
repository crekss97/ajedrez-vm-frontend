export interface SolicitudPublicacionInput {
  nombre: string;
  apellido: string;
  email: string;
  nombreTorneo: string;
}

export interface SolicitudPublicacion {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  nombreTorneo: string;
  creadoEn: string;
  imagenUrl: string;
  pdfUrl: string;
}
