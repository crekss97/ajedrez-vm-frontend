export interface EventoLinkExterno {
  id: string;
  titulo: string;
  url: string;
}

export interface EventoAdjunto {
  id: string;
  nombre: string;
  url: string;
  tipo: string;
}

export type EventoModalidad = 'Presencial' | 'Online' | 'Hibrido';
export type EventoEstadoEditorial = 'draft' | 'published';

export interface Evento {
  id: number;
  slug: string;
  titulo: string;
  categoria: string;
  descripcionCorta: string;
  descripcionLarga: string;
  fechaInicio: string;
  fechaFin?: string;
  ubicacion: string;
  organizador: string;
  imagenUrl: string;
  destacado: boolean;
  modalidad: EventoModalidad;
  precio: string;
  tags: string[];
  views: number;
  linksExternos?: EventoLinkExterno[];
  adjuntos?: EventoAdjunto[];
  estadoEditorial?: EventoEstadoEditorial;
  fuente?: 'api' | 'editor';
  creadoPor?: string;
  actualizadoEn?: string;
}
