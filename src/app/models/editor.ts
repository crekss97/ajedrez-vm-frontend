import { Evento, EventoAdjunto, EventoEstadoEditorial, EventoLinkExterno, EventoModalidad } from './evento';

export type EditorRole = 'editor' | 'admin';

export interface EditorSession {
  id: string;
  email: string;
  displayName: string | null;
  role: EditorRole;
}

export interface EventoEditorInput {
  slug?: string;
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
  tags: string[];
  linksExternos: EventoLinkExterno[];
  adjuntos: EventoAdjunto[];
  estadoEditorial: EventoEstadoEditorial;
}

export interface EventoEditorDraft extends Evento {
  estadoEditorial: EventoEstadoEditorial;
  fuente: 'editor';
  creadoPor: string;
  actualizadoEn: string;
}
