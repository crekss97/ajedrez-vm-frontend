export interface SolicitudPublicacionInput {
  nombre: string;
  apellido: string;
  email: string;
  nombreTorneo: string;
}

export type EstadoNotificacionCorreo = 'pendiente' | 'procesando' | 'enviada' | 'fallida';

export interface NotificacionCorreo {
  estado: EstadoNotificacionCorreo;
  intentos: number;
  ultimoError: string | null;
  ultimoIntentoEn: string | null;
  enviadaEn: string | null;
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
  notificacionCorreo: NotificacionCorreo | null;
}
